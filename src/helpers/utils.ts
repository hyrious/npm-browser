import repoUrlFromPackage from 'repo-url-from-package'

export function get_git_repo(mani: any) {
  const { url } = repoUrlFromPackage(mani)
  return url
}

interface PackageJSON {
  repository?: string | { url: string; directory?: string }
}

function is_monorepo(mani: PackageJSON) {
  return typeof mani.repository === 'object' && !!mani.repository.directory
}

export function github_compare(mani: any, from: string, to: string) {
  const repo = get_git_repo(mani)
  if (!repo) return

  const m = repo.match(/github\.com\/([^/]+\/[^/]+)/)
  if (m) {
    const mono = is_monorepo(mani) ? mani.name : null
    const end = m.index! + m[0].length
    const base = repo.slice(0, end)
    return `${base}/compare/${to_tag(repo, from, mono)}...${to_tag(repo, to, mono)}`
  }
}

function to_tag(repo: string, v: string, mono: string | null) {
  if (repo.includes('sveltejs/svelte') && +v[0] > 3) {
    return 'svelte@' + v
  }
  if (repo.includes('codemirror/') || repo.includes('markdown-it/')) {
    return v
  }
  if (mono != null) {
    return mono + '@' + v
  }
  // TODO: add more special cases
  return 'v' + v
}

export function format_date(d: Date): string {
  return d.toISOString().slice(0, 10)
}
