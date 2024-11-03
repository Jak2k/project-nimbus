import "webcomponent-qr-code";
import { WordCloud } from "./wordcloud.ts";

customElements.define("word-cloud", WordCloud);

const live = `<main hx-ext="sse" sse-connect="/api/sse" sse-swap="message" hx-swap="none">
    <p id="main">Loading...</p>
  </main>`;

const login = `<form class="login">
    <h1>Login</h1>
    <label for="name">Name</label>
    <input type="text" id="name" name="name" required />
    <label for="session-code">Session Code</label>
    <input type="text" id="session-code" name="session-code" required />
    <button type="submit">Login</button>
    <a href="/dashboard">I am a teacher</a>
    <style>
        form > input[type="text"] {
            border-bottom: 1px solid var(--brutal-accent);
        }

        h1, button[type=submit], form > a {
            grid-column: span 2;
        }

        form > a {
            text-align: center;
        }

        h1 {
            text-align: center;
        }
    </style>
  </form>`;

const main = document.querySelector("main")!;

function getCookie(cname: string) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// check for `token` cookie
if (getCookie("token")) {
  main.outerHTML = live;
} else {
  main.innerHTML = login;

  const form = main.querySelector("form")!;
  const sessionCodeInput = form.querySelector(
    "#session-code"
  ) as HTMLInputElement;

  // if a query parameter code is present, set the session code input value and remove the query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (code) {
    sessionCodeInput.value = code;
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionCodeInput.value = code;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = (form.querySelector("#name") as HTMLInputElement).value;
    const sessionCode = sessionCodeInput.value;
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, sessionCode }),
    });
    if (response.ok) {
      main.outerHTML = live;

      // @ts-expect-error Htmx is loaded globally
      window.htmx.process(document.querySelector("main")!);
    } else {
      alert(await response.text());
    }
  });
}
