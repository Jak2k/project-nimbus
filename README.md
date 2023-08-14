# project-nimbus

## **_BETA STATUS! DON'T RELY ON IT IN PRODUCTION!_**

##Please give me feedback in the issues tab.

Real-Time Collaboration Tool for Classrooms

## Features

- [x] Real-Time Collaboration
- [ ] Moderation
  - [x] Removing unwanted content
  - [ ] Removing permanently
  - [ ] Kicking Users & Disallow new ones
- [x] Self-Hosted locally
- Modules
  - [ ] Wordcloud
  - [ ] Vote
  - [ ] Quiz
  - [ ] Mindmap

## Getting Started

> **Only run this in local networks! Never run this open to the internet.**

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

### Linux / Windows

Tutorial will be added later...
```
