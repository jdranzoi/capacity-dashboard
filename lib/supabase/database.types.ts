
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "dim_holiday": {
                  Row: {
                    "date": string,"id": string,"name": string,"zone_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "date": string,"id"?: string,"name": string,"zone_id": string
                  }
                  Update: {
                    "date"?: string,"id"?: string,"name"?: string,"zone_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dim_holiday_zone_id_fkey"
      columns: ["zone_id"]
isOneToOne: false
      referencedRelation: "dim_zone"
      referencedColumns: ["id"]
    }
                  ]
                },"dim_issue": {
                  Row: {
                    "assignee_person_id": string | null,"components": (string)[],"first_seen_at": string,"fix_versions": (string)[],"id": string,"is_child": boolean | null,"issue_key": string,"issue_type": string,"jira_created_at": string | null,"jira_issue_id": number,"jira_updated_at": string | null,"labels": (string)[],"original_estimate_seconds": number | null,"parent_issue_key": string | null,"parent_summary": string | null,"priority": string | null,"project_id": string,"resolved_at": string | null,"status": string,"status_category": string | null,"summary": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_person_id"?: string | null,"components"?: (string)[],"first_seen_at"?: string,"fix_versions"?: (string)[],"id"?: string,"is_child"?: never,"issue_key": string,"issue_type": string,"jira_created_at"?: string | null,"jira_issue_id": number,"jira_updated_at"?: string | null,"labels"?: (string)[],"original_estimate_seconds"?: number | null,"parent_issue_key"?: string | null,"parent_summary"?: string | null,"priority"?: string | null,"project_id": string,"resolved_at"?: string | null,"status": string,"status_category"?: string | null,"summary": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_person_id"?: string | null,"components"?: (string)[],"first_seen_at"?: string,"fix_versions"?: (string)[],"id"?: string,"is_child"?: never,"issue_key"?: string,"issue_type"?: string,"jira_created_at"?: string | null,"jira_issue_id"?: number,"jira_updated_at"?: string | null,"labels"?: (string)[],"original_estimate_seconds"?: number | null,"parent_issue_key"?: string | null,"parent_summary"?: string | null,"priority"?: string | null,"project_id"?: string,"resolved_at"?: string | null,"status"?: string,"status_category"?: string | null,"summary"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dim_issue_assignee_person_id_fkey"
      columns: ["assignee_person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dim_issue_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "dim_project"
      referencedColumns: ["id"]
    }
                  ]
                },"dim_person": {
                  Row: {
                    "created_at": string | null,"deactivated_at": string | null,"hire_date": string | null,"id": string,"is_active": boolean,"is_contractor": boolean,"jira_account_id": string | null,"name": string,"role_id": string | null,"updated_at": string | null,"zone_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"deactivated_at"?: string | null,"hire_date"?: string | null,"id"?: string,"is_active"?: boolean,"is_contractor"?: boolean,"jira_account_id"?: string | null,"name": string,"role_id"?: string | null,"updated_at"?: string | null,"zone_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"deactivated_at"?: string | null,"hire_date"?: string | null,"id"?: string,"is_active"?: boolean,"is_contractor"?: boolean,"jira_account_id"?: string | null,"name"?: string,"role_id"?: string | null,"updated_at"?: string | null,"zone_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "dim_person_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dim_person_zone_id_fkey"
      columns: ["zone_id"]
isOneToOne: false
      referencedRelation: "dim_zone"
      referencedColumns: ["id"]
    }
                  ]
                },"dim_person_employment_history": {
                  Row: {
                    "created_at": string,"end_date": string,"id": string,"note": string | null,"person_id": string,"start_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_date": string,"id"?: string,"note"?: string | null,"person_id": string,"start_date": string
                  }
                  Update: {
                    "created_at"?: string,"end_date"?: string,"id"?: string,"note"?: string | null,"person_id"?: string,"start_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dim_person_employment_history_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    }
                  ]
                },"dim_person_month_role": {
                  Row: {
                    "created_at": string,"month_date": string,"person_id": string,"role_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"month_date": string,"person_id": string,"role_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"month_date"?: string,"person_id"?: string,"role_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dim_person_month_role_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dim_person_month_role_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    }
                  ]
                },"dim_project": {
                  Row: {
                    "budget_hours": number | null,"created_at": string | null,"end_date": string | null,"id": string,"is_commercial": boolean,"project_key": string,"project_name": string | null,"project_type": string,"projected_hours_at_completion": number | null,"size_bucket": string | null,"start_date": string | null,"status": string,"target_release_date": string | null,"tech_stack": (string)[] | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "budget_hours"?: number | null,"created_at"?: string | null,"end_date"?: string | null,"id"?: string,"is_commercial"?: boolean,"project_key": string,"project_name"?: string | null,"project_type"?: string,"projected_hours_at_completion"?: number | null,"size_bucket"?: string | null,"start_date"?: string | null,"status"?: string,"target_release_date"?: string | null,"tech_stack"?: (string)[] | null,"updated_at"?: string | null
                  }
                  Update: {
                    "budget_hours"?: number | null,"created_at"?: string | null,"end_date"?: string | null,"id"?: string,"is_commercial"?: boolean,"project_key"?: string,"project_name"?: string | null,"project_type"?: string,"projected_hours_at_completion"?: number | null,"size_bucket"?: string | null,"start_date"?: string | null,"status"?: string,"target_release_date"?: string | null,"tech_stack"?: (string)[] | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "dim_project_project_type_fkey"
      columns: ["project_type"]
isOneToOne: false
      referencedRelation: "dim_project_type"
      referencedColumns: ["key"]
    }
                  ]
                },"dim_project_type": {
                  Row: {
                    "created_at": string,"is_commercial": boolean,"key": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"is_commercial"?: boolean,"key": string,"label": string
                  }
                  Update: {
                    "created_at"?: string,"is_commercial"?: boolean,"key"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"dim_role": {
                  Row: {
                    "created_at": string | null,"id": string,"in_scope": boolean,"key": string,"label": string,"priority": number,"tempo_team_id": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"in_scope"?: boolean,"key": string,"label": string,"priority"?: number,"tempo_team_id"?: number | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"in_scope"?: boolean,"key"?: string,"label"?: string,"priority"?: number,"tempo_team_id"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"dim_zone": {
                  Row: {
                    "created_at": string | null,"id": string,"key": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"key": string,"label": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"key"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fact_bench": {
                  Row: {
                    "availability_hours": number | null,"availability_pct": number | null,"created_at": string | null,"id": string,"is_bench": boolean,"month_date": string,"net_capacity_hours": number,"person_id": string,"planned_hours": number,"reserved_hours": number,"role_id": string | null,"snapshot_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "availability_hours"?: never,"availability_pct"?: number | null,"created_at"?: string | null,"id"?: string,"is_bench"?: boolean,"month_date": string,"net_capacity_hours": number,"person_id": string,"planned_hours"?: number,"reserved_hours"?: number,"role_id"?: string | null,"snapshot_id": string
                  }
                  Update: {
                    "availability_hours"?: never,"availability_pct"?: number | null,"created_at"?: string | null,"id"?: string,"is_bench"?: boolean,"month_date"?: string,"net_capacity_hours"?: number,"person_id"?: string,"planned_hours"?: number,"reserved_hours"?: number,"role_id"?: string | null,"snapshot_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_bench_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_bench_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_bench_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "sync_snapshot"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_capacity": {
                  Row: {
                    "created_at": string | null,"employed_from": string | null,"employed_through": string | null,"holidays": number,"id": string,"month_date": string,"net_capacity_hours": number,"net_working_days": number,"person_id": string,"pto_days": number,"pto_hours": number,"role_id": string | null,"snapshot_id": string,"total_working_days": number,"zone_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"employed_from"?: string | null,"employed_through"?: string | null,"holidays"?: number,"id"?: string,"month_date": string,"net_capacity_hours": number,"net_working_days": number,"person_id": string,"pto_days"?: number,"pto_hours"?: number,"role_id"?: string | null,"snapshot_id": string,"total_working_days": number,"zone_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"employed_from"?: string | null,"employed_through"?: string | null,"holidays"?: number,"id"?: string,"month_date"?: string,"net_capacity_hours"?: number,"net_working_days"?: number,"person_id"?: string,"pto_days"?: number,"pto_hours"?: number,"role_id"?: string | null,"snapshot_id"?: string,"total_working_days"?: number,"zone_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_capacity_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_capacity_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_capacity_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "sync_snapshot"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_capacity_zone_id_fkey"
      columns: ["zone_id"]
isOneToOne: false
      referencedRelation: "dim_zone"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_demand": {
                  Row: {
                    "created_at": string,"demand_kind": string,"id": string,"issue_id": string | null,"month_date": string,"planned_hours": number,"project_id": string,"role_id": string,"snapshot_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"demand_kind": string,"id"?: string,"issue_id"?: string | null,"month_date": string,"planned_hours"?: number,"project_id": string,"role_id": string,"snapshot_id": string
                  }
                  Update: {
                    "created_at"?: string,"demand_kind"?: string,"id"?: string,"issue_id"?: string | null,"month_date"?: string,"planned_hours"?: number,"project_id"?: string,"role_id"?: string,"snapshot_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_demand_issue_id_fkey"
      columns: ["issue_id"]
isOneToOne: false
      referencedRelation: "dim_issue"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_demand_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "dim_project"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_demand_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_demand_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "sync_snapshot"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_fragmentation": {
                  Row: {
                    "build_count": number,"build_projects": (string)[],"created_at": string | null,"flag_reason": string | null,"flagged": string,"id": string,"month_date": string,"person_id": string,"role_id": string | null,"snapshot_id": string,"source": string,"support_count": number,"support_projects": (string)[],"total_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "build_count"?: number,"build_projects"?: (string)[],"created_at"?: string | null,"flag_reason"?: string | null,"flagged"?: string,"id"?: string,"month_date": string,"person_id": string,"role_id"?: string | null,"snapshot_id": string,"source": string,"support_count"?: number,"support_projects"?: (string)[],"total_count"?: number
                  }
                  Update: {
                    "build_count"?: number,"build_projects"?: (string)[],"created_at"?: string | null,"flag_reason"?: string | null,"flagged"?: string,"id"?: string,"month_date"?: string,"person_id"?: string,"role_id"?: string | null,"snapshot_id"?: string,"source"?: string,"support_count"?: number,"support_projects"?: (string)[],"total_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_fragmentation_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_fragmentation_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_fragmentation_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "sync_snapshot"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_issue_worklogs": {
                  Row: {
                    "billable_seconds": number,"first_seen_at": string,"id": string,"issue_id": string,"log_date": string,"logged_seconds": number,"person_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billable_seconds"?: number,"first_seen_at"?: string,"id"?: string,"issue_id": string,"log_date": string,"logged_seconds"?: number,"person_id": string,"updated_at"?: string
                  }
                  Update: {
                    "billable_seconds"?: number,"first_seen_at"?: string,"id"?: string,"issue_id"?: string,"log_date"?: string,"logged_seconds"?: number,"person_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_issue_worklogs_issue_id_fkey"
      columns: ["issue_id"]
isOneToOne: false
      referencedRelation: "dim_issue"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_issue_worklogs_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_month_ops": {
                  Row: {
                    "commercial_logged_hours": number,"elapsed_net_weekdays": number,"id": string,"logged_hours": number,"month_date": string,"net_capacity_hours": number,"non_commercial_logged_hours": number,"person_id": string,"planned_hours": number,"pto_hours": number,"reserved_hours": number,"role_id": string | null,"source_capacity_snapshot_id": string | null,"updated_at": string,"zone_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "commercial_logged_hours"?: number,"elapsed_net_weekdays"?: number,"id"?: string,"logged_hours"?: number,"month_date": string,"net_capacity_hours"?: number,"non_commercial_logged_hours"?: number,"person_id": string,"planned_hours"?: number,"pto_hours"?: number,"reserved_hours"?: number,"role_id"?: string | null,"source_capacity_snapshot_id"?: string | null,"updated_at"?: string,"zone_id"?: string | null
                  }
                  Update: {
                    "commercial_logged_hours"?: number,"elapsed_net_weekdays"?: number,"id"?: string,"logged_hours"?: number,"month_date"?: string,"net_capacity_hours"?: number,"non_commercial_logged_hours"?: number,"person_id"?: string,"planned_hours"?: number,"pto_hours"?: number,"reserved_hours"?: number,"role_id"?: string | null,"source_capacity_snapshot_id"?: string | null,"updated_at"?: string,"zone_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_month_ops_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_month_ops_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_month_ops_source_capacity_snapshot_id_fkey"
      columns: ["source_capacity_snapshot_id"]
isOneToOne: false
      referencedRelation: "sync_snapshot"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_month_ops_zone_id_fkey"
      columns: ["zone_id"]
isOneToOne: false
      referencedRelation: "dim_zone"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_month_projects": {
                  Row: {
                    "id": string,"logged_hours": number,"month_date": string,"population_commercial_hours": number,"population_non_commercial_hours": number,"project_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"logged_hours"?: number,"month_date": string,"population_commercial_hours"?: number,"population_non_commercial_hours"?: number,"project_id": string,"updated_at"?: string
                  }
                  Update: {
                    "id"?: string,"logged_hours"?: number,"month_date"?: string,"population_commercial_hours"?: number,"population_non_commercial_hours"?: number,"project_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_month_projects_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "dim_project"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_plans": {
                  Row: {
                    "created_at": string | null,"id": string,"is_pto": boolean,"issue_id": string | null,"month_date": string,"person_id": string,"plan_kind": string,"planned_hours": number,"project_id": string | null,"role_id": string | null,"snapshot_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"is_pto"?: boolean,"issue_id"?: string | null,"month_date": string,"person_id": string,"plan_kind": string,"planned_hours"?: number,"project_id"?: string | null,"role_id"?: string | null,"snapshot_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"is_pto"?: boolean,"issue_id"?: string | null,"month_date"?: string,"person_id"?: string,"plan_kind"?: string,"planned_hours"?: number,"project_id"?: string | null,"role_id"?: string | null,"snapshot_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_plans_issue_id_fkey"
      columns: ["issue_id"]
isOneToOne: false
      referencedRelation: "dim_issue"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_plans_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_plans_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "dim_project"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_plans_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_plans_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "sync_snapshot"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_project_actuals": {
                  Row: {
                    "billable_hours": number,"created_at": string | null,"id": string,"logged_hours": number,"month_date": string,"project_id": string,"snapshot_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billable_hours"?: number,"created_at"?: string | null,"id"?: string,"logged_hours"?: number,"month_date": string,"project_id": string,"snapshot_id": string
                  }
                  Update: {
                    "billable_hours"?: number,"created_at"?: string | null,"id"?: string,"logged_hours"?: number,"month_date"?: string,"project_id"?: string,"snapshot_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_project_actuals_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "dim_project"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_project_actuals_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "sync_snapshot"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_pto_plan": {
                  Row: {
                    "created_at": string,"end_date": string,"hours_per_day": number,"id": string,"include_non_working_days": boolean,"person_id": string,"recurrence_end_date": string | null,"rule": string | null,"snapshot_id": string,"start_date": string,"tempo_plan_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_date": string,"hours_per_day": number,"id"?: string,"include_non_working_days"?: boolean,"person_id": string,"recurrence_end_date"?: string | null,"rule"?: string | null,"snapshot_id": string,"start_date": string,"tempo_plan_id": number
                  }
                  Update: {
                    "created_at"?: string,"end_date"?: string,"hours_per_day"?: number,"id"?: string,"include_non_working_days"?: boolean,"person_id"?: string,"recurrence_end_date"?: string | null,"rule"?: string | null,"snapshot_id"?: string,"start_date"?: string,"tempo_plan_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_pto_plan_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_pto_plan_snapshot_id_fkey"
      columns: ["snapshot_id"]
isOneToOne: false
      referencedRelation: "sync_snapshot"
      referencedColumns: ["id"]
    }
                  ]
                },"fact_worklogs": {
                  Row: {
                    "billable_seconds": number,"first_seen_at": string,"id": string,"is_billable": boolean,"is_commercial": boolean,"is_pto": boolean,"log_date": string,"logged_seconds": number,"person_id": string,"project_id": string,"role_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billable_seconds"?: number,"first_seen_at"?: string,"id"?: string,"is_billable"?: boolean,"is_commercial"?: boolean,"is_pto"?: boolean,"log_date": string,"logged_seconds"?: number,"person_id": string,"project_id": string,"role_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "billable_seconds"?: number,"first_seen_at"?: string,"id"?: string,"is_billable"?: boolean,"is_commercial"?: boolean,"is_pto"?: boolean,"log_date"?: string,"logged_seconds"?: number,"person_id"?: string,"project_id"?: string,"role_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fact_worklogs_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "dim_person"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_worklogs_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "dim_project"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fact_worklogs_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "dim_role"
      referencedColumns: ["id"]
    }
                  ]
                },"sync_config": {
                  Row: {
                    "description": string | null,"key": string,"updated_at": string,"value": string
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"key": string,"updated_at"?: string,"value": string
                  }
                  Update: {
                    "description"?: string | null,"key"?: string,"updated_at"?: string,"value"?: string
                  }
                  Relationships: [
                    
                  ]
                },"sync_log": {
                  Row: {
                    "capacity_written": number | null,"completed_at": string | null,"duration_ms": number | null,"error_message": string | null,"fragmentation_written": number | null,"id": string,"plans_written": number | null,"project_actuals_written": number | null,"snapshot_date": string,"started_at": string | null,"status": string,"warnings": NonNullable<Json>,"worklogs_written": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "capacity_written"?: number | null,"completed_at"?: string | null,"duration_ms"?: number | null,"error_message"?: string | null,"fragmentation_written"?: number | null,"id"?: string,"plans_written"?: number | null,"project_actuals_written"?: number | null,"snapshot_date": string,"started_at"?: string | null,"status"?: string,"warnings"?: NonNullable<Json>,"worklogs_written"?: number | null
                  }
                  Update: {
                    "capacity_written"?: number | null,"completed_at"?: string | null,"duration_ms"?: number | null,"error_message"?: string | null,"fragmentation_written"?: number | null,"id"?: string,"plans_written"?: number | null,"project_actuals_written"?: number | null,"snapshot_date"?: string,"started_at"?: string | null,"status"?: string,"warnings"?: NonNullable<Json>,"worklogs_written"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"sync_snapshot": {
                  Row: {
                    "created_at": string | null,"id": string,"is_merged": boolean,"period_month": string,"sync_log_id": string | null,"taken_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"is_merged"?: boolean,"period_month": string,"sync_log_id"?: string | null,"taken_at"?: string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"is_merged"?: boolean,"period_month"?: string,"sync_log_id"?: string | null,"taken_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sync_snapshot_sync_log_id_fkey"
      columns: ["sync_log_id"]
isOneToOne: false
      referencedRelation: "sync_log"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_dashboard_month_options": {
                  Row: {
                    "month_date": string | null,"snapshot_id": string | null,"sync_created_at": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_project_delivery_totals": {
                  Row: {
                    "lifetime_billable_hours": number | null,"lifetime_logged_hours": number | null,"project_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "fact_worklogs_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "dim_project"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "resolve_capacity_snapshot_for_month":
{ Args: { "p_month": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
