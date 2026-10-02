#!/bin/zsh
set -eu

runner_dir="${0:A:h}"
if [[ ! -f "$runner_dir/.env" ]]; then
  echo "Missing $runner_dir/.env. Copy .env.example and fill in its secrets."
  exit 1
fi

set -a
source "$runner_dir/.env"
set +a
exec /usr/bin/env python3 "$runner_dir/runner.py"
