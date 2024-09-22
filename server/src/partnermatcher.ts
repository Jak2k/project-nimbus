import { Socket } from "socket.io";
import { actionHandler, joinHandler } from ".";

let userData: {
  name: string;
  status: "alone" | "waiting" | "partnered" | "done";
  partner?: string;
}[] = [];

const handleAction: actionHandler = (
  action: string,
  data: any,
  user: {
    isAdmin: boolean;
    name: string;
  },
  broadcast: (event: string, data: any) => void
) => {
  switch (action) {
    case "partnermatcher.doneAlone": {
      const i = userData.findIndex((u) => u.name === user.name);
      if (i === -1) return false;
      userData[i].status = "waiting";

      // search for another user that is waiting
      const partnerI = userData.findIndex(
        (u) => u.status === "waiting" && u.name !== user.name
      );
      if (partnerI === -1) {
        // no partner found
        broadcast("partnermatcher.updateUsers", userData);
        return true;
      }

      // partner found
      userData[i].status = "partnered";
      userData[partnerI].status = "partnered";
      userData[i].partner = userData[partnerI].name;
      userData[partnerI].partner = user.name;

      broadcast("partnermatcher.updateUsers", userData);
      return true;
    }
    case "partnermatcher.donePartnered": {
      const i = userData.findIndex((u) => u.name === user.name);
      if (i === -1) return false;
      userData[i].status = "done";
      const partnerI = userData.findIndex(
        (u) => u.name === userData[i].partner
      );
      if (partnerI === -1) return false;
      userData[partnerI].status = "done";
      broadcast("partnermatcher.updateUsers", userData);
      return true;
    }
    case "partnermatcher.undo": {
      const i = userData.findIndex((u) => u.name === user.name);
      if (i === -1) return false;
      userData[i].status = "alone";

      if (userData[i].partner !== undefined) {
        const partnerI = userData.findIndex(
          (u) => u.name === userData[i].partner
        );
        if (partnerI === -1) return false;
        userData[partnerI].status = "waiting";
        userData[i].partner = undefined;
        userData[partnerI].partner = undefined;
      }
      broadcast("partnermatcher.updateUsers", userData);
      return true;
    }
    default:
      return false;
  }
};

const handleJoin: joinHandler = (
  socket: Socket,
  broadcast: (even: string, data: any) => void
) => {
  if (userData.some((u) => u.name === socket.handshake.auth.name)) {
    socket.emit("partnermatcher.updateUsers", userData);
    return;
  }

  userData.push({
    name: socket.handshake.auth.name,
    status: "alone",
  });
  broadcast("partnermatcher.updateUsers", userData);
};

const init = (
  broadcast: (event: string, data: any) => void,
  users: String[]
) => {
  userData = users.map((u) => ({
    name: u as string,
    status: "alone",
  }));
  broadcast("partnermatcher.updateUsers", userData);
};

const handleDownload = (req: any, res: any) => {
  res.end(JSON.stringify(userData));
};

export default {
  handleAction,
  handleJoin,
  init,
  id: "partnermatcher",
  handleDownload,
};
