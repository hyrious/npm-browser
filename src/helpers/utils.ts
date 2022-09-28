export function normalize_git_repo(repo: string) {
  if (repo.startsWith("git+")) {
    repo = repo.slice(4);
  }
  if (repo.endsWith(".git")) {
    repo = repo.slice(0, -4);
  }
  if (repo.startsWith("https://github.com/")) {
    repo = repo.slice(19);
  }
  if (repo.startsWith("git://github.com/")) {
    repo = repo.slice(17);
  }
  return repo;
}
