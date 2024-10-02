import express from "express";
import http from "http";
import path from "path";
import os from "os";
import { fork } from "child_process";
import fs from "fs";
import cookieParser from "cookie-parser";

const app = express();
const server = http.createServer(app);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const STATIC_DIR = path.resolve("./static_assets");

const INDEX_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Nimbus Management Dashboard</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <h1>Nimbus Management Dashboard</h1>
  <h2>Create a new instance</h2>
  <form action="/create" method="GET">
    <label for="name">Name:</label>
    <input type="text" name="name" id="name" required>
    <button type="submit">Create</button>
    <p class="disabled-hint">Name already in use</p>
  </form>

  <h2>Running instances</h2>
  <ul>{{ instances }}</ul>

  <script>
    document.querySelector("#name").addEventListener("input", async (e) => {
      const name = e.target.value;
      const res = await fetch("/check/" + name);
      if (res.status === 200) {
        document.querySelector("button[type=submit]").disabled = false;
      } else {
        document.querySelector("button[type=submit]").disabled = true;
      }
    });
  </script>
</body>
`;

const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Login to Nimbus Management Dashboard</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <h1>Nimbus Management Dashboard</h1>
  <h2>Create a new instance</h2>
  <form method="POST">
    <label for="token">Token:</label>
    <input type="password" name="token" id="token" required>
    <label for="consent"><input type="checkbox" name="consent" id="consent"> I consent to product analytics for improving the software</label>
    
    <button type="submit">Login</button>
  </form>
</body>`;

const INSTANCE_TEMPLATE = `<li><a href="http://{{ name }}.{{ host }}/?pwd={{ pwd }}">{{ name }}</a> <a href="/delete/{{ name }}" class="button destructive">Delete</a></li>`;

app.use(express.static(STATIC_DIR));

app.use((req, res, next) => {
  if (req.path === "/login" || req.path === "/style.css") {
    return next();
  }

  if (req.cookies["nimbus-teacher-token"]) {
    const token = req.cookies["nimbus-teacher-token"];

    // check that token is alphanumerical
    if (!token.match(/^[a-zA-Z0-9]+$/)) {
      res.statusCode = 400;
      res.end("Invalid token");
    }

    // open ../.data/auth.csv
    // check if token exists in auth.csv (second column) and get the first column (name)
    const file = fs.readFileSync("../.data/auth.csv", "utf-8");
    const lines = file.split("\n");
    const name = lines
      .map((line) => line.split(","))
      .find((line) => line[1] === token)?.[0];

    if (!name) {
      res.statusCode = 400;
      res.end("Invalid token");
    }

    req.user = name;
    return next();
  }

  res.redirect(302, `/login?redirect=${req.path}`);
});

app.get("/", (req, res) => {
  if (!users.has(req.user as string)) {
    users.set(req.user as string, new Map());
  }
  const children = users.get(req.user as string)!;
  const instances = Array.from(children.keys())
    .map((name) =>
      INSTANCE_TEMPLATE.replace(/{{ name }}/g, name)
        .replace(/{{ host }}/g, HOST)
        .replace(/{{ pwd }}/g, children.get(name)!.adminPassword)
    )
    .join("");
  res.end(INDEX_PAGE.replace("{{ instances }}", instances));
});

const HOST = (
  await fetch(
    "http://localhost:2019/config/apps/http/servers/srv0/routes/0/match/0/host/0"
  ).then((res) => res.text())
).slice(1, -2);

async function registerInstance(port: number, name: string) {
  await fetch(`http://localhost:2019/config/apps/http/servers/srv0/routes/0`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      handle: [
        {
          handler: "subroute",
          routes: [
            {
              handle: [
                {
                  handler: "reverse_proxy",
                  upstreams: [
                    {
                      dial: `localhost:${port}`,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      match: [
        {
          host: [`${name}.${HOST}`],
        },
      ],
    }),
  });
}

async function unregisterInstance(port: number) {
  const routes = await fetch(
    "http://localhost:2019/config/apps/http/servers/srv0/routes/"
  ).then((res) => res.json());
  const indexToDelete = routes.findIndex(
    (route: any) =>
      route.handle[0].routes[0].handle[0].upstreams[0].dial ===
      `localhost:${port}`
  );

  if (indexToDelete === -1) {
    return;
  }

  await fetch(
    `http://localhost:2019/config/apps/http/servers/srv0/routes/${indexToDelete}`,
    {
      method: "DELETE",
    }
  );
}

async function startInstance(
  port: number,
  name: string,
  adminPassword: string
) {
  await registerInstance(port, name);
  const config = {
    adminPassword: adminPassword,
    port,
  };
  // spawn process
  const child = fork("../server/src/index.js", [JSON.stringify(config)]);

  child.on("exit", () => {
    unregisterInstance(port);
  });

  return () => {
    child.kill();
  };
}

type Child = {
  port: number;
  stop: () => void;
  adminPassword: string;
};

const users = new Map<string, Map<string, Child>>();

app.get("/create", async (req, res) => {
  if (!users.has(req.user as string)) {
    users.set(req.user as string, new Map());
  }
  const children = users.get(req.user as string)!;

  let port = 1234;
  users.forEach((children) => {
    children.forEach((child) => {
      if (child.port === port) {
        port++;
      }
    });
  });
  const name = req.query.name as string;
  let exit = false;
  users.forEach((children) => {
    if (children.has(name)) {
      res.statusCode = 400;
      res.end("Name already in use");
      exit = true;
    }
  });
  if (exit) return;

  const adminPassword = Math.random().toString(36).slice(2);
  const stop = await startInstance(port, name, adminPassword);
  children.set(name, { port, stop, adminPassword });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  res.redirect(302, `/`);
  console.log(users);
});

app.get("/check/:name", async (req, res) => {
  const name = req.params.name as string;

  let exit = false;
  users.forEach((children) => {
    if (children.has(name)) {
      res.statusCode = 400;
      res.end("Name already in use");
      exit = true;
    }
  });
  if (exit) return;

  res.end("Name available");
});

app.get("/delete/:name", async (req, res) => {
  const name = req.params.name as string;

  if (!users.has(req.user as string)) {
    res.statusCode = 400;
    res.end("Nothing to delete not found");
    return;
  }

  const children = users.get(req.user as string)!;

  children.get(name)?.stop();
  children.delete(name);
  res.redirect(302, "/");
});

app.get("/login", (req, res) => {
  res.end(LOGIN_PAGE);
});

app.post("/login", (req, res) => {
  const token = req.body.token as string;
  const consent = req.body.consent as string;
  if (!token.match(/^[a-zA-Z0-9]+$/)) {
    res.statusCode = 400;
    res.end("Invalid token");
  }

  const file = fs.readFileSync("../.data/auth.csv", "utf-8");
  const lines = file.split("\n");
  const name = lines
    .map((line) => line.split(","))
    .find((line) => line[1] === token)?.[0];

  if (!name) {
    res.statusCode = 400;
    res.end("Invalid token");
  }

  res.cookie("nimbus-teacher-token", token, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  });
  if (consent === "on") {
    // set cookie that's also visible on subdomains
    res.cookie("nimbus-analytics-consent", "true", {
      domain: HOST,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });
  }
  res.redirect(302, req.query.redirect as string);
});

server.listen(8069, () => {
  // get current ip address in local network
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach((ifname) => {
    ifaces[ifname]?.forEach((iface) => {
      if ("IPv4" !== iface.family || iface.internal !== false) {
        return;
      }
      console.log(`Open http://${iface.address}:8069/`);
    });
  });
  console.log(`Open http://${HOST}/`);
});
