import { Application, Context, Next, Router } from "@oak/oak";
import { send as oakSend } from "@oak/oak";
import { ServerSentEvent, ServerSentEventTarget } from "@oak/oak";
import * as UI from "./ui.ts";
import {
  Module,
  SendView,
  Session,
  SessionUser,
  Sessions,
  Users,
} from "./shared.ts";
import { idle } from "./idle.ts";
import { wordcloud } from "./wordcloud.ts";
import { partnermatcher } from "./partnermatcher.ts";
import { getTeachers, validatePassword } from "./auth.ts";

const api = new Router({
  prefix: "/api",
});

api.get("/", (ctx) => {
  ctx.response.body = "The API is working and ready to serve requests.";
});

function makeSend(session: Session<any>): SendView {
  return (view, conf) => {
    session.users.forEach((user) => {
      if (
        (conf.onlyTeacher && !user.teacher) ||
        (conf.onlyStudent && user.teacher) ||
        (conf.onlyWithNames &&
          conf.onlyWithNames.length > 0 &&
          !conf.onlyWithNames.includes(user.name))
      )
        return;
      user.sses.forEach((sse) => {
        sse.dispatchEvent(
          new ServerSentEvent("message", {
            data: view,
          })
        );
      });
    });
  };
}

export const availableModules = new Map<string, Module<any>>();
function registerModule<Data>(module: Module<Data>) {
  availableModules.set(module.name, module);
}
registerModule(idle);
registerModule(wordcloud);
registerModule(partnermatcher);

const users: Users = new Map<string, string>();
const sessions: Sessions = new Map();
// TODO: Remove dummy session
sessions.set("1234", {
  users: new Map(),
  module: idle,
  data: {},
});

api.get("/sse", async (ctx) => {
  ctx.response.type = "text/event-stream";
  const token = await ctx.cookies.get("token");
  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = "Authorization required";
    return;
  }

  if (!users.has(token)) {
    ctx.cookies.delete("token");
    const target = await ctx.sendEvents();
    target.dispatchEvent(
      new ServerSentEvent("message", {
        data: UI.USER_NOT_FOUND_RELOAD(),
      })
    );
    return;
  }

  const target = await ctx.sendEvents();
  const sessionCode = users.get(token)!;
  const session = sessions.get(sessionCode)!;
  const user = session.users.get(token)!;
  user.sses.push(target);

  console.log(`User ${user.name} connected`);

  user.sses.forEach((sse) => {
    sse.dispatchEvent(
      new ServerSentEvent("message", {
        data: UI.NEWLY_JOINED(sessionCode, user, session),
      })
    );

    sse.dispatchEvent(
      new ServerSentEvent("message", {
        data: `<div id="module" hx-swap-oob="true">${session.module.getInitialView(
          session.data,
          user,
          sessionCode,
          makeSend(session)
        )}</div>`,
      })
    );
  });

  target.addEventListener("close", () => {
    console.log(`User ${token} disconnected`);
    const index = user.sses.indexOf(target);
    if (index !== -1) {
      user.sses.splice(index, 1);
    }
  });
});

api.post("/action", async (ctx) => {
  const body = await ctx.request.body;
  let json: Record<string, any> = {
    action: "",
  };
  try {
    json = await body.json();
    if (!json.action) {
      throw new Error("No action provided");
    }
  } catch (error) {
    console.error(error);
    ctx.response.status = 400;
    ctx.response.body = `Invalid request body: ${error.message}`;
    return;
  }

  const token = await ctx.cookies.get("token");
  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = "Authorization required";
    return;
  }

  if (!users.has(token)) {
    ctx.response.status = 401;
    ctx.response.body = "User not found";
    return;
  }
  const userSession = users.get(token)!;
  const user = sessions.get(userSession)!.users.get(token)!;
  const session = sessions.get(userSession)!;
  const module = session.module;

  if (json.action === "switchModule") {
    if (!user.teacher) {
      ctx.response.status = 403;
      ctx.response.body = "Forbidden";
      return;
    } else if (!json.module) {
      ctx.response.status = 400;
      ctx.response.body = "No module provided";
      return;
    } else {
      if (!availableModules.has(json.module)) {
        ctx.response.status = 400;
        ctx.response.body = "Module not found";
        return;
      }
      const mod = availableModules.get(json.module)!;
      session.module = mod;
      const users: SessionUser[] = Array.from(session.users.values());
      session.data = mod.initialData(users);

      session.users.forEach((user) => {
        user.sses.forEach((sse) => {
          sse.dispatchEvent(
            new ServerSentEvent("message", {
              data: `<div hx-swap-oob="true" id="module">${mod.getInitialView(
                session.data,
                user,
                userSession,
                makeSend(session)
              )}</div>`,
            })
          );
        });
      });
    }
  }

  console.log(`User ${user.name} sent an action: ${json.action}`);
  module.handler(json, session.data, ctx, makeSend(session), user);

  ctx.response.body = "Action sent";
  ctx.response.status = 200;
});

api.get("/export", async (ctx) => {
  const token = await ctx.cookies.get("token");
  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = "Authorization required";
    return;
  }

  if (!users.has(token)) {
    ctx.response.status = 401;
    ctx.response.body = "User not found";
    return;
  }
  const userSession = users.get(token)!;
  const user = sessions.get(userSession)!.users.get(token)!;
  const session = sessions.get(userSession)!;
  const module = session.module;

  if (!user.teacher) {
    ctx.response.status = 403;
    ctx.response.body = "Forbidden";
    return;
  }

  const exportData = {
    module: module.name,
    data: session.data,
  };

  const EXPORT_HEADER = `This is an export of the current state of the ${module.name} module in Nimbus. To import this data, please create a Nimbus session or join an existing one as a teacher and upload this file in the module "Idle" module.\n\n===\n\n`;

  const exportText = EXPORT_HEADER + JSON.stringify(exportData, null, 0);

  ctx.response.type = "text/plain";
  ctx.response.body = exportText;
  ctx.response.status = 200;
});

api.post("/import", async (ctx) => {
  const token = await ctx.cookies.get("token");
  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = "Authorization required";
    return;
  }

  if (!users.has(token)) {
    ctx.response.status = 401;
    ctx.response.body = "User not found";
    return;
  }
  const userSession = users.get(token)!;
  const user = sessions.get(userSession)!.users.get(token)!;
  const session = sessions.get(userSession)!;
  const module = session.module;

  const fileContent = await ctx.request.body.text();
  const jsonText = fileContent.split("\n\n===\n\n")[1];
  let json: Record<string, any> = {};
  try {
    json = JSON.parse(jsonText);
    if (!json.module || !json.data) {
      throw new Error("Invalid JSON structure");
    }
  } catch (error) {
    console.error(error);
    ctx.response.status = 400;
    ctx.response.body = `Invalid request body: ${error.message}`;
    return;
  }

  if (!availableModules.has(json.module)) {
    ctx.response.status = 400;
    ctx.response.body = "Module not found";
    return;
  }
  const mod = availableModules.get(json.module)!;
  session.module = mod;
  session.data = json.data;

  session.users.forEach((user) => {
    user.sses.forEach((sse) => {
      sse.dispatchEvent(
        new ServerSentEvent("message", {
          data: `<div hx-swap-oob="true" id="module">${mod.getInitialView(
            session.data,
            user,
            userSession,
            makeSend(session)
          )}</div>`,
        })
      );
    });
  });

  ctx.response.body = "Module imported";
  ctx.response.status = 200;
});

api.post("/login", async (ctx) => {
  let name = "";
  let sessionCode = "";
  let teacher = false;
  let password = "";
  try {
    const body = await ctx.request.body.json();
    name = body.name;
    sessionCode = body.sessionCode;
    teacher = body.teacher;
    password = body.password;
  } catch (error) {
    console.error(error);
    ctx.response.status = 400;
    ctx.response.body = "Invalid request body";
    return;
  }

  // TODO: Check password of teacher
  if (!sessions.has(sessionCode)) {
    ctx.response.status = 401;
    ctx.response.body = "Invalid session code";
    return;
  }

  if (teacher) {
    const teacherEntry = (await getTeachers()).find((t) => t.name === name);
    if (!teacherEntry) {
      ctx.response.status = 401;
      ctx.response.body = "Teacher not found";
      return;
    }
    if (!(await validatePassword(teacherEntry, password))) {
      ctx.response.status = 401;
      ctx.response.body = "Invalid password";
      return;
    }
  }

  const session = sessions.get(sessionCode)!;

  const existingNames = Array.from(session.users.values());
  if (existingNames.some((user) => user.name === name)) {
    ctx.response.status = 401;
    ctx.response.body = "Name already taken";
    return;
  }

  const token = Math.random().toString(36).slice(2);

  ctx.cookies.set("token", token, {
    httpOnly: false,
  });
  users.set(token, sessionCode);
  session.users.set(token, {
    name: name
      .trim()
      .replace(/ /g, "_")
      .replace(/[^a-zA-Z0-9_äüöß/-ÄÜÖ]/g, ""),
    teacher,
    sses: [],
  });
  session.users.forEach((user) => {
    user.sses.forEach((sse) => {
      sse.dispatchEvent(
        new ServerSentEvent("message", {
          data: UI.USER_JOINED(session),
        })
      );
    });
  });

  ctx.response.status = 200;
});

const app = new Application();
app.use(async (ctx: Context, next: Next) => {
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  await next();
});
app.use(api.routes());
app.use(api.allowedMethods());

app.use(async (ctx) => {
  if (ctx.response.status === 404) {
    await oakSend(ctx, ctx.request.url.pathname, {
      root: `../client/dist`,
      index: "index.html",
    });
  }
});

app.listen({ port: 3069 });
console.log("Server running on http://localhost:3069");
