import express from "express";
const app = express();
import http from "http";
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
import path from "path";

// generate a random pin with 4 digits for the session
const sessionPin = Math.floor(1000 + Math.random() * 9000).toString();
console.log(`Session pin: ${sessionPin}`);

// generate a random pin with 6 digits for the admin
const adminPin = Math.floor(100000 + Math.random() * 900000).toString();
console.log(`Admin pin: ${adminPin}`);

const staticDir = path.resolve("../client/dist");

let words = ["foo", "bar", "baz"];

app.get("/", (req, res) => {
  res.sendFile(`${staticDir}/index.html`);
});

// all routes that are not found should be served from static dir or redirect to index.html
app.use(express.static(staticDir));

io.on("connection", (socket) => {
  if (socket.handshake.auth.pin === adminPin.toString()) {
    console.log("Admin connected");
    socket.on("removeWord", (word: string, callback: (resp: string) => void) => {
      words = words.filter((w) => w !== word);
      io.emit("updateWords", words);
      callback("ok");
    });
  } else if (socket.handshake.auth.pin !== sessionPin.toString()) {
    console.log(`Invalid pin: ${socket.handshake.auth.pin}`);
    socket.disconnect();
    return;
  } else {
    console.log("a user connected");
  }
  socket.on("addWord", (word: string, callback: (resp: string) => void) => {
    words.push(word);
    io.emit("updateWords", words);
    console.log(`Added word: ${word}`);

    callback("ok");
  });
  socket.on("join", (callback: (resp: string) => void) => {
    socket.emit("updateWords", words);
    callback(socket.handshake.auth.pin.toString().length === 6 ? "admin" : "user");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
