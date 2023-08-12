# ensure termux environment
if command -v termux-setup-storage  
then  
echo "✅ Detected Termux environment, continuing"  
else
echo "❌ Not running in termux, exiting"
exit 1
fi

# Install dependencies

pkg i git nodejs-lts
echo "✅ Installed dependencies"

# Clone repo

git clone https://github.com/jak2k/project-nimbus.git
echo "✅ Cloned repo"

# Install pnpm if not installed

if command -v pnpm
then
echo "✅ Detected pnpm, continuing"
else
echo "🛠️ pnpm not detected, installing"
npm i -g pnpm
echo "✅ Installed pnpm"
fi

# Install dependencies (node)

cd project-nimbus
pnpm i
echo "✅ Installed node dependencies"

# build

pnpm build
echo "✅ Built project"

# Show succes message and instructions

echo ""
echo ""
echo "✅ Successfully installed Project Nimbus"
echo "▶️ To start the server run 'pnpm start'"
echo "After starting the server, you can access the web interface at $(hostname -I | awk '{print $1}'):3000"