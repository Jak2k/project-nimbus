import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);
import path from 'path';

const staticDir = path.resolve("../static")

app.get('/', (req, res) => {
  res.sendFile(`${staticDir}/index.html`);
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});