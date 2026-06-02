import { PROJECT_BUDGET_AT_RISK_PCT } from '@/lib/domain/project-delivery-metrics'

export const PROJECTS_PROGRESS_COLUMN_TOOLTIPS = {
  project:
    'Project key and name. Select a row to open delivery metrics in the detail panel.',
  progress:
    'Logged versus planned hours for the filtered period. Purple is logged; the light track is remaining plan; a red segment and marker appear when logged exceeds planned.',
  planned:
    'Planned hours from the latest sync snapshot for the selected month (monthly view) or summed lifetime plans (build / global view).',
  logged:
    'Logged hours from project actuals or worklogs for the filtered period.',
  budgetUsed: `Logged hours as a percentage of project budget hours. Values above ${PROJECT_BUDGET_AT_RISK_PCT}% (budget + 15%) are highlighted in red and count toward Projects at risk.`,
} as const
