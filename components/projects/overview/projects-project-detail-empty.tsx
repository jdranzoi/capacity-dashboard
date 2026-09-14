import {
  DataSectionPanel,
  DataSectionPanelHeader,
} from '@/components/ui/data-section-panel'

export function ProjectsProjectDetailEmpty({
  description = "Select a project from the grid to view delivery metrics.",
}: {
  description?: string
}) {
  return (
    <DataSectionPanel dataSlot="projects-overview-detail" className="gap-3">
      <DataSectionPanelHeader
        title="Project detail"
        description={description}
      />
      <p className="text-xs text-muted-foreground">
        Execution, role hours, and weekly velocity appear here.
      </p>
    </DataSectionPanel>
  );
}
