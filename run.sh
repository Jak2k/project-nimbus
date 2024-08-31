#!/bin/bash
set +e
pushd ./server
pnpm start $(echo $1 | jq "{adminPassword: .}" -cR)
popd