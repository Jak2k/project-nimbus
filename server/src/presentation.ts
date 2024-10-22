import { Handler, GetInitialView, GetInitialData } from "./shared.ts";
import { Module } from "./shared.ts";

type Data = {
  pdfUrl: string;
  currentSlide: number;
};

const handler: Handler<Data> = (body, data, ctx, send, user) => {
  if (body.action === "presentation.upload") {
    data.pdfUrl = body.pdfUrl;
    send(`<div id="pdf-container" hx-swap-oob="true"><iframe src="${data.pdfUrl}" width="100%" height="600px"></iframe></div>`, {
      onlyTeacher: false,
      onlyStudent: false,
      onlyWithNames: [],
    });
  } else if (body.action === "presentation.changeSlide") {
    data.currentSlide = body.slideNumber;
    send(`<div id="pdf-container" hx-swap-oob="true"><iframe src="${data.pdfUrl}#page=${data.currentSlide}" width="100%" height="600px"></iframe></div>`, {
      onlyTeacher: false,
      onlyStudent: false,
      onlyWithNames: [],
    });
  }
};

const initialData: GetInitialData<Data> = (_users) => ({
  pdfUrl: "",
  currentSlide: 1,
});

const getInitialView: GetInitialView<Data> = (data, user, _session_code) => {
  if (user.teacher) {
    return `<h1>Presentation Mode</h1>
      <form id="pdf-upload-form">
        <label for="pdf-upload">Upload PDF:</label>
        <input type="file" id="pdf-upload" accept="application/pdf" />
      </form>
      <div id="pdf-container">
        ${data.pdfUrl ? `<iframe src="${data.pdfUrl}#page=${data.currentSlide}" width="100%" height="600px"></iframe>` : ""}
      </div>
      <script>
        document.getElementById("pdf-upload").addEventListener("change", async (event) => {
          const input = event.target;
          if (input.files && input.files[0]) {
            const formData = new FormData();
            formData.append("pdf", input.files[0]);

            const response = await fetch("/api/upload-pdf", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              const pdfUrl = await response.text();
              fetch("/api/action", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  action: "presentation.upload",
                  pdfUrl,
                }),
              });
            } else {
              alert("Failed to upload PDF");
            }
          }
        });

        document.getElementById("pdf-container").addEventListener("click", (event) => {
          const target = event.target;
          if (target.tagName === "IFRAME") {
            const slideNumber = prompt("Enter slide number to display:");
            if (slideNumber) {
              fetch("/api/action", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  action: "presentation.changeSlide",
                  slideNumber: parseInt(slideNumber, 10),
                }),
              });
            }
          }
        });
      </script>`;
  } else {
    return `<h1>Presentation Mode</h1>
      <div id="pdf-container">
        ${data.pdfUrl ? `<iframe src="${data.pdfUrl}#page=${data.currentSlide}" width="100%" height="600px"></iframe>` : ""}
      </div>`;
  }
};

export const presentation: Module<Data> = {
  initialData,
  handler,
  getInitialView,
  name: "presentation",
  displayName: "Presentation Mode",
};
