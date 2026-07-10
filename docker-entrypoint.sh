#!/bin/sh
set -eu

database_url=${TURSO_DATABASE_URL:-file:/data/local.db}
export TURSO_DATABASE_URL=$database_url

# An empty token is valid for local libSQL and must not be passed to remote clients.
if [ -z "${TURSO_AUTH_TOKEN:-}" ]; then
  unset TURSO_AUTH_TOKEN
fi

case "$database_url" in
  file:/*)
    database_path=${database_url#file:}
    database_path=${database_path%%\?*}
    database_path=${database_path%%\#*}

    if [ -z "$database_path" ]; then
      echo "TURSO_DATABASE_URL must include a path after file:" >&2
      exit 1
    fi

    case "$database_path" in
      */*)
        database_directory=${database_path%/*}
        [ -n "$database_directory" ] || database_directory=/
        ;;
      *)
        database_directory=.
        ;;
    esac

    mkdir -p "$database_directory"
    ;;
  file:*)
    echo "Production file database URLs must use an absolute path under a persistent mount (for example file:/data/local.db)" >&2
    exit 1
    ;;
esac

bun run /app/scripts/migrate.ts
exec bun build/index.js
