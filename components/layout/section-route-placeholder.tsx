import { SectionPlaceholder } from '@/components/layout/section-placeholder'
import { getNavigationEntryByHref } from '@/lib/navigation/search-navigation'

/** Resolves nav-catalog metadata for a href and renders {@link SectionPlaceholder}. */
export function SectionRoutePlaceholder({ href }: { href: string }) {
  const entry = getNavigationEntryByHref(href)

  if (!entry) {
    return (
      <SectionPlaceholder
        section="Section"
        subsection="Page"
        description="This view is not registered in the navigation catalog yet."
      />
    )
  }

  const sectionLabel = entry.breadcrumb.split(' / ').slice(-1)[0] ?? entry.label

  return (
    <SectionPlaceholder
      section={sectionLabel}
      subsection={entry.label}
      description={entry.description}
    />
  )
}
