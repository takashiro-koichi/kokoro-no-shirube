#!/bin/bash
# SessionStart hook: GitHub CLI auto-installation for remote environments
# This script installs gh CLI when running in Claude Code on the Web

set -e

LOG_PREFIX="[gh-setup]"

log() {
    echo "$LOG_PREFIX $1" >&2
}

# Only run in remote Claude Code environment
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
    log "Not a remote session, skipping gh setup"
    exit 0
fi

log "Remote session detected, checking gh CLI..."

# Check if gh is already available
if command -v gh &>/dev/null; then
    log "gh CLI already available: $(gh --version | head -1)"
    exit 0
fi

# Install via apt-get
log "Installing gh CLI via apt-get..."
apt-get update -qq && apt-get install -y -qq gh

if command -v gh &>/dev/null; then
    log "gh CLI installed successfully: $(gh --version | head -1)"
else
    log "Installation failed"
fi

exit 0
