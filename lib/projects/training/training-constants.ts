import type { TrainingStatusBucket } from '@/lib/projects/training/training-types'

export const TRAINING_PROJECT_KEY = 'MCT'

export const TRAINING_MISSING_KEY = '__missing__'

export const TRAINING_MISSING_LABEL = 'Missing'

export const TRAINING_STATUS_BUCKET_LABEL: Record<TrainingStatusBucket, string> = {
  in_progress: 'In progress',
  todo: 'To do',
  done: 'Done',
  other: 'Other',
}

/** Display order for status columns and the activity status filter. */
export const TRAINING_STATUS_BUCKET_ORDER: TrainingStatusBucket[] = [
  'in_progress',
  'todo',
  'done',
  'other',
]
