export interface Vulnerability {
  id: number
  url: string
  title: string
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical'
  vulnerable_versions: string
  cwe: string[]
  cvss: {
    score: number
    vectorString: string
  }
}

export async function audit(name: string, version: string): Promise<Vulnerability[]> {
  try {
    const res = await fetch(
      'https://netlify.hyrious.me/proxy/https://registry.npmjs.org/-/npm/v1/security/advisories/bulk',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [name]: [version] }),
      },
    )
    if (!res.ok) {
      throw new Error((await res.text()) || res.statusText)
    }
    const data: { [name: string]: Vulnerability[] | undefined } = await res.json()
    return data[name] || []
  } catch (e) {
    console.error(e)
    return []
  }
}
