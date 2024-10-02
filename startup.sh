#!/bin/bash
echo "Starting the application"
caddy start --config .data/Caddyfile
sleep 5
cd manager
pnpm start