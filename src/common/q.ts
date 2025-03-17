
const queryRegex = /^((?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)(@[^/]+)?(\/[^:]+)?(:\d+(?:-\d+)?)?$/;

export interface IQuery {
  name: string;
  spec: string;
  path: string;
  startLine: number;
  endLine: number;
}

export function parseQuery(query: string): IQuery | null {
  const match = query.match(queryRegex);
  if (!match) { return null; }

  const name = match[1] || '';
  const spec = match[2] ? match[2].slice(1) : '';
  const path = match[3] || '';
  let startLine = 0, endLine = 0;
  if (match[4]) {
    const lines = match[4].split('-');
    startLine = parseInt(lines[0], 10);
    endLine = lines.length > 1 ? parseInt(lines[1], 10) : startLine;

    if (isNaN(startLine) || isNaN(endLine)) {
      startLine = 0;
      endLine = 0;
    }
  }

  return { name, spec, path, startLine, endLine };
}

// The loose one from the 'semver' package, without 'v' prefix
const semver = /(\d+)\.(\d+)\.(\d+)(?:-?((?:\d+|\d*[A-Za-z-][\dA-Za-z-]*)(?:\.(?:\d+|\d*[A-Za-z-][\dA-Za-z-]*))*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?/;

export function isValidVersion(spec: string): boolean {
  const match = spec.match(semver);
  return match !== null && match.index === 0 && match[0].length === spec.length;
}
