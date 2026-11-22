#!/usr/bin/env bash
# Deploys the documentation site: builds docs/dist and puts it on the server in place of the one there.
#
#   KUMOCHART_SERVER=<ssh host> docs/deploy.sh
#
# The host is one ssh reaches without a password (a name of ~/.ssh/config). The site is the library as this checkout
# has it, so check out the version published as latest first, for the site to match what users install. The web
# server's configuration and certificate for docs.kumocharts.com are set up with the website's, not here.
set -euo pipefail

SERVER="${KUMOCHART_SERVER:?Set KUMOCHART_SERVER to the ssh host of the server.}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE=/srv/kumochart/www/docs

echo "== Building the site"
(cd "$ROOT" && npm run build:docs)

SUDO=$(ssh "$SERVER" '[ "$(id -u)" = 0 ] || echo sudo')

echo "== Uploading"
ssh "$SERVER" "$SUDO mkdir -p $REMOTE"
# With rsync, the new files take the place of the old ones once all are there. Without it (Git Bash on Windows has
# none), a tar unpacked beside the site takes its place whole: either way a page never misses a file.
if command -v rsync >/dev/null 2>&1; then
  rsync -az --no-owner --no-group --delete-after --delay-updates --rsync-path="$SUDO rsync" "$ROOT/docs/dist/" "$SERVER:$REMOTE/"
else
  ssh "$SERVER" "$SUDO rm -rf '$REMOTE.new' && $SUDO mkdir -p '$REMOTE.new'"
  tar -C "$ROOT/docs/dist" -czf - . | ssh "$SERVER" "$SUDO tar --no-same-owner -xzf - -C '$REMOTE.new'"
  ssh "$SERVER" "$SUDO rm -rf '$REMOTE.old' && { [ ! -e '$REMOTE' ] || $SUDO mv '$REMOTE' '$REMOTE.old'; } \
    && $SUDO mv '$REMOTE.new' '$REMOTE' && $SUDO rm -rf '$REMOTE.old'"
fi

echo "== Done: https://docs.kumocharts.com/"
