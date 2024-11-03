import { Context, ServerSentEventTarget } from "@oak/oak";

// *** USERS & SESSIONS ***

export type Users = Map<string, string>; // token -> session code
export type SessionUser = {
  name: string;
  teacher: boolean;
  sses: ServerSentEventTarget[];
};
export type Session<Data> = {
  users: Map<string, SessionUser>;
  module: Module<Data>;
  data: Data;
  owner: string;
};
// deno-lint-ignore no-explicit-any
export type Sessions = Map<string, Session<any>>; // session code -> session

// *** MODULES ***
export type SendConfig = {
  onlyTeacher: boolean;
  onlyStudent: boolean;
  onlyWithNames: string[];
};
export type SendView = (view: string, conf: SendConfig) => void;
export type Handler<Data> = (
  // deno-lint-ignore no-explicit-any
  body: any,
  data: Data,
  ctx: Context,
  send: SendView,
  user: SessionUser
) => void;
export type GetInitialView<Data> = (
  data: Data,
  user: SessionUser,
  session_code: string,
  send: SendView
) => string;
export type GetInitialData<Data> = (users: SessionUser[]) => Data;

export type Module<Data> = {
  initialData: GetInitialData<Data>;
  handler: Handler<Data>;
  getInitialView: GetInitialView<Data>;
  name: string;
  displayName: string;
};
