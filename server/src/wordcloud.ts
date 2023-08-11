import { BroadcastOperator, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { actionHandler, joinHandler } from ".";

let words = ["foo", "bar", "baz"];

// export default function register(room: BroadcastOperator<DefaultEventsMap, any>, socket: Socket, app: any, pins: { admin: string; session: string }) {
//   app.get("/download", (req, res) => {
//
//   });
//     // room.on(
//     //   "removeWord",
//     //   (word: string, callback: (resp: string) => void) => {
//     //     words = words.filter((w) => w !== word);
//     //     room.emit("updateWords", words);
//     //     callback("ok");
//     //   }
//     // );

//   socket.on("addWord", (word: string, callback: (resp: string) => void) => {
//     words.push(word);
//     room.emit("updateWords", words);
//     console.log(`Added word: ${word}`);

//     callback("ok");
//   });
//   room.emit("updateWords", words);
// }

const handleAction: actionHandler = (
  action: string,
  data: any,
  user: {
    isAdmin: boolean;
  },
  broadcast: (event: string, data: any) => void
) => {
  switch (action) {
    case "addWord":
      words.push(data[0]);
      broadcast("updateWords", words);
      break;
    case "removeWord":
      if (!user.isAdmin) return;
      words = words.filter((w) => w !== data[0]);
      broadcast("updateWords", words);
      break;
    default:
      break;
  }
};

const handleJoin: joinHandler = (socket: Socket) => {
  socket.emit("updateWords", words);
};

const init = (broadcast: (event: string, data: any) => void) => {
  words = [];
  broadcast("updateWords", words);
};

const handleDownload = (req: any, res: any) => {
  res.end(words.join("\n"));
};

export default {
  handleAction,
  handleJoin,
  init,
  id: "wordcloud",
  handleDownload,
};
