export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      capacity_baseline: {
        Row: {
          created_at: string | null
          holidays: number
          id: string
          month: string
          net_capacity_hours: number
          net_working_days: number
          person: string
          pto_days: number
          pto_hours: number
          role: string
          source: string
          total_working_days: number
          zone: string
        }
        Insert: {
          created_at?: string | null
          holidays?: number
          id?: string
          month: string
          net_capacity_hours: number
          net_working_days: number
          person: string
          pto_days?: number
          pto_hours?: number
          role: string
          source: string
          total_working_days: number
          zone: string
        }
        Update: {
          created_at?: string | null
          holidays?: number
          id?: string
          month?: string
          net_capacity_hours?: number
          net_working_days?: number
          person?: string
          pto_days?: number
          pto_hours?: number
          role?: string
          source?: string
          total_working_days?: number
          zone?: string
        }
        Relationships: []
      }
      dim_holiday: {
        Row: {
          date: string
          id: string
          name: string
          zone_id: string
        }
        Insert: {
          date: string
          id?: string
          name: string
          zone_id: string
        }
        Update: {
          date?: string
          id?: string
          name?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dim_holiday_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "dim_zone"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_person: {
        Row: {
          created_at: string | null
          deactivated_at: string | null
          hire_date: string | null
          id: string
          is_active: boolean
          jira_account_id: string | null
          name: string
          role_id: string | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          deactivated_at?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          jira_account_id?: string | null
          name: string
          role_id?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          deactivated_at?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          jira_account_id?: string | null
          name?: string
          role_id?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_person_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "dim_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dim_person_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "dim_zone"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_person_month_role: {
        Row: {
          created_at: string
          month_date: string
          person_id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          month_date: string
          person_id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          month_date?: string
          person_id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dim_person_month_role_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dim_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dim_person_month_role_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "dim_role"
            referencedColumns: ["id"]
          },
        ]
      }
      dim_project: {
        Row: {
          budget_hours: number | null
          created_at: string | null
          end_date: string | null
          id: string
          is_commercial: boolean
          project_key: string
          project_name: string | null
          project_type: string
          projected_hours_at_completion: number | null
          size_bucket: string | null
          start_date: string | null
          status: string
          target_release_date: string | null
          tech_stack: string[] | null
          updated_at: string | null
        }
        Insert: {
          budget_hours?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_commercial?: boolean
          project_key: string
          project_name?: string | null
          project_type?: string
          projected_hours_at_completion?: number | null
          size_bucket?: string | null
          start_date?: string | null
          status?: string
          target_release_date?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
        }
        Update: {
          budget_hours?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_commercial?: boolean
          project_key?: string
          project_name?: string | null
          project_type?: string
          projected_hours_at_completion?: number | null
          size_bucket?: string | null
          start_date?: string | null
          status?: string
          target_release_date?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dim_project_repo: {
        Row: {
          bb_repo_slug: string
          bb_workspace: string
          created_at: string | null
          id: string
          is_active: boolean
          project_id: string
        }
        Insert: {
          bb_repo_slug: string
          bb_workspace: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          project_id: string
        }
        Update: {
          bb_repo_slug?: string
          bb_workspace?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dim_project_repo_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dim_project_repo_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
        ]
      }
      dim_role: {
        Row: {
          created_at: string | null
          id: string
          key: string
          label: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          label: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      dim_sprint: {
        Row: {
          complete_date: string | null
          created_at: string | null
          end_date: string | null
          id: string
          jira_sprint_id: number
          project_id: string
          sprint_name: string
          start_date: string | null
          state: string
          updated_at: string | null
        }
        Insert: {
          complete_date?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          jira_sprint_id: number
          project_id: string
          sprint_name: string
          start_date?: string | null
          state?: string
          updated_at?: string | null
        }
        Update: {
          complete_date?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          jira_sprint_id?: number
          project_id?: string
          sprint_name?: string
          start_date?: string | null
          state?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dim_sprint_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dim_sprint_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
        ]
      }
      dim_zone: {
        Row: {
          created_at: string | null
          id: string
          key: string
          label: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          label: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      fact_bench: {
        Row: {
          availability_hours: number | null
          availability_pct: number | null
          created_at: string | null
          id: string
          is_bench: boolean
          month_date: string
          net_capacity_hours: number
          person_id: string
          planned_hours: number
          role_id: string | null
          snapshot_id: string
        }
        Insert: {
          availability_hours?: number | null
          availability_pct?: number | null
          created_at?: string | null
          id?: string
          is_bench?: boolean
          month_date: string
          net_capacity_hours: number
          person_id: string
          planned_hours?: number
          role_id?: string | null
          snapshot_id: string
        }
        Update: {
          availability_hours?: number | null
          availability_pct?: number | null
          created_at?: string | null
          id?: string
          is_bench?: boolean
          month_date?: string
          net_capacity_hours?: number
          person_id?: string
          planned_hours?: number
          role_id?: string | null
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_bench_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dim_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_bench_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "dim_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_bench_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "sync_snapshot"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_capacity: {
        Row: {
          created_at: string | null
          holidays: number
          id: string
          month_date: string
          net_capacity_hours: number
          net_working_days: number
          person_id: string
          pto_days: number
          pto_hours: number
          role_id: string | null
          snapshot_id: string
          total_working_days: number
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          holidays?: number
          id?: string
          month_date: string
          net_capacity_hours: number
          net_working_days: number
          person_id: string
          pto_days?: number
          pto_hours?: number
          role_id?: string | null
          snapshot_id: string
          total_working_days: number
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          holidays?: number
          id?: string
          month_date?: string
          net_capacity_hours?: number
          net_working_days?: number
          person_id?: string
          pto_days?: number
          pto_hours?: number
          role_id?: string | null
          snapshot_id?: string
          total_working_days?: number
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_capacity_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dim_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_capacity_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "dim_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_capacity_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "sync_snapshot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_capacity_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "dim_zone"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_fragmentation: {
        Row: {
          build_count: number
          build_projects: string[]
          created_at: string | null
          flag_reason: string | null
          flagged: boolean
          id: string
          month_date: string
          person_id: string
          role_id: string | null
          snapshot_id: string
          source: string
          support_count: number
          support_projects: string[]
          total_count: number
        }
        Insert: {
          build_count?: number
          build_projects?: string[]
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          month_date: string
          person_id: string
          role_id?: string | null
          snapshot_id: string
          source: string
          support_count?: number
          support_projects?: string[]
          total_count?: number
        }
        Update: {
          build_count?: number
          build_projects?: string[]
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          month_date?: string
          person_id?: string
          role_id?: string | null
          snapshot_id?: string
          source?: string
          support_count?: number
          support_projects?: string[]
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_fragmentation_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dim_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_fragmentation_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "dim_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_fragmentation_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "sync_snapshot"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_issue_loe: {
        Row: {
          estimated_hours: number | null
          first_seen_at: string
          id: string
          issue_key: string
          issue_summary: string | null
          issue_type: string
          loe_accuracy: number | null
          logged_hours: number | null
          project_id: string
          resolved_at: string | null
          sprint_id: string | null
          status: string | null
          updated_at: string
          variance_hours: number | null
        }
        Insert: {
          estimated_hours?: number | null
          first_seen_at?: string
          id?: string
          issue_key: string
          issue_summary?: string | null
          issue_type: string
          loe_accuracy?: number | null
          logged_hours?: number | null
          project_id: string
          resolved_at?: string | null
          sprint_id?: string | null
          status?: string | null
          updated_at?: string
          variance_hours?: number | null
        }
        Update: {
          estimated_hours?: number | null
          first_seen_at?: string
          id?: string
          issue_key?: string
          issue_summary?: string | null
          issue_type?: string
          loe_accuracy?: number | null
          logged_hours?: number | null
          project_id?: string
          resolved_at?: string | null
          sprint_id?: string | null
          status?: string | null
          updated_at?: string
          variance_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fact_issue_loe_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_issue_loe_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fact_issue_loe_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "dim_sprint"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_plans: {
        Row: {
          created_at: string | null
          id: string
          is_pto: boolean
          month_date: string
          person_id: string
          planned_hours: number
          project_id: string | null
          role_id: string | null
          snapshot_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_pto?: boolean
          month_date: string
          person_id: string
          planned_hours?: number
          project_id?: string | null
          role_id?: string | null
          snapshot_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_pto?: boolean
          month_date?: string
          person_id?: string
          planned_hours?: number
          project_id?: string | null
          role_id?: string | null
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_plans_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dim_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fact_plans_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "dim_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_plans_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "sync_snapshot"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_project_account_mix: {
        Row: {
          account_category: string
          created_at: string | null
          id: string
          logged_hours: number
          month_date: string
          project_id: string
          snapshot_id: string
        }
        Insert: {
          account_category: string
          created_at?: string | null
          id?: string
          logged_hours?: number
          month_date: string
          project_id: string
          snapshot_id: string
        }
        Update: {
          account_category?: string
          created_at?: string | null
          id?: string
          logged_hours?: number
          month_date?: string
          project_id?: string
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_project_account_mix_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_project_account_mix_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fact_project_account_mix_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "sync_snapshot"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_project_actuals: {
        Row: {
          billable_hours: number
          created_at: string | null
          id: string
          logged_hours: number
          month_date: string
          project_id: string
          snapshot_id: string
        }
        Insert: {
          billable_hours?: number
          created_at?: string | null
          id?: string
          logged_hours?: number
          month_date: string
          project_id: string
          snapshot_id: string
        }
        Update: {
          billable_hours?: number
          created_at?: string | null
          id?: string
          logged_hours?: number
          month_date?: string
          project_id?: string
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_project_actuals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_project_actuals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fact_project_actuals_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "sync_snapshot"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_project_monthly_kpis: {
        Row: {
          avg_sprint_completion_rate: number | null
          bug_aging_days: number | null
          bug_ratio: number | null
          burn_rate_hours: number | null
          cr_aging_days: number | null
          cr_ratio: number | null
          created_at: string | null
          cumulative_logged_hours: number | null
          current_sprint_id: string | null
          id: string
          month_date: string
          months_active: number | null
          open_blockers: number
          pending_prs: number
          project_id: string
          qa_bug_count: number
          qa_bug_hours: number
          snapshot_id: string
          story_aging_days: number | null
          top1_contributor_pct: number | null
          top3_contributor_hours: number[]
          top3_contributor_names: string[]
          top3_contributor_pct: number | null
          total_sprint_count: number | null
          uat_bug_count: number
          uat_bug_hours: number
        }
        Insert: {
          avg_sprint_completion_rate?: number | null
          bug_aging_days?: number | null
          bug_ratio?: number | null
          burn_rate_hours?: number | null
          cr_aging_days?: number | null
          cr_ratio?: number | null
          created_at?: string | null
          cumulative_logged_hours?: number | null
          current_sprint_id?: string | null
          id?: string
          month_date: string
          months_active?: number | null
          open_blockers?: number
          pending_prs?: number
          project_id: string
          qa_bug_count?: number
          qa_bug_hours?: number
          snapshot_id: string
          story_aging_days?: number | null
          top1_contributor_pct?: number | null
          top3_contributor_hours?: number[]
          top3_contributor_names?: string[]
          top3_contributor_pct?: number | null
          total_sprint_count?: number | null
          uat_bug_count?: number
          uat_bug_hours?: number
        }
        Update: {
          avg_sprint_completion_rate?: number | null
          bug_aging_days?: number | null
          bug_ratio?: number | null
          burn_rate_hours?: number | null
          cr_aging_days?: number | null
          cr_ratio?: number | null
          created_at?: string | null
          cumulative_logged_hours?: number | null
          current_sprint_id?: string | null
          id?: string
          month_date?: string
          months_active?: number | null
          open_blockers?: number
          pending_prs?: number
          project_id?: string
          qa_bug_count?: number
          qa_bug_hours?: number
          snapshot_id?: string
          story_aging_days?: number | null
          top1_contributor_pct?: number | null
          top3_contributor_hours?: number[]
          top3_contributor_names?: string[]
          top3_contributor_pct?: number | null
          total_sprint_count?: number | null
          uat_bug_count?: number
          uat_bug_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_project_monthly_kpis_current_sprint_id_fkey"
            columns: ["current_sprint_id"]
            isOneToOne: false
            referencedRelation: "dim_sprint"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_project_monthly_kpis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_project_monthly_kpis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fact_project_monthly_kpis_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "sync_snapshot"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_sprint_metrics: {
        Row: {
          closed_hours: number
          committed_hours: number
          created_at: string | null
          id: string
          month_date: string
          project_id: string
          qa_bugs_created: number
          snapshot_id: string
          sprint_id: string
          uat_bugs_created: number
        }
        Insert: {
          closed_hours?: number
          committed_hours?: number
          created_at?: string | null
          id?: string
          month_date: string
          project_id: string
          qa_bugs_created?: number
          snapshot_id: string
          sprint_id: string
          uat_bugs_created?: number
        }
        Update: {
          closed_hours?: number
          committed_hours?: number
          created_at?: string | null
          id?: string
          month_date?: string
          project_id?: string
          qa_bugs_created?: number
          snapshot_id?: string
          sprint_id?: string
          uat_bugs_created?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_sprint_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_sprint_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fact_sprint_metrics_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "sync_snapshot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_sprint_metrics_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "dim_sprint"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_worklogs: {
        Row: {
          account_category: string | null
          billable_seconds: number
          first_seen_at: string
          id: string
          is_billable: boolean
          is_commercial: boolean
          is_pto: boolean
          log_date: string
          logged_seconds: number
          person_id: string
          project_id: string
          role_id: string | null
          updated_at: string
        }
        Insert: {
          account_category?: string | null
          billable_seconds?: number
          first_seen_at?: string
          id?: string
          is_billable?: boolean
          is_commercial?: boolean
          is_pto?: boolean
          log_date: string
          logged_seconds?: number
          person_id: string
          project_id: string
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          account_category?: string | null
          billable_seconds?: number
          first_seen_at?: string
          id?: string
          is_billable?: boolean
          is_commercial?: boolean
          is_pto?: boolean
          log_date?: string
          logged_seconds?: number
          person_id?: string
          project_id?: string
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_worklogs_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "dim_person"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_worklogs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dim_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_worklogs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_delivery_totals"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "fact_worklogs_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "dim_role"
            referencedColumns: ["id"]
          },
        ]
      }
      fragmentation_snapshot: {
        Row: {
          build_count: number
          build_projects: string | null
          created_at: string | null
          flag_reason: string | null
          flagged: boolean
          id: string
          month: string
          person: string
          role: string
          snapshot_date: string
          source: string
          support_count: number
          support_projects: string | null
          total_count: number
        }
        Insert: {
          build_count?: number
          build_projects?: string | null
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          month: string
          person: string
          role: string
          snapshot_date: string
          source: string
          support_count?: number
          support_projects?: string | null
          total_count?: number
        }
        Update: {
          build_count?: number
          build_projects?: string | null
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          month?: string
          person?: string
          role?: string
          snapshot_date?: string
          source?: string
          support_count?: number
          support_projects?: string | null
          total_count?: number
        }
        Relationships: []
      }
      holiday_calendar: {
        Row: {
          date: string
          id: string
          name: string
          zone: string
        }
        Insert: {
          date: string
          id?: string
          name: string
          zone: string
        }
        Update: {
          date?: string
          id?: string
          name?: string
          zone?: string
        }
        Relationships: []
      }
      plans_snapshot: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          is_pto: boolean
          month: string
          person: string | null
          planned_hours: number
          project_key: string | null
          project_name: string | null
          project_type: string | null
          role: string | null
          snapshot_date: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          is_pto?: boolean
          month: string
          person?: string | null
          planned_hours?: number
          project_key?: string | null
          project_name?: string | null
          project_type?: string | null
          role?: string | null
          snapshot_date: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          is_pto?: boolean
          month?: string
          person?: string | null
          planned_hours?: number
          project_key?: string | null
          project_name?: string | null
          project_type?: string | null
          role?: string | null
          snapshot_date?: string
        }
        Relationships: []
      }
      project_actuals_snapshot: {
        Row: {
          billable_hours: number
          created_at: string | null
          id: string
          logged_hours: number
          month: string
          project_key: string
          project_name: string | null
          project_type: string
          snapshot_date: string
        }
        Insert: {
          billable_hours?: number
          created_at?: string | null
          id?: string
          logged_hours?: number
          month: string
          project_key: string
          project_name?: string | null
          project_type: string
          snapshot_date: string
        }
        Update: {
          billable_hours?: number
          created_at?: string | null
          id?: string
          logged_hours?: number
          month?: string
          project_key?: string
          project_name?: string | null
          project_type?: string
          snapshot_date?: string
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          capacity_written: number | null
          completed_at: string | null
          duration_ms: number | null
          error_message: string | null
          fragmentation_written: number | null
          id: string
          plans_written: number | null
          project_actuals_written: number | null
          snapshot_date: string
          started_at: string | null
          status: string
          worklogs_written: number | null
        }
        Insert: {
          capacity_written?: number | null
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          fragmentation_written?: number | null
          id?: string
          plans_written?: number | null
          project_actuals_written?: number | null
          snapshot_date: string
          started_at?: string | null
          status?: string
          worklogs_written?: number | null
        }
        Update: {
          capacity_written?: number | null
          completed_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          fragmentation_written?: number | null
          id?: string
          plans_written?: number | null
          project_actuals_written?: number | null
          snapshot_date?: string
          started_at?: string | null
          status?: string
          worklogs_written?: number | null
        }
        Relationships: []
      }
      sync_snapshot: {
        Row: {
          created_at: string | null
          id: string
          is_merged: boolean
          period_month: string
          sync_log_id: string | null
          taken_at: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_merged?: boolean
          period_month: string
          sync_log_id?: string | null
          taken_at?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_merged?: boolean
          period_month?: string
          sync_log_id?: string | null
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_snapshot_sync_log_id_fkey"
            columns: ["sync_log_id"]
            isOneToOne: false
            referencedRelation: "sync_log"
            referencedColumns: ["id"]
          },
        ]
      }
      team_zones: {
        Row: {
          id: string
          person: string
          zone: string
        }
        Insert: {
          id?: string
          person: string
          zone: string
        }
        Update: {
          id?: string
          person?: string
          zone?: string
        }
        Relationships: []
      }
      worklogs_snapshot: {
        Row: {
          account_id: string
          billable_seconds: number
          created_at: string | null
          id: string
          is_billable: boolean
          is_pto: boolean
          log_date: string
          logged_seconds: number
          person: string
          project_key: string
          project_type: string
          role: string | null
          snapshot_date: string
        }
        Insert: {
          account_id: string
          billable_seconds?: number
          created_at?: string | null
          id?: string
          is_billable?: boolean
          is_pto?: boolean
          log_date: string
          logged_seconds?: number
          person: string
          project_key: string
          project_type: string
          role?: string | null
          snapshot_date: string
        }
        Update: {
          account_id?: string
          billable_seconds?: number
          created_at?: string | null
          id?: string
          is_billable?: boolean
          is_pto?: boolean
          log_date?: string
          logged_seconds?: number
          person?: string
          project_key?: string
          project_type?: string
          role?: string | null
          snapshot_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_dashboard_month_options: {
        Row: {
          month_date: string | null
          snapshot_id: string | null
          sync_created_at: string | null
        }
        Relationships: []
      }
      v_project_delivery_totals: {
        Row: {
          budget_hours: number | null
          lifetime_billable_hours: number | null
          lifetime_logged_hours: number | null
          lifetime_planned_hours: number | null
          project_id: string | null
          project_key: string | null
          project_name: string | null
          project_type: string | null
          start_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
