# Project-Nimbus

> ## **_BETA STATUS! DON'T RELY ON IT IN PRODUCTION!_**

> ## Please give me feedback in the issues tab.

Real-Time Collaboration Tool for Classrooms

## Features

- [x] Real-Time Collaboration
- [x] Self-Hostable locally (Linux, Android)
- Modules
  - [x] Wordcloud
  - [ ] Categoization voting
  - [ ] Vote
  - [ ] Quiz
  - [ ] Mindmap
- [x] Download as text
- [ ] Persistent data
- [ ] Multi-Room support


## Getting Started

> **Only run this in local networks! Never run this open to the internet, unless you are using a reverse-proxy like caddy.**

This is how to **run the server**. To use it, you only need a browser.

### Termux on android

Tutorial will be enhanced later...

#### Install

1. Install Termux
2. In termux, run
   ```bash
   curl -s "https://raw.githubusercontent.com/Jak2k/Project-Nimbus/main/scripts/install_termux.sh" | sh -s

    ```

-- OR --

1. Install Termux
2. In termux, run `pkg update && pkg upgrade` (When you get asked for something, type `y` and press enter)
3. Run `pkg i nodejs git` (When you get asked for something, type `y` and press enter)
4. Clone the repo
5. run `npm i -g pnpm` (When you get asked for something, type `y` and press enter)
1. run `cd Project-Nimbus`
6. run `pnpm i`
7. run `pnpm build`

#### Run

- Run `pnpm start`

#### Update

1. In termux, run `cd Project-Nimbus` if you are not already in the folder
2. Run `sh ./scripts/update.sh`

### Linux

1. Clone the repo `git clone https://github.com/Jak2k/Project-Nimbus.git`
2. Install nodejs (if you haven't already) and pnpm `npm i -g pnpm`
3. Enter the folder `cd Project-Nimbus`
4. Install dependencies `pnpm i`
5. Build the project `pnpm build`
6. Start the server `pnpm start`

### Windows

Windows is not supported and will not be supported in the future. Use a proper operating system on your server. If you want to run it on your local machine, you can use WSL, but there are no guarantees that it will work.
