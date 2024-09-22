import { Socket } from "socket.io";
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
  return words
    .filter((w) => !w.removed)
    .map((w) => {
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
    case "wordcloud.addWord":
      if (isWordAlreadyAdded(data[0])) {
        const i = words.findIndex((w) => w.word === data[0]);
        if (user.isAdmin && words[i].removed) words[i].removed = false;
        if (!words[i].users.includes(user.name)) words[i].users.push(user.name);
      } else {
        words.push({
          word: data[0],
          users: [user.name],
          removed: false,
        });
      }
      broadcast("wordcloud.updateWords", getWords());
      return true;
    case "wordcloud.removeWord":
      if (!user.isAdmin) return false;
      const i = words.findIndex((w) => w.word === data[0]);
      words[i].removed = true;
      broadcast("wordcloud.updateWords", getWords());
      return true;
    default:
      return false;
  }
};

const handleJoin: joinHandler = (socket: Socket, _broadcast: any) => {
  socket.emit("wordcloud.updateWords", getWords());
};

const init = (
  broadcast: (event: string, data: any) => void,
  users: String[]
) => {
  words = [];
  broadcast("wordcloud.updateWords", getWords());
};

const handleDownload = (req: any, res: any) => {
  res.end(
    getWords()
      .sort((a: any, b: any) => {
        if (a.count === b.count) return a.word.localeCompare(b.word);
        b.count - a.count;
      })
      .map((w) => `${w.count} ${w.word}`)
      .join("\n")
  );
};

export default {
  handleAction,
  handleJoin,
  init,
  id: "wordcloud",
  handleDownload,
};
