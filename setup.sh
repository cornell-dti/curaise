#!/usr/bin/env bash
set -euo pipefail

# This script installs dependencies, builds, and runs Prisma code generation 
# in your monorepo. It assumes the following folder structure at the root:
#   /backend
#   /common
#   /frontend
#   pnpm-workspace.yaml

echo "=== Installing dependencies in /common ==="
pushd common > /dev/null
pnpm install
popd > /dev/null

echo "=== Installing dependencies in /backend ==="
pushd backend > /dev/null
pnpm install
popd > /dev/null

echo "=== Installing dependencies in /frontend ==="
pushd frontend > /dev/null
pnpm install
popd > /dev/null

echo "=== Building /common ==="
pushd common > /dev/null
pnpm run build
popd > /dev/null

echo "=== Generating Prisma types in /backend ==="
pushd backend > /dev/null
pnpm prisma generate
popd > /dev/null

echo "=== Building /backend ==="
pushd backend > /dev/null
pnpm run build
popd > /dev/null

echo "=== Setup complete! ==="
