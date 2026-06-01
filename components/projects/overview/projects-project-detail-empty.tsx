import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from '@/components/ui/data-section-panel'

export function ProjectsProjectDetailEmpty() {
  return (
    <DataSectionPanel dataSlot="projects-overview-detail" className="gap-4">
      <DataSectionPanelHeader
        title="Project detail"
        description="Select a project from the grid to view delivery metrics."
      />
      <p className="text-xs text-muted-foreground">
        Execution, role hours, and weekly velocity appear here.
      </p>
    </DataSectionPanel>
  )
}
