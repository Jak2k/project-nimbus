import { availableModules } from "./index.ts";
import { GetInitialData, GetInitialView, Handler, Module } from "./shared.ts";

type Data = Record<string, never>;

const handler: Handler<Data> = (_body, _data, _ctx, _send, _user) => {};
const initialData: GetInitialData<Data> = (_users) => ({});
const getInitialView: GetInitialView<Data> = (_data, user) => {
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
    <form id="module-import">
      <input type="file" name="module" />
      <button type="submit">Import</button>
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
        document.getElementById("module-import").addEventListener("submit", (event) => {
            event.preventDefault();
            const fileContent = new FormData(event.target).get("module");
            if (!fileContent) {
                alert("No file selected!");
            }
            fetch("/api/import", {
                method: "POST",
                body: fileContent,
            });
        });
    </script>`;
};
export const idle: Module<Data> = {
  initialData,
  handler,
  getInitialView,
  name: "idle",
  displayName: "Idle",
};