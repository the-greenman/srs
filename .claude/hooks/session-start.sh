#!/bin/bash
#
# SessionStart hook for Claude Code on the web.
#
# Installs the `srs` CLI so spec validation, rendering, and CLI-first authoring
# (required by CLAUDE.md / srs-usage.md) work during web sessions.
#
# Strategy (hybrid):
#   1. Fast path — download the prebuilt release binary from srs-rust's GitHub
#      releases (seconds, no Rust toolchain, no crates.io).
#   2. Fallback — build from source with `cargo install --git` if no release
#      asset can be fetched (e.g. release pulled, network to release CDN down).
#
# Idempotent: if `srs` is already on PATH (warm cached container) it does
# nothing. The binary lands in ~/.cargo/bin, which persists in cached
# container state across sessions.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SRS_RUST_REPO="${SRS_RUST_REPO:-the-greenman/srs-rust}"
# Pin the release the fast path pulls from. Bump when srs-rust cuts a new build.
SRS_RELEASE_TAG="${SRS_RELEASE_TAG:-v0.1.0-build.2}"
SRS_ASSET="${SRS_ASSET:-srs-x86_64-unknown-linux-gnu.tar.gz}"
INSTALL_DIR="${HOME}/.cargo/bin"

ensure_path() {
  # Make sure ~/.cargo/bin is on PATH for the rest of the session.
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
  fi
}

if command -v srs >/dev/null 2>&1; then
  echo "srs CLI already installed: $(srs --version)"
  ensure_path
  exit 0
fi

mkdir -p "$INSTALL_DIR"

# --- Fast path: prebuilt release binary -------------------------------------
install_from_release() {
  local base="https://github.com/${SRS_RUST_REPO}/releases/download/${SRS_RELEASE_TAG}"
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN

  echo "Downloading srs ${SRS_RELEASE_TAG} (${SRS_ASSET})..."
  if ! curl -fsSL -o "${tmp}/srs.tar.gz" "${base}/${SRS_ASSET}"; then
    echo "Release download failed."
    return 1
  fi

  # Verify the checksum if the companion .sha256 is published.
  if curl -fsSL -o "${tmp}/srs.tar.gz.sha256" "${base}/${SRS_ASSET}.sha256" 2>/dev/null; then
    local expected
    expected="$(awk '{print $1}' "${tmp}/srs.tar.gz.sha256")"
    local actual
    actual="$(sha256sum "${tmp}/srs.tar.gz" | awk '{print $1}')"
    if [ "$expected" != "$actual" ]; then
      echo "Checksum mismatch (expected ${expected}, got ${actual})."
      return 1
    fi
    echo "Checksum verified."
  fi

  tar xzf "${tmp}/srs.tar.gz" -C "$tmp"
  if [ ! -f "${tmp}/srs" ]; then
    echo "Extracted archive did not contain an 'srs' binary."
    return 1
  fi
  install -m 0755 "${tmp}/srs" "${INSTALL_DIR}/srs"
}

# --- Fallback: build from source --------------------------------------------
install_from_source() {
  echo "Falling back to building srs from source (this can take a couple of minutes)..."
  # --force so the build runs even when cargo's metadata lists srs as installed
  # but the binary is missing (we only reach here when `command -v srs` failed).
  cargo install --force --git "https://github.com/${SRS_RUST_REPO}" srs
}

if install_from_release; then
  echo "Installed srs CLI from release: $("${INSTALL_DIR}/srs" --version)"
elif install_from_source; then
  echo "Installed srs CLI from source: $(srs --version)"
else
  echo "ERROR: failed to install srs CLI via both release and source." >&2
  exit 1
fi

ensure_path
