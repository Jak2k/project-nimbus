#!/bin/bash
git pull
pushd client
pnpm install
pnpm build
popd
