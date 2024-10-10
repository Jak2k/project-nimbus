import { Handler, GetInitialView, GetInitialData } from "./shared.ts";
import { Module } from "./shared.ts";

type Word = {
  text: string;
  users: string[];
};

export type Data = {
  words: Word[];
};

const WORDCLOUD = (words: Word[]) =>
  words.map((word) => `<li>${word.text} (${word.users.length})</li>`).join("");

const handler: Handler<Data> = (body, data, ctx, send, user) => {
  if (body.action === "wordcloud.add") {
    const text = body.text.trim().replace(/[^a-zA-Z0-9ÄÖÖßäüö\-_ ]/g, "");
    if (!text) {
      return;
    }
    const word = data.words.find((word) => word.text === text);
    if (word) {
      if (!word.users.includes(user.name)) {
        word.users.push(user.name);
      }
    } else {
      data.words.push({ text, users: [user.name] });
    }
    send(`<ul id="words" hx-swap-oob="true">${WORDCLOUD(data.words)}</ul>`, {
      onlyStudent: false,
      onlyTeacher: false,
      onlyWithNames: [],
    });
  }
};

const initialData: GetInitialData<Data> = (_data) => ({
  words: [],
});

const getInitialView: GetInitialView<Data> = (data, _user, _session_code) => {
  return `<h1>Wordcloud</h1>
    <form id="wordcloud-form">
        <input type="text" name="text" />
        <button type="submit">Add</button>
        <script>
            document.getElementById("wordcloud-form").addEventListener("submit", (event) => {
                event.preventDefault();
                const text = new FormData(event.target).get("text");
                fetch("/api/action", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "wordcloud.add",
                        text,
                    }),
                }).then(() => {
                    event.target.reset();
                }).catch((error) => {
                    console.error(error);
                });
            });
        </script>
    </form>
    <ul id="words">
        ${WORDCLOUD(data.words)}
    </ul>
  `;
};

export const wordcloud: Module<Data> = {
  initialData,
  handler,
  getInitialView,
  name: "wordcloud",
  displayName: "Wordcloud",
};
