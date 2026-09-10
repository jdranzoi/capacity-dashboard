import { TRAINING_MISSING_KEY } from '@/lib/projects/training/training-constants'

export type TrainingRouteFilters = {
  monthKey: string | null
  versionKey: string | null
  componentKey: string | null
  /** Jira label — the narrowest taxonomy level below component. */
  topicKey: string | null
  personQuery: string | null
  missingOnly: boolean
}

function firstString(
  value: string | string[] | undefined
): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export function pickTrainingSearchParams(
  raw: Record<string, string | string[] | undefined>
): TrainingRouteFilters {
  const missing = firstString(raw.missing)
  return {
    monthKey: firstString(raw.month),
    versionKey: firstString(raw.version),
    componentKey: firstString(raw.component),
    topicKey: firstString(raw.topic),
    personQuery: firstString(raw.q)?.trim() || null,
    missingOnly: missing === '1' || missing === 'true',
  }
}

export function trainingSlotKey(filters: TrainingRouteFilters): string {
  return [
    filters.monthKey ?? '',
    filters.versionKey ?? '',
    filters.componentKey ?? '',
    filters.topicKey ?? '',
    filters.personQuery ?? '',
    filters.missingOnly ? '1' : '0',
  ].join('|')
}

export function isMissingTaxonomyKey(key: string | null): boolean {
  return key === TRAINING_MISSING_KEY
}
