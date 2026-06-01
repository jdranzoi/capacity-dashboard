import { redirect } from 'next/navigation'

/** Legacy Portfolio URL — Overview is the delivery dashboard entry point. */
export default function ProjectsPortfolioRedirectPage() {
  redirect('/projects/overview')
}
