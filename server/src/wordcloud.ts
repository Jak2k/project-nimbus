import { BroadcastOperator, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { actionHandler, joinHandler } from ".";

let words = ["foo", "bar", "baz"];

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
