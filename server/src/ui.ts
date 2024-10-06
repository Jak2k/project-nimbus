export const USER_NOT_FOUND_RELOAD = () =>
  `<p id="main" hx-swap-oob="true">User not found.<script>window.location.reload()</script></p>`;

const USER_LIST = (users: Map<string, { name: string; teacher: boolean }>) =>
  Array.from(users.values())
    .map((user) => `<li>${user.name} ${user.teacher ? "(Teacher)" : ""}</li>`)
    .join("");

const HEADER = (
  sessionCode: string,
  user: { name: string; teacher: boolean }
) => {
  const logo = user.teacher
    ? `<button id='back'>Back</button>
    <script>
        document.getElementById("back").addEventListener("click", () => {
            fetch("/api/action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: "switchModule",
                    module: "idle",
                }),
            });
        }
        );
    </script>`
    : `<span>Nimbus</span>`;

  const exportButton = user.teacher
    ? `<a target="_blank" href="/api/export" download>Export</a>`
    : "";
  return `<header><span>${user.name}</span>${logo}<span><span>${sessionCode}</span>${exportButton}<span></header>`;
};

export const NEWLY_JOINED = (
  sessionCode: string,
  user: { name: string; teacher: boolean },
  session: { users: Map<string, { name: string; teacher: boolean }> }
) => `<div id="main" hx-swap-oob="true">
${HEADER(sessionCode, user)}
<details>
  <summary>Users</summary> 
  <ul id="users">
    ${USER_LIST(session.users)}
  </ul>
</details>
<div id="module"></div>
</div>`;

export const USER_JOINED = (session: {
  users: Map<string, { name: string; teacher: boolean }>;
}) => `<ul id="users" hx-swap-oob="true">
  ${USER_LIST(session.users)}
</ul>`;
