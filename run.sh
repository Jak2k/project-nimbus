#!/bin/bash
set +e
pushd ./server
while true; do
    pnpm start $(echo $1 | jq "{adminPassword: .}" -cR)
    echo "Server exited with code $?. Restarting in one second..."
    sleep 1
done
popd