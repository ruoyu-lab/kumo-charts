import { readFileSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { extname, join, relative } from 'node:path';
import { normalizePath, type Logger, type Plugin, type ViteDevServer } from 'vite';
import { sitePath, siteUrl } from '../src/shared/base';
import { LANGUAGES } from '../src/shared/ui-text';
import { extractApi } from './api/extract';
import type { ApiModel } from './api/model';
import { siteConfig, type SiteConfig } from './config';
import { escapeHtml } from './html';
import { displayPath, formatProblem } from './problems';
import { buildSite, NOT_FOUND_URL, type Site } from './site';

export interface DocsPluginOptions {
  /** The documentation, relative to the repository: `docs`, or the pages of the tests. */
  readonly docsDir: string;
}

/** The file a page or frame is built to: `/docs/zh-CN/data/` is `zh-CN/data/index.html`. */
export function htmlFile(siteDir: string, url: string): string {
  const path = sitePath(url) ?? url;
  return join(siteDir, path === '' || path.endsWith('/') ? `${path}index.html` : path);
}

/** The address of a page or frame from its file: `zh-CN/data/index.html` is `/docs/zh-CN/data/`. */
function fileUrl(siteDir: string, file: string): string {
  return siteUrl(displayPath(siteDir, file).replace(/(^|\/)index\.html$/, '$1'));
}

const TYPES: Readonly<Record<string, string>> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

function send(response: ServerResponse, status: number, type: string, body: string | Buffer): void {
  response.statusCode = status;
  response.setHeader('Content-Type', type);
  response.end(body);
}

function warn(logger: Logger, config: SiteConfig, site: Site): void {
  for (const warning of site.warnings) {
    logger.warn(`warning: ${formatProblem(warning, config.siteDir)}`);
  }
}

/** Whether an address can only be a page of the site, so that it is a missing page if unknown. */
function isPageAddress(url: string): boolean {
  const path = sitePath(url);
  return (
    path !== null &&
    (path === '' ||
      path.endsWith('/') ||
      path.endsWith('.html') ||
      LANGUAGES.some((language) => path === language || path.startsWith(`${language}/`)))
  );
}

/**
 * Builds the documentation into the site: in development it serves the pages from memory and
 * rebuilds them when the Markdown or the sources change; the build writes every page, frame,
 * search index and image.
 */
export function docsPlugin(options: DocsPluginOptions): Plugin {
  const config = siteConfig(options.docsDir);
  let site: Site | null = null;
  let api: ApiModel | null = null;
  /**
   * Files of the modules of the examples, so that they resolve and load from memory: by their path
   * with forward slashes, as Vite gives ids on every system.
   */
  const modules = new Map<string, string>();

  const update = (built: Site) => {
    site = built;
    modules.clear();

    for (const [url, code] of built.exampleModules) {
      modules.set(normalizePath(join(config.siteDir, url)), code);
    }
  };

  const dev = (server: ViteDevServer) => {
    let current: Promise<void> = Promise.resolve();
    let failure: unknown = null;

    const rebuild = () => {
      current = current.then(async () => {
        try {
          api ??= extractApi(config.chartsRoot);
          const built = await buildSite(config, api);
          update(built);
          failure = null;
          warn(server.config.logger, config, built);
        } catch (error) {
          failure = error;
          server.config.logger.error(error instanceof Error ? error.message : String(error));
        }

        const graph = server.environments.client.moduleGraph;

        for (const id of modules.keys()) {
          const module = graph.getModuleById(id);

          if (module) {
            graph.invalidateModule(module);
          }
        }

        server.ws.send({ type: 'full-reload' });
      });
    };

    const sources = join(config.chartsRoot, 'packages');
    server.watcher.add([config.docsDir, sources]);
    server.watcher.on('all', (_event, path) => {
      const inDocs = !relative(config.docsDir, path).startsWith('..');
      const inSources = !relative(sources, path).startsWith('..') && /\/src\/.*\.ts$/.test(path);

      if (inSources) {
        api = null;
      }

      if (inDocs || inSources) {
        rebuild();
      }
    });
    rebuild();

    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url ?? '/', 'http://localhost').pathname;

      void current.then(async () => {
        if (failure !== null || !site) {
          const message = failure instanceof Error ? failure.message : String(failure);
          const html = await server.transformIndexHtml(
            url,
            `<!doctype html><html><head><meta charset="utf-8" /><title>Error</title></head><body><pre style="white-space:pre-wrap;font:14px/1.5 monospace;padding:24px">${escapeHtml(message)}</pre></body></html>`
          );
          send(response, 500, 'text/html; charset=utf-8', html);
          return;
        }

        const page = site.pages.get(url) ?? site.examplePages.get(url);
        const index = site.searchIndexes.get(url);
        const image = site.images.get(url);

        if (page !== undefined) {
          send(
            response,
            200,
            'text/html; charset=utf-8',
            await server.transformIndexHtml(url, page)
          );
        } else if (index !== undefined) {
          send(response, 200, 'application/json; charset=utf-8', index);
        } else if (image !== undefined) {
          send(
            response,
            200,
            TYPES[extname(image).toLowerCase()] ?? 'application/octet-stream',
            readFileSync(image)
          );
        } else if (site.pages.has(`${url}/`)) {
          response.statusCode = 301;
          response.setHeader('Location', `${url}/`);
          response.end();
        } else if (isPageAddress(url)) {
          const notFound = site.pages.get(NOT_FOUND_URL) ?? '';
          send(
            response,
            404,
            'text/html; charset=utf-8',
            await server.transformIndexHtml(url, notFound)
          );
        } else {
          next();
        }
      }, next);
    });
  };

  return {
    name: 'kumo-charts-docs',
    enforce: 'pre',

    async config(_config, environment) {
      if (environment.command !== 'build') {
        return {};
      }

      const built = await buildSite(config);
      update(built);
      const urls = [...built.pages.keys(), ...built.examplePages.keys()];
      return {
        build: {
          rolldownOptions: { input: urls.map((url) => htmlFile(config.siteDir, url)) }
        }
      };
    },

    configResolved(resolved) {
      if (resolved.command === 'build' && site) {
        warn(resolved.logger, config, site);
      }
    },

    configureServer: dev,

    resolveId(id) {
      const inSite = normalizePath(id).startsWith(normalizePath(config.siteDir));
      const file = normalizePath(inSite ? id : join(config.siteDir, id));

      if (modules.has(file)) {
        return file;
      }

      const built = site;
      const url = fileUrl(config.siteDir, file);
      return built && (built.pages.has(url) || built.examplePages.has(url)) && id.endsWith('.html')
        ? file
        : null;
    },

    load(id) {
      const module = modules.get(normalizePath(id));

      if (module !== undefined) {
        return module;
      }

      const built = site;

      if (!built || !id.endsWith('.html')) {
        return null;
      }

      const url = fileUrl(config.siteDir, id);
      return built.pages.get(url) ?? built.examplePages.get(url) ?? null;
    },

    generateBundle() {
      const built = site;

      if (!built) {
        return;
      }

      for (const [url, json] of built.searchIndexes) {
        this.emitFile({ type: 'asset', fileName: sitePath(url) ?? url, source: json });
      }

      for (const [url, path] of built.images) {
        this.emitFile({
          type: 'asset',
          fileName: sitePath(url) ?? url,
          source: readFileSync(path)
        });
      }
    }
  };
}
