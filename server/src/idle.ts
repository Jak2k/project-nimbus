import { availableModules } from "./index.ts";
import { GetInitialData, GetInitialView, Handler, Module } from "./shared.ts";

type Data = Record<string, never>;

const handler: Handler<Data> = (_body, _data, _ctx, _send, _user) => {};
const initialData: GetInitialData<Data> = (_users) => ({});
const getInitialView: GetInitialView<Data> = (_data, user, session_code) => {
  if (!user.teacher)
    return `<h1>Idle</h1>
    <p>Waiting for the teacher to start a module...</p>`;

  return `<h1>Idle</h1>
    <p>Please select a module.</p>
    <ul id="module-selector">
      ${Array.from(availableModules.keys())
        .map(
          (module) =>
            `<li><button id="${module}">${
              availableModules.get(module)!.displayName
            }</button></li>`
        )
        .join("")}
    </ul>
    <h2>Import a module</h2>
    <form id="module-import">
      <input type="file" name="module" id="importfile" />
    </form>
    <script>
        document.querySelectorAll("#module-selector button").forEach((button) => {
            button.addEventListener("click", () => {
                fetch("/api/action", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "switchModule",
                        module: button.id,
                    }),
                });
            });
        });
        document.querySelector("#importfile").addEventListener("input", (event) => {
            const fileContent = event.target.files?.[0];
            if (!fileContent) {
                alert("No file selected!");
            }
            fetch("/api/import", {
                method: "POST",
                body: fileContent,
            });
        });
    </script>
    <h2>Magic Link</h2>
    <p>Share this link with your students so they can join your session without manually entering the code:</p>
    <code id="magic-link"></code>
    <qr-code margin="1" modulesize="8" />
    <script>
        document.querySelector("#magic-link").innerText = window.location.href + "?code=${session_code}";
        // set data attribute for qr-code element
        document.querySelector("qr-code").setAttribute("data", window.location.href + "?code=${session_code}");
    </script>`;
};
export const idle: Module<Data> = {
  initialData,
  handler,
  getInitialView,
  name: "idle",
  displayName: "Idle",
};
