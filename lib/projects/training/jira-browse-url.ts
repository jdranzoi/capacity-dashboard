const FALLBACK_JIRA_BASE_URL = 'https://deplabs.atlassian.net'

export function jiraIssueBrowseUrl(issueKey: string): string {
  const raw = process.env.JIRA_BASE_URL?.trim()
  const base = (raw && raw.length > 0 ? raw : FALLBACK_JIRA_BASE_URL).replace(/\/$/, '')
  return `${base}/browse/${encodeURIComponent(issueKey)}`
}
