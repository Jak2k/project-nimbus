import "./style.css";

const live = `<main hx-ext="sse" sse-connect="/api/sse" sse-swap="message" hx-swap="none">
    <p id="main">Loading...</p>
  </main>`;

const login = `<form>
    <h1>Login</h1>
    <label for="name">Name</label>
    <input type="text" id="name" name="name" required />
    <label for="session-code">Session Code</label>
    <input type="text" id="session-code" name="session-code" required />
    <label for="teacher"><input type="checkbox" id="teacher" name="teacher" /> Teacher</label>
    
    <label for="password">Password</label>
    <input type="password" id="password" name="password" hidden />
    <button type="submit">Login</button>
    <style>
        form {
            display: grid;
            gap: 0.5rem;
            grid-template-columns: 1fr 1fr;
            margin: 1rem auto;
            max-width: 25rem;
        }

        h1, label[for=teacher], button[type=submit] {
            grid-column: span 2;
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
  main.innerHTML = live;
} else {
  main.innerHTML = login;

  const form = main.querySelector("form")!;
  const teacher = form.querySelector("#teacher") as HTMLInputElement;
  const password = form.querySelector("#password") as HTMLInputElement;
  const passwordLabel = form.querySelector(
    "label[for=password]"
  ) as HTMLLabelElement;
  teacher.addEventListener("change", () => {
    localStorage.setItem("teacher", teacher.checked.toString());
    password.hidden = !teacher.checked;
    passwordLabel.hidden = !teacher.checked;
  });
  teacher.checked = localStorage.getItem("teacher") === "true";
  password.hidden = !teacher.checked;
  passwordLabel.hidden = !teacher.checked;

  // if a query parameter code is present, set the session code input value and remove the query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (code) {
    (form.querySelector("#session-code") as HTMLInputElement).value = code;
    window.history.replaceState({}, document.title, window.location.pathname);
    (form.querySelector("#session-code") as HTMLInputElement).value = code;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = (form.querySelector("#name") as HTMLInputElement).value;
    const sessionCode = (
      form.querySelector("#session-code") as HTMLInputElement
    ).value;
    const teacher = (form.querySelector("#teacher") as HTMLInputElement)
      .checked;
    const password = (form.querySelector("#password") as HTMLInputElement)
      .value;
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, sessionCode, teacher, password }),
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
