import HostedGitInfo from 'hosted-git-info'

// https://github.com/npm/cli/blob/latest/lib/commands/repo.js
export function get_git_repo(mani: any) {
  const r = mani.repository
  // prettier-ignore
  const rurl = !r ? null
    : typeof r === 'string' ? r
    : typeof r === 'object' && typeof r.url === 'string' ? r.url
    : null

  if (!rurl) return null

  const info = hostedFromMani(mani)
  const url = info ? info.browse(mani.repository.directory) : unknownHostedUrl(rurl)

  return url
}

export function hostedFromMani(mani: any): HostedGitInfo | null {
  const r = mani.repository
  // prettier-ignore
  const rurl = !r ? null
    : typeof r === 'string' ? r
    : typeof r === 'object' && typeof r.url === 'string' ? r.url
    : null

  return (rurl && HostedGitInfo.fromUrl(rurl.replace(/^git\+/, ''))) || null
}

const unknownHostedUrl = (url: string) => {
  try {
    const { protocol, hostname, pathname } = new URL(url)

    if (!protocol || !hostname) {
      return null
    }

    const proto = /(git\+)http:$/.test(protocol) ? 'http:' : 'https:'
    const path = pathname.replace(/\.git$/, '')
    return `${proto}//${hostname}${path}`
  } catch (e) {
    return null
  }
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
