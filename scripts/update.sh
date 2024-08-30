git pull
echo "✅ Downloaded latest version of Project Nimbus"
pnpm i --frozen-lockfile
echo "✅ Installed latest dependencies"
pnpm run build
echo "✅ Built Project Nimbus"
echo ""
echo ""
echo "🎉 Successfully updated Project Nimbus!"
echo ""
echo "➡️ Run 'pnpm start' to start the server"