import repoUrlFromPackage from 'repo-url-from-package'

export function get_git_repo(mani: any) {
  const { url } = repoUrlFromPackage(mani)
  return url
}

export function github_compare(repo: string, from: string, to: string) {
  const m = repo.match(/github\.com\/([^/]+\/[^/]+)/)
  if (m) {
    const end = m.index! + m[0].length
    const base = repo.slice(0, end)
    return `${base}/compare/${to_tag(repo, from)}...${to_tag(repo, to)}`
  }
}

function to_tag(repo: string, v: string) {
  if (repo.includes('sveltejs/svelte') && +v[0] > 3) {
    return 'svelte@' + v
  }
  if (repo.includes('codemirror/') || repo.includes('markdown-it/')) {
    return v
  }
  // TODO: add more special cases
  return 'v' + v
}
