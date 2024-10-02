#!/bin/bash
echo "Starting the application"
caddy start --config Caddyfile
sleep 5
cd manager
pnpm start