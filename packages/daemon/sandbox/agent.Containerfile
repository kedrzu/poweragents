# The agent's container: OpenCode serving every project of the profile, Claude Code as its engine, and the tools the
# agent reaches for (design D6, D24). Built inside the sandbox VM by `LimaSandbox`; the image tag is a hash of this
# file, so any change here makes the daemon build a new image.
FROM debian:trixie-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash ca-certificates curl git procps python3 ripgrep unzip \
    && rm -rf /var/lib/apt/lists/*

# Each tool is its pinned release artifact, checked against a sha256 taken from its release: Bun's SHASUMS256.txt, uv's
# `.sha256` files, Claude Code's `manifest.json` (what claude.ai/install.sh verifies against) and, for OpenCode's npm
# tarball, computed from the file whose sha512 matched the registry's `integrity`. BuildKit sets `TARGETARCH`: arm64 on
# Apple silicon, amd64 otherwise, where Bun and OpenCode come in their baseline builds, which need no AVX2 (Rosetta).
ARG TARGETARCH

RUN case "$TARGETARCH" in \
        arm64) target=aarch64 sha=baa6bb36f51d6e58561e02bbea825038a9df454f673d6d776e8bbf86f8c7850e ;; \
        amd64) target=x64-baseline sha=e0446eb55995772eb9894bebae9a6be368d985a8b9271ee124486f9946eedd76 ;; \
        *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac \
    && curl -fsSL -o /tmp/bun.zip "https://github.com/oven-sh/bun/releases/download/bun-v1.4.4/bun-linux-$target.zip" \
    && echo "$sha  /tmp/bun.zip" | sha256sum --check --strict - \
    && unzip -q -j /tmp/bun.zip "bun-linux-$target/bun" -d /usr/local/bin \
    && ln -s bun /usr/local/bin/bunx \
    && rm /tmp/bun.zip

RUN case "$TARGETARCH" in \
        arm64) target=aarch64 sha=71279f8d3c67241e807b9d8db872d1bf541579fb9f08b7d1eb1682196d1e57dc ;; \
        amd64) target=x86_64 sha=c5221ff41b7892bfc223543883600125f6a47fe845093e0f5bdff4f359196d83 ;; \
        *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac \
    && curl -fsSL -o /tmp/uv.tar.gz \
        "https://github.com/astral-sh/uv/releases/download/0.13.7/uv-$target-unknown-linux-gnu.tar.gz" \
    && echo "$sha  /tmp/uv.tar.gz" | sha256sum --check --strict - \
    && tar -xzf /tmp/uv.tar.gz -C /usr/local/bin --strip-components=1 \
        "uv-$target-unknown-linux-gnu/uv" "uv-$target-unknown-linux-gnu/uvx" \
    && rm /tmp/uv.tar.gz

RUN case "$TARGETARCH" in \
        arm64) platform=linux-arm64 sha=f220ca50ea4f3222043ff83cc224a1262e0196e9897acc0871efa94235b0c1fd ;; \
        amd64) platform=linux-x64 sha=bfb3703ad5380242328459bc62ada4bde8ae7ba57c6e1eeadb9c00e08874c478 ;; \
        *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac \
    && curl -fsSL -o /tmp/claude "https://downloads.claude.ai/claude-code-releases/2.1.322/$platform/claude" \
    && echo "$sha  /tmp/claude" | sha256sum --check --strict - \
    && install -m 755 /tmp/claude /usr/local/bin/claude \
    && rm /tmp/claude

RUN case "$TARGETARCH" in \
        arm64) target=linux-arm64 sha=7e74ceb64fe5704ff2fdef3dee45866efcb580d71f182a6cae29606cad1f8b52 ;; \
        amd64) target=linux-x64-baseline sha=20512b0c5c5c30c51959ce13e11b19a630ce3b5bef56b486859bf38f8b27bcae ;; \
        *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac \
    && curl -fsSL -o /tmp/opencode.tgz "https://registry.npmjs.org/@opencode/cli-$target/-/cli-$target-2.2.7.tgz" \
    && echo "$sha  /tmp/opencode.tgz" | sha256sum --check --strict - \
    && tar -xzf /tmp/opencode.tgz -C /usr/local/bin --strip-components=2 package/bin/opencode \
    && chmod 755 /usr/local/bin/opencode \
    && rm /tmp/opencode.tgz

# The image pins both versions; neither may update itself inside a running container.
ENV DISABLE_AUTOUPDATER=1 \
    OPENCODE_DISABLE_AUTOUPDATE=1

# The agent works with no approvals (design D28): the sandbox is the boundary, so OpenCode allows every action. Global
# rules are evaluated after each agent's own (the built-in ones ask before reading `.env` files), so this one wins.
COPY <<EOF /root/.config/opencode/opencode.json
{ "permissions": [{ "action": "*", "resource": "*", "effect": "allow" }] }
EOF
