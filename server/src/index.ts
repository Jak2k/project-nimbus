import express from "express";
const app = express();
import http from "http";
const server = http.createServer(app);
import { Event, Server, Socket } from "socket.io";
import os from "os";
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
import path from "path";
import wordcloud from "./wordcloud";

// generate a random pin with 4 digits for the session
const sessionPin = Math.floor(1000 + Math.random() * 9000).toString();
console.log(`Session pin: ${sessionPin}`);

// generate a random pin with 6 digits for the admin
const adminPin = Math.floor(100000 + Math.random() * 900000).toString();
console.log(`Admin pin: ${adminPin}`);

const staticDir = path.resolve("../client/dist");

let users = [];

export type actionHandler = (action: string, data: any, user: { isAdmin: boolean, name: string }, broadcast: (event: string, data: any) => void) => true | false | void
export type joinHandler = (socket: Socket) => void
export type module = {
  handleAction: actionHandler,
  handleJoin: joinHandler,
  id: string
  init: (broadcast: (event: string, data: any) => void) => void
  handleDownload: (req: any, res: any) => void
}

const waitingHandler: actionHandler = (action: string, data: any, user: { isAdmin: boolean, name: string }, broadcast: (event: string, data: any) => void) => false
const knownModules: Map<string, module> = new Map();
knownModules.set("waiting", {
  handleAction: waitingHandler,
  handleJoin: (socket: Socket) => {

  },
  id: "waiting",
  init: (broadcast: (event: string, data: any) => void) => {},
  handleDownload: (req, res) => {
    res.end("This module does not support downloads.")
  }
});
knownModules.set("wordcloud", wordcloud);
let activeModule: module = knownModules.get("waiting")!;

app.get("/", (req, res) => {
  res.sendFile(`${staticDir}/index.html`);
});

app.get("/download", (req, res) => {
  activeModule.handleDownload(req, res);
});


// all routes that are not found should be served from static dir or redirect to index.html
app.use(express.static(staticDir));

function broadcast(event: string, data: any) {
    io.emit(event, data);
  }

io.on("connection", (socket) => {
  if(socket.handshake.auth.pin !== adminPin && socket.handshake.auth.pin !== sessionPin) {
    socket.disconnect();
    return;
  }

  if (!socket.handshake.auth.name) socket.disconnect();
  
  socket.on("join", (callback: (resp: {
    userType: string;
    sessionPin: string;
  }) => void) => {
    // @ts-ignore
    users.push(socket.handshake.auth.name || "Anonymous");
    callback({userType: socket.handshake.auth.pin.toString().length === 6 ? "admin" : "user", sessionPin});
    io.emit("updateUsers", users);

    socket.emit("updateModule", activeModule.id);
    activeModule.handleJoin(socket);
  });

  socket.on("activateModule", (module: string) => {
    if (socket.handshake.auth.pin !== adminPin) return;

    if(!knownModules.has(module)) {
      return;
    }

    activeModule = knownModules.get(module)!;
    io.emit("updateModule", module);
    activeModule.init(broadcast);
  });

  

  socket.onAny((event, ...args) => {
    const succes = activeModule.handleAction(event, args, {isAdmin: socket.handshake.auth.pin === adminPin, name: socket.handshake.auth.name || "Anonymous"}, broadcast);
    if(succes) {
      socket.emit("actionSuccess", event);
    }
  });

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
});
