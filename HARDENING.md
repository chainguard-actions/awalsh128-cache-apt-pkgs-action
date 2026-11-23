<!-- markdownlint-disable -->

# Hardening Report: awalsh128--cache-apt-pkgs-action/v2.0.0-rc.2

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **awalsh128--cache-apt-pkgs-action/v2.0.0-rc.2** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Rule (a): the internal composite action .github/actions/setup/action.yml puts a GitHub Actions expression straight into a run: script: `echo "build-artifacts-name=${{ env.build_artifacts_name }}" >> $GITHUB_ENV`. The env value comes from `build-dist-${{ github.sha }}`. Any ${{ }} inside a run: block is a finding, whatever context it reads from. Fix: use the shell variable instead, quoted as "$build_artifacts_name".

Locations:

- `.github/actions/setup/action.yml:23`

### github-env-injection (severity: high)

The 'Create Build Artifacts Name' step writes a value built from an expression (env.build_artifacts_name, derived from github.sha) to $GITHUB_ENV. There is no printf '%s' ... | tr -d '\n\r' step before the write, and $GITHUB_ENV is not quoted. Fix: safe=$(printf '%s' "$build_artifacts_name" | tr -d '\n\r'); echo "build-artifacts-name=$safe" >> "$GITHUB_ENV".

Locations:

- `.github/actions/setup/action.yml:23`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

In .github/actions/setup/action.yml, the 'Create Build Artifacts Name' step now reads the step-level env var $build_artifacts_name instead of a ${{ }} expression. It strips newlines with printf | tr -d '\n\r' before writing to "$GITHUB_ENV", which is now quoted.

