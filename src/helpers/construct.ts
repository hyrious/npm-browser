export interface FileEntry {
  name: string;
  path: string;
  collapsed: boolean;
  children?: FileEntry[];
}

// construct(["a/b", "a/b/c"]) => { name: a, children: [{ name: b, children: [{ name: c }] }] }
export function construct(array: string[], focus = "") {
  const root: FileEntry = { name: "", path: "", collapsed: false };
  const openFolders = new Set();
  if (focus) {
    let path = "";
    if (focus[0] === "/") {
      focus = focus.slice(1);
    }
    focus.split("/").forEach((part) => {
      path += "/" + part;
      openFolders.add(path);
    });
  }
  array.sort().forEach((line) => {
    let current = root;
    // skip non-real files
    if (line.endsWith("/")) return;
    const parts = line.split("/");
    let path = "";
    for (let part of parts) {
      path += "/" + part;
      const children = (current.children ||= []);
      let child = children.find((e) => e.name === part);
      if (!child) {
        children.push((child = { name: part, path, collapsed: !openFolders.has(path) }));
      }
      current = child;
    }
  });
  return root;
}
