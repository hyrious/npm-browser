import { normalize_git_repo } from "../helpers/utils";

const decoder = new TextDecoder();
export const pkg = computed(() => {
  const f = files.value.find((e) => trim_root(e.name) === "package.json");
  if (!f) return "";
  return JSON.parse(decoder.decode(f.buffer));
});
export const repo = computed(() => find_github_repo());
export const desc = computed(() => pkg.value.description);

function trim_root(str: string) {
  const i = str.indexOf("/");
  if (i !== -1) str = str.slice(i + 1);
  return str;
}

function find_github_repo() {
  const repo = pkg.value.repository;
  if (typeof repo === "string") return normalize_git_repo(repo);
  if (typeof repo === "object" && repo.type === "git") return normalize_git_repo(repo.url);
  return "";
}
