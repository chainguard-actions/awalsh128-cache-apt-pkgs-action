<!-- markdownlint-disable -->

# Hardening Report: awalsh128--cache-apt-pkgs-action/v1.6.3

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **awalsh128--cache-apt-pkgs-action/v1.6.3** was hardened automatically. 2 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### unsafe-shell (severity: high)

install_and_cache_pkgs.sh downloads and immediately executes a remote shell script via `/bin/bash -c "$(curl -sL https://raw.githubusercontent.com/ilikenwf/apt-fast/master/quick-install.sh)"`. This is functionally equivalent to `curl ... | bash` — remote content is fetched and executed in a single step with no integrity verification, allowing a compromised or man-in-the-middle response to run arbitrary code on the runner.

Locations:

- `install_and_cache_pkgs.sh:27`

### github-env-injection (severity: high)

scripts/distribute.sh writes the inherited env var `VERSION_PREFIX` (set by the calling workflow and therefore workflow-controlled/untrusted) to `$GITHUB_OUTPUT` without the required sanitization step (`printf '%s' "$VAR" | tr -d '\n\r'`). A value containing a newline could inject arbitrary key=value pairs into the output, allowing an attacker to set unexpected step outputs. The unsanitized write is: `echo "version=${VERSION}" >> "${GITHUB_OUTPUT}"` where `VERSION` is derived from `VERSION_PREFIX`.

Locations:

- `scripts/distribute.sh:27`

## Iteration Notes

### Iteration 1

**Fixes applied:** unsafe-shell, github-env-injection

**Notes:**

1. install_and_cache_pkgs.sh (line 27): Replaced the unsafe `/bin/bash -c "$(curl -sL ...)"` pattern with a two-step approach: download the script to a temp file via `curl ... -o`, execute it with `/bin/bash`, then remove the temp file. This eliminates the curl-pipe-to-bash vulnerability.
2. scripts/distribute.sh (line 27): Added sanitization of `COMMIT_SHA` and `VERSION` using `printf '%s' "$VAR" | tr -d '\n\r'` before writing to `$GITHUB_OUTPUT`, preventing newline injection of arbitrary key=value pairs into step outputs.

### Iteration 2

**Fixes applied:** github-env-injection

**Notes:**

Fixed two github-env-injection findings in action.yml:

1. pre-cache step (line 71): Added sanitization for CACHE_KEY before writing to $GITHUB_ENV. Changed `echo "CACHE_KEY=$(cat ~/cache-apt-pkgs/cache_key.md5)" >> $GITHUB_ENV` to capture the value into `safe_cache_key=$(printf '%s' "$(cat ~/cache-apt-pkgs/cache_key.md5)" | tr -d '\n\r')` and then write `echo "CACHE_KEY=${safe_cache_key}" >> "$GITHUB_ENV"`.

2. post-cache step (lines 95-96): Added sanitization for both package-version-list and all-package-version-list before writing to $GITHUB_OUTPUT. The create_list function output is now captured and sanitized via `printf '%s' "$(create_list ...)" | tr -d '\n\r'` before being echoed to $GITHUB_OUTPUT. Also quoted $GITHUB_OUTPUT and $GITHUB_ENV references for good measure.

