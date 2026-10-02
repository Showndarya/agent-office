#!/bin/zsh
set -eu

runner_dir="${0:A:h}"
template="$runner_dir/launchd.plist.template"
destination="$HOME/Library/LaunchAgents/com.agent-office.runner.plist"

if [[ ! -f "$runner_dir/.env" ]]; then
  echo "Create $runner_dir/.env first."
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
sed -e "s|__RUNNER_DIR__|$runner_dir|g" -e "s|__HOME__|$HOME|g" "$template" > "$destination"
plutil -lint "$destination"
launchctl bootout "gui/$(id -u)" "$destination" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$destination"
launchctl kickstart -k "gui/$(id -u)/com.agent-office.runner"
echo "Imperial Command runner installed and started."
