const mirrors: string[] = ["https://registry.npmjs.cf"];

export function fetch_with_mirror_retry(input: RequestInfo | URL, init?: RequestInit) {
  let url: string = input as string;
  if (input instanceof URL) {
    url = input.href;
  }

  if (url.startsWith("https://registry.npmjs.org/")) {
    const end = url.slice(27);
    let p = fetch(input, init);
    for (const mirror of mirrors) {
      p = p.catch(() => fetch(`${mirror}/${end}`, init));
    }
    return p;
  }

  return fetch(input, init);
}
