import express from "express";
import http from "http";
import { Event, Server, Socket } from "socket.io";
import os from "os";
import path from "path";
import process from "process";

import wordcloud from "./wordcloud";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

function generatePin(length: number) {
  return Math.floor(
    Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
  ).toString();
}

type Config = {
  adminPassword?: string;
};

// read config as json from args
const args = process.argv.slice(2);
let config: Config = { adminPassword: undefined };
if (args.length > 0) {
  try {
    config = JSON.parse(args[0]);
    console.log("Config loaded", config);
  } catch (e) {
    console.error("Failed to parse config", e);
    process.exit(1);
  }
} else {
  console.log("No config provided, using default values");
}

const SESSION_PIN = generatePin(4);
const ADMIN_PASSWORD = config.adminPassword || generatePin(6);
const STATIC_DIR = path.resolve("../client/dist");

const knownModules: Map<string, module> = new Map();
let users: String[] = [];
let userSecrets: Map<string, string> = new Map();

export type actionHandler = (
  action: string,
  data: any,
  user: { isAdmin: boolean; name: string },
  broadcast: (event: string, data: any) => void
) => true | false | void;
export type joinHandler = (socket: Socket) => void;
export type module = {
  handleAction: actionHandler;
  handleJoin: joinHandler;
  id: string;
  init: (broadcast: (event: string, data: any) => void) => void;
  handleDownload: (req: any, res: any) => void;
};

knownModules.set("waiting", {
  handleAction: (
    action: string,
    data: any,
    user: { isAdmin: boolean; name: string },
    broadcast: (event: string, data: any) => void
  ) => false,
  handleJoin: (socket: Socket) => {},
  id: "waiting",
  init: (broadcast: (event: string, data: any) => void) => {},
  handleDownload: (req, res) => {
    let data = "";
    for (const user of users) {
      data += user + "\n";
    }
    res.end(data);
  },
});

knownModules.set("wordcloud", wordcloud);

let activeModule: module = knownModules.get("waiting")!;

function broadcast(event: string, data: any) {
  io.emit(event, data);
}

io.on("connection", (socket) => {
  if (
    (socket.handshake.auth.pin !== ADMIN_PASSWORD &&
      socket.handshake.auth.pin !== SESSION_PIN) ||
    !socket.handshake.auth.secret ||
    !socket.handshake.auth.name
  ) {
    socket.disconnect();
    return;
  }

  socket.on(
    "join",
    (callback: (resp: { userType: string; sessionPin: string }) => void) => {
      // auth
      if (users.includes(socket.handshake.auth.name)) {
        if (
          userSecrets.get(socket.handshake.auth.name) !==
          (socket.handshake.auth.secret._value || "")
        ) {
          console.log(
            socket.handshake.auth.secret._value || "",
            "Secret mismatch for user",
            socket.handshake.auth.name,
            "Secret:",
            socket.handshake.auth.secret._value,
            "Correct secret:",
            userSecrets.get(socket.handshake.auth.name)
          );
          socket.disconnect();
          return;
        }
      } else {
        users.push(socket.handshake.auth.name);
        userSecrets.set(
          socket.handshake.auth.name,
          socket.handshake.auth.secret._value || ""
        );
      }
      callback({
        userType:
          socket.handshake.auth.pin.toString().length === 6 ? "admin" : "user",
        sessionPin: SESSION_PIN,
      });
      io.emit("updateUsers", users);

      socket.emit("updateModule", activeModule.id);
      activeModule.handleJoin(socket);
    }
  );

  socket.on("activateModule", (module: string) => {
    if (socket.handshake.auth.pin !== ADMIN_PASSWORD) return;

    if (!knownModules.has(module)) {
      return;
    }

    activeModule = knownModules.get(module)!;
    io.emit("updateModule", module);
    activeModule.init(broadcast);
  });

  socket.onAny((event, ...args) => {
    const succes = activeModule.handleAction(
      event,
      args,
      {
        isAdmin: socket.handshake.auth.pin === ADMIN_PASSWORD,
        name: socket.handshake.auth.name,
      },
      broadcast
    );
    if (succes) {
      socket.emit("actionSuccess", event);
    }
  });
});

app.use(express.static(STATIC_DIR));
app.get("/", (req, res) => {
  res.sendFile(`${STATIC_DIR}/index.html`);
});

app.get("/download", (req, res) => {
  activeModule.handleDownload(req, res);
});

server.listen(3000, () => {
  // get current ip address in local network
  const ifaces = os.networkInterfaces();
  let ip = "";
  Object.keys(ifaces).forEach((ifname) => {
    ifaces[ifname]?.forEach((iface) => {
      if ("IPv4" !== iface.family || iface.internal !== false) {
        return;
      }
      ip = iface.address;
    });
  });

  console.log(`Open http://${ip}:3000/ to login`);
  console.log(`Session pin: ${SESSION_PIN}`);
  console.log(`Admin pin: ${ADMIN_PASSWORD}`);
});
