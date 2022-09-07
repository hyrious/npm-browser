import { observable } from "@hyrious/utils";

export const events = observable<{
  message: string;
  "status-on": [key: string, name: string];
  "status-off": string;
}>();

export function installing(name: string) {
  events.emit("status-on", ["status-installing", name]);
}

export function installed() {
  events.emit("status-off", "status-installing");
}

Object.assign(window, {
  events,
});
