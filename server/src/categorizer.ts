import { Socket } from "socket.io";
import { actionHandler, joinHandler } from ".";

let words: {
  word: string;
  categories: {
    category: string;
    users: string[];
    removed: boolean;
  }[];
}[] = [];

let activeWord: number = 0;

function getActiveWord() {
  return words[activeWord];
}

function getWords() {
  return words.map((w) => {
    return {
      word: w.word,
      category: w.categories
        .filter((c) => !c.removed)
        .sort((a, b) => b.users.length - a.users.length)[0],
    };
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
    case "categorizer.addWord":
      if (!user.isAdmin) return false;

      if (words.findIndex((w) => w.word === data[0]) == -1) {
        words.push({
          word: data[0],
          categories: [],
        });
        broadcast("categorizer.updateWords", getWords());
        broadcast("categorizer.updateActiveWord", getActiveWord());
        return true;
      }
      return false;

    case "categorizer.activateWord":
      if (!user.isAdmin) return false;

      const newActiveWord = words.findIndex((w) => w.word === data[0]);
      if (newActiveWord != -1) {
        activeWord = newActiveWord;
        broadcast("categorizer.updateActiveWord", getActiveWord());
        return true;
      } else {
        return false;
      }

    default:
      return false;
  }
};

const handleJoin: joinHandler = (socket: Socket) => {
  socket.emit("categorizer.updateWords", getWords());
  socket.emit("categorizer.updateActiveWord", getActiveWord());
};

const init = (broadcast: (event: string, data: any) => void) => {
  words = [];
  broadcast("categorizer.updateWords", getWords());
};

const handleDownload = (req: any, res: any) => {
  res.end(
    getWords()
      .map((w) => `${w.category} ${w.word}`)
      .sort()
      .join("\n")
  );
};

export default {
  handleAction,
  handleJoin,
  init,
  id: "categorizer",
  handleDownload,
};
