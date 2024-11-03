import { match } from "npm:path-to-regexp@6.2.1";
import { Handler, GetInitialView, GetInitialData } from "./shared.ts";
import { Module } from "./shared.ts";

type Partner = {
  name: string;
  status: "alone" | "waiting" | "partnered" | "done";
  partner?: string;
};

export type Data = {
  partners: Partner[];
};

const PARTNER_LI = (partner: Partner, swap = false) => {
  const html = `<li id="partner-${partner.name}" ${
    swap ? 'hx-swap-oob="true"' : ""
  }>${partner.name} (${partner.status}${
    partner.partner !== undefined ? " with " + partner.partner : ""
  })</li>`;
  console.log(html);
  return html;
};

const USER_BUTTONS = (partner: Partner) => {
  let statusButton = "";
  if (partner.status === "alone") {
    statusButton = `<button id="doneAlone" class="partner-action">Done Alone</button>`;
  } else if (partner.status === "waiting") {
    statusButton = ``;
  } else if (partner.status === "partnered") {
    statusButton = `<button id="donePartnered" class="partner-action">Done Partnered</button>`;
  } else if (partner.status === "done") {
    statusButton = ``;
  }
  const undoButton =
    partner.status === "waiting" || partner.status === "partnered"
      ? `<button id="undo" class="partner-action">Undo</button>`
      : "";

  let script = `<script>
    for (const button of document.getElementsByClassName("partner-action")) {
      button.addEventListener("click", (e) => {
        const action = e.target.id;
        const body = { action: "partnermatcher." + action };
        fetch("/api/action", {
          method: "POST",
          body: JSON.stringify(body),
        });
      });
    }
    </script>`;

  return statusButton + undoButton + script;
};

const USER_DISPLAY = (partner: Partner, swap = false) =>
  `<div id="partner_display" ${
    swap ? 'hx-swap-oob="true"' : ""
  }><p>You are <strong>${partner.status}</strong>` +
  (partner.partner !== undefined
    ? ` with <strong>${partner.partner}</strong>`
    : "") +
  "</p>" +
  USER_BUTTONS(partner) +
  "</div>";

const handler: Handler<Data> = (body, data, ctx, send, user) => {
  if (body.action === "partnermatcher.doneAlone") {
    // send(`<ul id="words" hx-swap-oob="true">${WORDCLOUD(data.words)}</ul>`);
    const userI = data.partners.findIndex(
      (partner) => partner.name === user.name
    );
    if (userI === -1) {
      return;
    }
    data.partners[userI].status = "waiting";

    const waitingPartnerI = data.partners.findIndex(
      (partner) => partner.name !== user.name && partner.status === "waiting"
    );
    if (waitingPartnerI === -1) {
      send(PARTNER_LI(data.partners[userI], true), {
        onlyTeacher: true,
        onlyStudent: false,
        onlyWithNames: [],
      });
      send(USER_DISPLAY(data.partners[userI], true), {
        onlyTeacher: false,
        onlyStudent: true,
        onlyWithNames: [user.name],
      });
      return;
    }

    data.partners[userI].status = "partnered";
    data.partners[waitingPartnerI].status = "partnered";
    data.partners[userI].partner = data.partners[waitingPartnerI].name;
    data.partners[waitingPartnerI].partner = data.partners[userI].name;

    send(PARTNER_LI(data.partners[userI], true), {
      onlyTeacher: true,
      onlyStudent: false,
      onlyWithNames: [],
    });
    send(PARTNER_LI(data.partners[waitingPartnerI], true), {
      onlyTeacher: true,
      onlyStudent: false,
      onlyWithNames: [],
    });
    send(USER_DISPLAY(data.partners[userI], true), {
      onlyTeacher: false,
      onlyStudent: true,
      onlyWithNames: [data.partners[userI].name],
    });
    send(USER_DISPLAY(data.partners[waitingPartnerI], true), {
      onlyTeacher: false,
      onlyStudent: true,
      onlyWithNames: [data.partners[waitingPartnerI].name],
    });
  } else if (body.action === "partnermatcher.donePartnered") {
    const userI = data.partners.findIndex(
      (partner) => partner.name === user.name
    );
    if (userI === -1) {
      return;
    }
    const partnerI = data.partners.findIndex(
      (partner) => partner.name === data.partners[userI].partner
    );
    if (partnerI === -1) {
      return;
    }

    data.partners[userI].status = "done";
    data.partners[partnerI].status = "done";

    send(PARTNER_LI(data.partners[userI], true), {
      onlyTeacher: true,
      onlyStudent: false,
      onlyWithNames: [],
    });
    send(PARTNER_LI(data.partners[partnerI], true), {
      onlyTeacher: true,
      onlyStudent: false,
      onlyWithNames: [],
    });
    send(USER_DISPLAY(data.partners[userI], true), {
      onlyTeacher: false,
      onlyStudent: true,
      onlyWithNames: [data.partners[userI].name],
    });
    send(USER_DISPLAY(data.partners[partnerI], true), {
      onlyTeacher: false,
      onlyStudent: true,
      onlyWithNames: [data.partners[partnerI].name],
    });
  } else if (body.action === "partnermatcher.undo") {
    const userI = data.partners.findIndex(
      (partner) => partner.name === user.name
    );
    if (userI === -1) {
      return;
    }

    if (data.partners[userI].status === "partnered") {
      const partnerI = data.partners.findIndex(
        (partner) => partner.name === data.partners[userI].partner
      );
      if (partnerI === -1) {
        return;
      }
      data.partners[partnerI].status = "waiting";
      data.partners[partnerI].partner = undefined;
      data.partners[userI].partner = undefined;
      data.partners[userI].status = "alone";

      send(PARTNER_LI(data.partners[partnerI], true), {
        onlyTeacher: true,
        onlyStudent: false,
        onlyWithNames: [],
      });
      send(USER_DISPLAY(data.partners[partnerI], true), {
        onlyTeacher: false,
        onlyStudent: true,
        onlyWithNames: [data.partners[partnerI].name],
      });
    } else if (data.partners[userI].status === "waiting") {
      data.partners[userI].status = "alone";
    }
    send(PARTNER_LI(data.partners[userI], true), {
      onlyTeacher: true,
      onlyStudent: false,
      onlyWithNames: [],
    });
    send(USER_DISPLAY(data.partners[userI], true), {
      onlyTeacher: false,
      onlyStudent: true,
      onlyWithNames: [data.partners[userI].name],
    });
  }
};

const initialData: GetInitialData<Data> = (users) => ({
  partners: users
    .filter((user) => !user.teacher)
    .map((user) => ({
      name: user.name,
      status: "alone",
      partner: undefined,
    })),
});

const getInitialView: GetInitialView<Data> = (
  data,
  user,
  _session_code,
  send
) => {
  if (
    !data.partners.find((partner) => partner.name === user.name) &&
    !user.teacher
  ) {
    data.partners.push({
      name: user.name,
      status: "alone",
      partner: undefined,
    });
    send(
      `<ul id="partners" hx-swap-oob="true">
      ${data.partners.map((p) => PARTNER_LI(p, false)).join("")}
    </ul>`,
      {
        onlyTeacher: true,
        onlyStudent: false,
        onlyWithNames: [],
      }
    );
  }
  if (user.teacher) {
    return `<h1>Partnerwork Matcher</h1>
    <ul id="partners">
      ${data.partners.map((p) => PARTNER_LI(p, false)).join("")}
    </ul>
  `;
  } else {
    return `<h1>Partnerwork Matcher</h1>
    ${USER_DISPLAY(data.partners.find((p) => p.name === user.name)!, false)}
    `;
  }
};

export const partnermatcher: Module<Data> = {
  initialData,
  handler,
  getInitialView,
  name: "partnermatcher",
  displayName: "Partnerwork Matcher",
};
