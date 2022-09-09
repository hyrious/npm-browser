import { observable } from "@hyrious/utils";

export const events = observable<{
  search: string;
}>();
