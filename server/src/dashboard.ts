import { Context, Router } from "@oak/oak";
import { availableModules, sessions, teachers, users } from "./index.ts";
import { type Sessions } from "./shared.ts";
import { getTeachers, validatePassword } from "./auth.ts";

const BASE = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Nimbus Dashboard</title>
  <link rel="stylesheet" href="/style.css">
  <style>
    li {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      
      & form:not(:last-child) {
        margin-left: 1rem;
      }
    }

    form {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      & label {
        margin-left: 0.5rem;
      }
    }

    .login button {
      grid-column: span 2;
    }
  </style>
</head>
<body>
  <header>
    <h1>Nimbus Dashboard</h1>
    <nav>
      <a href="/">Back</a>
    </nav>
  </header>
  <main>
    ${content}
  </main>
</body>
</html>`;

export const dashboardRouter = new Router({
  prefix: "/dashboard",
});

async function checkAuth(ctx: Context) {
  const token = await ctx.cookies.get("teacher-token");
  if (!token) {
    ctx.response.redirect("/dashboard/login");
    return false;
  }

  const name = teachers.get(token);
  if (!name) {
    ctx.response.redirect("/dashboard/login");
    return false;
  }
  const teacher = (await getTeachers()).find((t) => t.name === name);
  if (!teacher) {
    ctx.response.redirect("/dashboard/login");
    return false;
  }

  return teacher;
}

const BUTTON = (text: string, action: string) =>
  `<form action="${action}"><button type="submit">${text}</button></form>`;

const LIST_SESSIONS = (teacherName: string) => {
  console.log("Listing sessions for", teacherName, sessions);
  const ownedSessions: Sessions = new Map();
  for (const [code, session] of sessions) {
    if (session.owner === teacherName) {
      ownedSessions.set(code, session);
    }
  }

  return `<ul>
    ${Array.from(ownedSessions)
      .map(
        ([code, session]) =>
          `<li>${code} (${session.users.size}) ${BUTTON(
            `Join`,
            `/dashboard/sessions/${code}/join`
          )} ${BUTTON(`Delete`, `/dashboard/sessions/${code}/delete`)}</li>`
      )
      .join("")}
    </ul>`;
};

dashboardRouter.get("/", async (ctx) => {
  const auth = await checkAuth(ctx);
  if (!auth) return;

  let randomCode = "";

  do {
    randomCode = Math.random().toString(36).slice(2, 8);
  } while (sessions.has(randomCode));

  ctx.response.body = BASE(`<h2>Sessions</h2>
    ${LIST_SESSIONS(auth.name)}
    <form method="post" action="/dashboard/sessions">
      <input type="text" name="session-code" aria-label="Prefered Session Code" value="${randomCode}">
      <button type="submit">Create Session</button>
    </form>`);
});

dashboardRouter.post("/sessions", async (ctx) => {
  const auth = await checkAuth(ctx);
  if (!auth) return;

  const body = await ctx.request.body.formData();
  const sessionCode = body.get("session-code")?.toString() || "";
  if (!sessionCode) {
    ctx.response.redirect("/dashboard");
    return;
  }

  if (sessions.has(sessionCode)) {
    ctx.response.redirect("/dashboard");
    return;
  }

  sessions.set(sessionCode, {
    owner: auth.name,
    data: {},
    module: availableModules.get("idle")!,
    users: new Map(),
  });
  ctx.response.redirect("/dashboard");
});

dashboardRouter.get("/sessions/:code/delete", async (ctx) => {
  const auth = await checkAuth(ctx);
  if (!auth) return;

  const code = ctx.params.code;
  if (!code) {
    ctx.response.redirect("/dashboard");
    return;
  }

  if (!sessions.has(code)) {
    ctx.response.redirect("/dashboard");
    return;
  }

  const session = sessions.get(code);
  if (session?.owner !== auth.name) {
    ctx.response.redirect("/dashboard");
    return;
  }

  for (const [token, session] of users) {
    if (session === code) users.delete(token);
  }
  sessions.delete(code);
  ctx.response.redirect("/dashboard");
});

dashboardRouter.get("/sessions/:code/join", async (ctx) => {
  const auth = await checkAuth(ctx);
  if (!auth) return;

  const code = ctx.params.code;
  if (!code) {
    ctx.response.redirect("/dashboard");
    return;
  }

  if (!sessions.has(code)) {
    ctx.response.redirect("/dashboard");
    return;
  }

  const session = sessions.get(code);
  if (!session) {
    ctx.response.redirect("/dashboard");
    return;
  }

  if (session.users.has(auth.name)) {
    ctx.response.redirect("/dashboard");
    return;
  }

  const token = Math.random().toString(36).slice(2);
  await ctx.cookies.set("token", token, {
    httpOnly: false,
  });

  users.set(token, code);
  session.users.set(token, {
    name: auth.name,
    sses: [],
    teacher: true,
  });
  ctx.response.redirect("/");
});

dashboardRouter.get("/login", (ctx) => {
  ctx.response.body = BASE(`<form method="post" class="login">
  <label>
    Name
  </label>
  <input type="text" name="name">
  <label>
    Password
  </label>
  <input type="password" name="password">
  <button type="submit">Login</button>
</form>`);
});

dashboardRouter.post("/login", async (ctx) => {
  let name = "";
  let password = "";
  try {
    const body = await ctx.request.body.formData();
    name = body.get("name")?.toString() || "";
    password = body.get("password")?.toString() || "";
  } catch (e: unknown) {
    console.error("Failed to parse body", e);
    ctx.response.redirect("/dashboard/login");
    return;
  }

  const teacher = (await getTeachers()).find((t) => t.name === name);
  if (!teacher) {
    ctx.response.redirect("/dashboard/login");
    return;
  }

  const valid = await validatePassword(teacher, password);
  if (!valid) {
    ctx.response.redirect("/dashboard/login");
    return;
  }

  const token = Math.random().toString(36).slice(2);
  teachers.set(token, teacher.name);
  ctx.cookies.set("teacher-token", token);
  ctx.response.redirect("/dashboard");
});
