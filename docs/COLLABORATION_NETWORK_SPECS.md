# Teams > Collaboration Network

## Objective

Provide a visual and analytical view of how people collaborate across projects.

The purpose of this section is not to show capacity or utilization, but rather to understand team dynamics, identify stable working groups, detect fragmentation, reveal organizational dependencies, and support staffing decisions.

The dashboard should answer questions such as:

- Which PMs work most frequently with which TLs?
- Which TLs consistently collaborate with the same developers?
- Which people are highly fragmented across multiple teams?
- Which squads naturally emerge over time?
- Which relationships are strongest within the organization?
- Which individuals represent a concentration risk or single point of failure?

---

# Navigation

Location:

Teams
└── Collaboration Network

---

# Data Model

## Person

Represents an individual contributor.

Fields:

- id
- name
- role
- activeProjects
- totalLoggedHours
- region
- status

Roles:

- Project Manager
- Technical Lead
- Full Stack Developer
- Front End Developer
- QA Tester
- Analytics
- UI Designer

---

## Collaboration Edge

Represents a relationship between two people.

Fields:

- personA
- personB
- sharedProjects
- sharedHours
- firstCollaborationDate
- lastCollaborationDate
- currentProjects

Example:

Erica Dini ↔ Alejandra Fernandez

sharedProjects = 12
sharedHours = 2480

---

# Filters

Positioned at the top of the page.

## Time Range

Options:

- Current Month
- Last 3 Months
- Last 6 Months

Purpose:

Restrict collaboration calculations to the selected period.

---

## Project Category

Options:

- All
- Build
- Support
- Change Request
- Warranty
- Internal

Purpose:

Restrict relationships to projects matching the selected category.

---

## Search Person

Autocomplete search.

Purpose:

Focus graph and detail panel on a specific individual.

---

# KPI Row

Provide high-level organizational insights.

---

## Active Collaborators

Definition:

Count of people participating in at least one project during the selected period.

Formula:

People with logged hours > 0

---

## Average Connections

Definition:

Average number of collaborators per person.

Formula:

Total collaboration edges / total active people

---

## Most Connected TL

Definition:

Technical Lead with highest number of unique collaborators.

Display:

Name
Connection count

---

## Stable Squads

Definition:

Number of recurring collaboration groups detected.

Future feature.

---

## Collaboration Density

Definition:

Relationship density within the network.

Formula:

Existing Connections / Possible Connections

Displayed as percentage.

---

# Collaboration Network Graph

## Purpose

Primary visualization of organizational collaboration.

Shows how people interact across projects.

---

## Technology

Recommended:

react-force-graph

Reasons:

- Excellent Next.js support
- Interactive force-directed layout
- Zoom and drag support
- Handles large datasets
- Supports dynamic filtering

---

## Node Definition

Each node represents one person.

---

## Node Color

Based on role.

Example:

PM = Blue
TL = Purple
FSD = Green
FED = Cyan
QA = Orange

---

## Node Size

Configurable.

Recommended:

Number of active projects

Alternative:

Total logged hours

---

## Edge Definition

Represents collaboration between two people.

Edge exists if both participated in the same project.

---

## Edge Weight

Determined by selected collaboration metric.

Mode 1:

Shared Projects

Mode 2:

Shared Hours

---

## Node Hover

Display:

- Name
- Role
- Active Projects
- Collaborators
- Fragmentation Score

---

## Node Click

Opens Person Detail Drawer.

---

## Edge Click

Opens Relationship Detail Panel.

---

# Collaboration Insights Panel

Positioned to the right of the graph.

Purpose:

Provide immediately actionable insights.

No charts.

Only derived metrics.

---

## Strongest PM ↔ TL Pair

Definition:

PM/TL relationship with highest collaboration score.

Display:

- PM Name
- TL Name
- Shared Projects
- Shared Hours

---

## Highest Fragmentation

Definition:

Person collaborating across the highest number of distinct groups.

Display:

- Name
- Connection Count

---

## Most Connected TL

Definition:

Technical Lead with largest collaboration network.

Display:

- Name
- Collaborators

---

## Isolated Resources

Definition:

People with only one active collaboration.

Display:

Count

---

## Most Stable Squad

Definition:

Longest-running recurring collaboration group.

Display:

People involved
Months together

---

# Collaboration Matrix

## Purpose

Provide a structured alternative to the network graph.

Allows managers to identify patterns quickly.

---

## Visualization

Heatmap matrix.

Rows:

PMs

Columns:

TLs

Cell Value:

Shared Projects

or

Shared Hours

Depending on selected mode.

---

## Color Scale

Low collaboration:

Light

High collaboration:

Dark

---

## Cell Interaction

Click cell:

Opens Relationship Detail Panel.

---

## Technology

TanStack Table

Combined with CSS Grid and Tailwind.

---

# Relationship Detail Panel

Displayed when selecting an edge or matrix cell.

Purpose:

Understand a specific collaboration relationship.

---

## Header

Person A ↔ Person B

Display:

Name
Role

---

## KPI Section

### Shared Projects

Number of projects both worked on.

---

### Shared Hours

Total hours contributed together.

---

### First Collaboration

Date relationship started.

---

### Current Projects

Active projects today.

---

## Shared Projects List

Display:

Project Name
Project Type

Example:

- ABC Warehouse
- ScreenFlex
- Spirit of 76

---

## Shared Team Members

People who frequently appear alongside both individuals.

Display:

Name
Role

---

## Future Section

Collaboration Timeline

Shows collaboration strength over time.

---

# Person Detail Drawer

Displayed when selecting a node.

Purpose:

Understand an individual's collaboration footprint.

---

## Header

Display:

- Name
- Role

---

## KPI Section

### Active Projects

Count

### Collaborators

Count

### Shared Hours

Total

---

## Top Collaborators

Ranked list.

Display:

- Name
- Shared Projects
- Shared Hours

---

## Collaboration Distribution

Breakdown by role.

Example:

TL = 45%
Developers = 30%
QA = 15%
Other = 10%

Visualization:

Horizontal stacked bar.

---

## Fragmentation Score

Definition:

Measure of how distributed a person is across teams.

Formula:

Unique Collaborators / Active Projects

Display:

- Score
- Risk Level

Levels:

- Low
- Moderate
- High

---

# Future Enhancements

## Stable Squads Detection

Automatically detect recurring groups using graph clustering algorithms.

Recommended:

- Louvain
- Leiden

Outputs:

- Squad members
- Shared projects
- Shared hours
- Collaboration duration

---

## Organizational Risk Analysis

Metrics:

- Single Points of Failure
- Collaboration Dependency Score
- Leadership Concentration
- Bus Factor

---

## Historical Network Playback

Ability to replay collaboration evolution month-by-month.

Useful for:

- Organizational changes
- Growth analysis
- Team restructuring

---

# MVP Scope

Phase 1 should only include:

1. Collaboration Network Graph
2. Collaboration Insights Panel
3. Collaboration Matrix
4. Relationship Detail Panel
5. Person Detail Drawer

Everything else should be considered future iterations.

```

```
