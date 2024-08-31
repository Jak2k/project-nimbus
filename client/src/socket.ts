import { io } from "socket.io-client";

export const state = reactive<{
  pin: string;
  started: boolean;
  connected: boolean;
  isAdmin: boolean;
  users: string[];

  module: string;
}>({
  pin: "",
  started: false,
  connected: false,
  isAdmin: false,
  users: [],

  module: "waiting",
});

function randomSecret() {
  return Math.random().toString(36).substring(2, 15);
}

export const secret = useLocalStorage("nimus_secret", randomSecret());

const window = globalThis?.window || {};

export const URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : `${window?.location?.protocol || "https"}//${window?.location?.host || ""}`;

export const socket = io(URL, {
  autoConnect: false,
});

socket.on("connect", () => {
  state.connected = true;
});

socket.on("disconnect", () => {
  state.connected = false;
});

socket.on("updateUsers", (users: string[]) => {
  state.users = users;
});

socket.on("updateModule", (module: string) => {
  state.module = module;
});

socket.on("restarting", () => {
  setTimeout(() => {
    window.location.reload();
  }, 2000);
});

export function activateModule(module: string) {
  socket.emit("activateModule", module);
}

export function restart() {
  if (!state.isAdmin) return;

  // ask for confirmation
  const confirmed = confirm(
    "Are you sure you want to restart the server and kick all users?",
  );

  if (!confirmed) return;

  socket.emit("restart");
}
