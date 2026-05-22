import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  User,
  Users,
} from 'lucide-react'

import type { SectionNavItemStatus } from '@/lib/navigation/section-nav-config'

/** Root breadcrumb prefix for search results (Vercel-style path). */
export const NAV_BREADCRUMB_ROOT = 'Workforce'

export type NavigationCatalogItem = {
  label: string
  href: string
  description: string
  breadcrumb: string
  status?: SectionNavItemStatus
  icon?: LucideIcon
}

export type NavigationDomainConfig = {
  id: string
  label: string
  description: string
  coreQuestion: string
  icon: LucideIcon
  defaultHref: string
  items: NavigationCatalogItem[]
}

export const NAV_OVERVIEW: NavigationCatalogItem = {
  label: 'Overview',
  href: '/',
  description:
    'Global org health at a glance. Org health, utilization, delivery risk, staffing pressure, top alerts, trends, project portfolio health.',
  breadcrumb: NAV_BREADCRUMB_ROOT,
  icon: LayoutDashboard,
}

export const NAV_ASK: NavigationCatalogItem = {
  label: 'Ask',
  href: '/ask',
  description: 'Claude-powered agent interface. Ask questions scoped to your role context.',
  breadcrumb: `${NAV_BREADCRUMB_ROOT} / Ask`,
  icon: MessageSquare,
}

function domainItem(
  domainLabel: string,
  label: string,
  href: string,
  description: string,
  status?: SectionNavItemStatus
): NavigationCatalogItem {
  return {
    label,
    href,
    description,
    breadcrumb: `${NAV_BREADCRUMB_ROOT} / ${domainLabel}`,
    status,
  }
}

export const NAV_DOMAINS: NavigationDomainConfig[] = [
  {
    id: 'capacity',
    label: 'Capacity',
    coreQuestion: 'Can we absorb work?',
    description:
      'Understand how capacity is distributed and consumed. Utilization, planning, forecast, allocations, bench, PTO impact, saturation, hiring gaps.',
    icon: Gauge,
    defaultHref: '/capacity/overview',
    items: [
      domainItem('Capacity', 'Overview', '/capacity/overview', 'High-level KPIs and summary.'),
      domainItem(
        'Capacity',
        'Utilization',
        '/capacity/utilization',
        'Role and person operational usage. Capacity fill, billable %, logged trends, PTO impact, saturation analysis.'
      ),
      domainItem(
        'Capacity',
        'Operations',
        '/capacity/operations',
        'Current month operational usage. Utilization, logged, billable, PTO, operational saturation.'
      ),
      domainItem(
        'Capacity',
        'Planning',
        '/capacity/planning',
        'Planned commitments and capacity outlook. Planned utilization by role and project, monthly planning horizon, coverage gaps.'
      ),
      domainItem(
        'Capacity',
        'Allocations',
        '/capacity/allocations',
        'Detailed people/project allocations. People-to-project mapping, allocation %, split allocations, staffing load.'
      ),
      domainItem(
        'Capacity',
        'Bench',
        '/capacity/bench',
        'Unallocated and open capacity analysis. Idle capacity, future availability, underutilized teams, staffing opportunities.'
      ),
      domainItem(
        'Capacity',
        'Scenarios',
        '/capacity/scenarios',
        'What-if simulations. Hiring simulations, project expansion impact, PTO stress testing, staffing redistribution.',
        'future'
      ),
    ],
  },
  {
    id: 'people',
    label: 'People',
    coreQuestion: 'Who is overloaded?',
    description:
      'Analyze individual workload and operational load. Utilization per person, fragmentation, PTO, performance indicators, workload distribution, cross-team allocation.',
    icon: User,
    defaultHref: '/people/directory',
    items: [
      domainItem(
        'People',
        'Directory',
        '/people/directory',
        'Searchable people index. Roles, teams, seniority, regions, project participation.'
      ),
      domainItem(
        'People',
        'Utilization',
        '/people/utilization',
        'Individual workload analysis. Capacity fill, logged hours, billable %, operational load, overtime indicators.'
      ),
      domainItem(
        'People',
        'Fragmentation',
        '/people/fragmentation',
        'Too many projects per person, context switching, split allocations, organizational inefficiency.',
        'coming-soon'
      ),
      domainItem(
        'People',
        'Availability',
        '/people/availability',
        'Future open capacity. Upcoming PTO, allocation gaps, staffing readiness.',
        'coming-soon'
      ),
      domainItem(
        'People',
        'Performance',
        '/people/performance',
        'Operational delivery metrics (not HR). Allocation consistency, delivery participation, utilization balance, workload stability.',
        'coming-soon'
      ),
      domainItem(
        'People',
        'Skills',
        '/people/skills',
        'Skill inventory and capability map.',
        'future'
      ),
    ],
  },
  {
    id: 'teams',
    label: 'Teams',
    coreQuestion: 'Which teams are healthy?',
    description:
      'Understand team structures and dynamics. Team composition, delivery load, capacity health, role distribution, staffing balance, inter-team dependencies.',
    icon: Users,
    defaultHref: '/teams/overview',
    items: [
      domainItem(
        'Teams',
        'Overview',
        '/teams/overview',
        'Organizational structure visualization. Headcount, roles, geographic distribution. Seniority mix and skill composition surfaced as placeholders until a data source exists.'
      ),
      domainItem(
        'Teams',
        'Composition',
        '/teams/composition',
        'Project teams view. Cards per active project grouped by project type (build / support), ordered by PM. Name filter shows which projects a person belongs to.'
      ),
      domainItem(
        'Teams',
        'Staffing',
        '/teams/staffing',
        'Resource allocation by team. Project allocations, staffing distribution, cross-team participation, allocation balance.',
        'coming-soon'
      ),
      domainItem(
        'Teams',
        'Dependencies',
        '/teams/dependencies',
        'Inter-team operational relationships. Shared resources, delivery dependencies, leadership overlap, collaboration patterns.',
        'coming-soon'
      ),
      domainItem(
        'Teams',
        'Skills coverage',
        '/teams/skills-coverage',
        'Capability strength by team. Technology concentration, specialization gaps, redundancy analysis, critical skill risk.',
        'future'
      ),
      domainItem(
        'Teams',
        'Health',
        '/teams/health',
        'Composite operational health scoring. Overload risk, fragmentation, PTO pressure, staffing stability, delivery consistency.',
        'coming-soon'
      ),
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    coreQuestion: 'Which deliveries are at risk?',
    description:
      'Understand the operational state of active projects. Staffing, burn, delivery risk, allocation, velocity, project health score, dependency mapping.',
    icon: Briefcase,
    defaultHref: '/projects/portfolio',
    items: [
      domainItem(
        'Projects',
        'Portfolio',
        '/projects/portfolio',
        'High-level portfolio overview. Active projects, delivery status, staffing distribution, portfolio load.'
      ),
      domainItem(
        'Projects',
        'Health',
        '/projects/health',
        'Project operational health scoring. Delivery risk, staffing pressure, PTO impact, utilization imbalance, allocation instability.',
        'coming-soon'
      ),
      domainItem(
        'Projects',
        'Staffing',
        '/projects/staffing',
        'Project staffing analysis. Assigned people, allocation %, staffing gaps, cross-team staffing.',
        'coming-soon'
      ),
      domainItem(
        'Projects',
        'Delivery',
        '/projects/delivery',
        'Execution and delivery metrics. Throughput, ticket progress, delivery consistency, operational velocity, blocker analysis.',
        'coming-soon'
      ),
      domainItem(
        'Projects',
        'Financials',
        '/projects/financials',
        'Operational financial visibility. Billable utilization, burn tracking, budget consumption, staffing cost efficiency.',
        'future'
      ),
      domainItem(
        'Projects',
        'Dependencies',
        '/projects/dependencies',
        'Project relationship mapping. Shared teams, staffing conflicts, delivery dependencies, operational bottlenecks.',
        'coming-soon'
      ),
    ],
  },
]
