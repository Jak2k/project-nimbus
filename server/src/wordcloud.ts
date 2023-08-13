import { BroadcastOperator, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { actionHandler, joinHandler } from ".";

let words: {
  word: string;
  users: string[];
  removed: boolean;
}[] = [];

function isWordAlreadyAdded(word: string) {
  return words.some((w) => w.word === word);
}

function getWords() {
  return words.filter(w=>!w.removed).map((w) => {
    return { word: w.word, count: w.users.length };
  });
}

const handleAction: actionHandler = (
  action: string,
  data: any,
  user: {
    isAdmin: boolean;
    name: string;
  },
  broadcast: (event: string, data: any) => void
) => {
  switch (action) {
    case "addWord":
      if (isWordAlreadyAdded(data[0])) {
        const i = words.findIndex((w) => w.word === data[0]);
        if(user.isAdmin && words[i].removed) words[i].removed = false;
        if(!words[i].users.includes(user.name))
        words[i].users.push(user.name);
      } else {
        words.push({
          word: data[0],
          users: [user.name],
          removed: false,
        });
      }
      broadcast("updateWords", getWords());
      break;
    case "removeWord":
      if (!user.isAdmin) return;
      const i = words.findIndex((w) => w.word === data[0]);
      words[i].removed = true;
      broadcast("updateWords", getWords());
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
  broadcast("updateWords", getWords());
};

const handleDownload = (req: any, res: any) => {
  res.end(getWords().map(w=>`${w.word} ${w.count}`).join("\n"));
};

export default {
  handleAction,
  handleJoin,
  init,
  id: "wordcloud",
  handleDownload,
};
