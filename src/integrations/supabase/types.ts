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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          auto_close_at_cutoff: boolean
          default_cutoff: string
          default_delivery_window: string
          default_employee_cap: number
          default_max_order: number
          default_min_order: number
          default_rate: number
          email_on_publish: boolean
          id: boolean
          sms_before_cutoff: boolean
          terms: string
          updated_at: string
        }
        Insert: {
          auto_close_at_cutoff?: boolean
          default_cutoff?: string
          default_delivery_window?: string
          default_employee_cap?: number
          default_max_order?: number
          default_min_order?: number
          default_rate?: number
          email_on_publish?: boolean
          id?: boolean
          sms_before_cutoff?: boolean
          terms?: string
          updated_at?: string
        }
        Update: {
          auto_close_at_cutoff?: boolean
          default_cutoff?: string
          default_delivery_window?: string
          default_employee_cap?: number
          default_max_order?: number
          default_min_order?: number
          default_rate?: number
          email_on_publish?: boolean
          id?: boolean
          sms_before_cutoff?: boolean
          terms?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_name: string
          actor_role: string
          actor_user_id: string | null
          id: string
          new_value: string
          old_value: string
          record: string
          timestamp: string
        }
        Insert: {
          action: string
          actor_name?: string
          actor_role?: string
          actor_user_id?: string | null
          id?: string
          new_value?: string
          old_value?: string
          record: string
          timestamp?: string
        }
        Update: {
          action?: string
          actor_name?: string
          actor_role?: string
          actor_user_id?: string | null
          id?: string
          new_value?: string
          old_value?: string
          record?: string
          timestamp?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_no: string
          booking_cutoff: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          delivery_date: string
          delivery_points: string[]
          delivery_window: string
          employee_cap: number
          max_order: number
          min_order: number
          note: string
          produced_litres: number
          product: string
          production_date: string
          published_at: string | null
          rate_per_litre: number
          saleable_litres: number
          status: Database["public"]["Enums"]["batch_status"]
        }
        Insert: {
          batch_no: string
          booking_cutoff: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivery_date: string
          delivery_points?: string[]
          delivery_window?: string
          employee_cap?: number
          max_order?: number
          min_order?: number
          note?: string
          produced_litres: number
          product?: string
          production_date: string
          published_at?: string | null
          rate_per_litre: number
          saleable_litres: number
          status?: Database["public"]["Enums"]["batch_status"]
        }
        Update: {
          batch_no?: string
          booking_cutoff?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivery_date?: string
          delivery_points?: string[]
          delivery_window?: string
          employee_cap?: number
          max_order?: number
          min_order?: number
          note?: string
          produced_litres?: number
          product?: string
          production_date?: string
          published_at?: string | null
          rate_per_litre?: number
          saleable_litres?: number
          status?: Database["public"]["Enums"]["batch_status"]
        }
        Relationships: []
      }
      collections: {
        Row: {
          amount_collected: number
          amount_due: number
          collector_name: string
          date: string | null
          method: Database["public"]["Enums"]["payment_method"] | null
          order_no: string
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_collected?: number
          amount_due: number
          collector_name?: string
          date?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          order_no: string
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_collected?: number
          amount_due?: number
          collector_name?: string
          date?: string | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          order_no?: string
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_order_no_fkey"
            columns: ["order_no"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["order_no"]
          },
        ]
      }
      delivery_points: {
        Row: {
          active: boolean
          address: string
          coordinator_name: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          address?: string
          coordinator_name?: string
          created_at?: string
          id: string
          name: string
        }
        Update: {
          active?: boolean
          address?: string
          coordinator_name?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      delivery_records: {
        Row: {
          contact: string
          coupon_no: string
          created_at: string
          date_time: string
          floor: string
          location: string
          order_no: string
          quantity: number
          receiver_name: string
          recipient_name: string
          remarks: string
        }
        Insert: {
          contact?: string
          coupon_no: string
          created_at?: string
          date_time?: string
          floor?: string
          location?: string
          order_no: string
          quantity: number
          receiver_name?: string
          recipient_name: string
          remarks?: string
        }
        Update: {
          contact?: string
          coupon_no?: string
          created_at?: string
          date_time?: string
          floor?: string
          location?: string
          order_no?: string
          quantity?: number
          receiver_name?: string
          recipient_name?: string
          remarks?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_records_order_no_fkey"
            columns: ["order_no"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["order_no"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          company_email: string
          created_at: string
          department: Database["public"]["Enums"]["department"]
          id: string
          name: string
          phone: string
          site: Database["public"]["Enums"]["site"]
          user_id: string | null
        }
        Insert: {
          active?: boolean
          company_email: string
          created_at?: string
          department: Database["public"]["Enums"]["department"]
          id: string
          name: string
          phone?: string
          site: Database["public"]["Enums"]["site"]
          user_id?: string | null
        }
        Update: {
          active?: boolean
          company_email?: string
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          id?: string
          name?: string
          phone?: string
          site?: Database["public"]["Enums"]["site"]
          user_id?: string | null
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string
          employee_id: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          timestamp: string
          title: string
        }
        Insert: {
          audience?: string
          body?: string
          employee_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          timestamp?: string
          title: string
        }
        Update: {
          audience?: string
          body?: string
          employee_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          timestamp?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number | null
          batch_no: string
          created_at: string
          delivery_point_id: string
          employee_id: string
          litres: number
          order_no: string
          rate: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          amount?: number | null
          batch_no: string
          created_at?: string
          delivery_point_id: string
          employee_id: string
          litres: number
          order_no: string
          rate: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          amount?: number | null
          batch_no?: string
          created_at?: string
          delivery_point_id?: string
          employee_id?: string
          litres?: number
          order_no?: string
          rate?: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_batch_no_fkey"
            columns: ["batch_no"]
            isOneToOne: false
            referencedRelation: "batch_stats"
            referencedColumns: ["batch_no"]
          },
          {
            foreignKeyName: "orders_batch_no_fkey"
            columns: ["batch_no"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_no"]
          },
          {
            foreignKeyName: "orders_delivery_point_id_fkey"
            columns: ["delivery_point_id"]
            isOneToOne: false
            referencedRelation: "delivery_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      batch_stats: {
        Row: {
          batch_no: string | null
          booked_litres: number | null
          cancelled_orders: number | null
          delivered_litres: number | null
          gross_value: number | null
          not_collected_litres: number | null
          ordering_employees: number | null
          produced_litres: number | null
          production_date: string | null
          rate_per_litre: number | null
          remaining_litres: number | null
          saleable_litres: number | null
          sell_through_pct: number | null
          status: Database["public"]["Enums"]["batch_status"] | null
          unsold_litres: number | null
        }
        Relationships: []
      }
      collection_summary: {
        Row: {
          batch_no: string | null
          outstanding: number | null
          total_collected: number | null
          total_due: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_batch_no_fkey"
            columns: ["batch_no"]
            isOneToOne: false
            referencedRelation: "batch_stats"
            referencedColumns: ["batch_no"]
          },
          {
            foreignKeyName: "orders_batch_no_fkey"
            columns: ["batch_no"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["batch_no"]
          },
        ]
      }
    }
    Functions: {
      actor_label: { Args: never; Returns: string }
      actor_role_label: { Args: never; Returns: string }
      adjust_order: {
        Args: { p_litres: number; p_order_no: string; p_reason: string }
        Returns: {
          amount: number | null
          batch_no: string
          created_at: string
          delivery_point_id: string
          employee_id: string
          litres: number
          order_no: string
          rate: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_order: {
        Args: { p_order_no: string; p_reason: string }
        Returns: {
          amount: number | null
          batch_no: string
          created_at: string
          delivery_point_id: string
          employee_id: string
          litres: number
          order_no: string
          rate: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      close_expired_batches: { Args: never; Returns: number }
      confirm_order: {
        Args: {
          p_batch_no: string
          p_delivery_point_id: string
          p_litres: number
        }
        Returns: {
          amount: number | null
          batch_no: string
          created_at: string
          delivery_point_id: string
          employee_id: string
          litres: number
          order_no: string
          rate: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_batch: {
        Args: {
          p_booking_cutoff: string
          p_delivery_date: string
          p_delivery_points: string[]
          p_delivery_window: string
          p_employee_cap: number
          p_max_order: number
          p_min_order: number
          p_note: string
          p_produced: number
          p_production_date: string
          p_rate: number
          p_saleable: number
        }
        Returns: {
          batch_no: string
          booking_cutoff: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          delivery_date: string
          delivery_points: string[]
          delivery_window: string
          employee_cap: number
          max_order: number
          min_order: number
          note: string
          produced_litres: number
          product: string
          production_date: string
          published_at: string | null
          rate_per_litre: number
          saleable_litres: number
          status: Database["public"]["Enums"]["batch_status"]
        }
        SetofOptions: {
          from: "*"
          to: "batches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      mark_notifications_read: { Args: never; Returns: undefined }
      my_employee_id: { Args: never; Returns: string }
      my_roles: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      next_batch_no: { Args: never; Returns: string }
      next_coupon_no: { Args: never; Returns: string }
      next_employee_code: { Args: never; Returns: string }
      next_order_no: { Args: never; Returns: string }
      record_collection: {
        Args: {
          p_amount_collected: number
          p_method: Database["public"]["Enums"]["payment_method"]
          p_order_no: string
          p_reference: string
        }
        Returns: {
          amount_collected: number
          amount_due: number
          collector_name: string
          date: string | null
          method: Database["public"]["Enums"]["payment_method"] | null
          order_no: string
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "collections"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remaining_litres: { Args: { _batch_no: string }; Returns: number }
      set_batch_status: {
        Args: {
          p_batch_no: string
          p_status: Database["public"]["Enums"]["batch_status"]
        }
        Returns: {
          batch_no: string
          booking_cutoff: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          delivery_date: string
          delivery_points: string[]
          delivery_window: string
          employee_cap: number
          max_order: number
          min_order: number
          note: string
          produced_litres: number
          product: string
          production_date: string
          published_at: string | null
          rate_per_litre: number
          saleable_litres: number
          status: Database["public"]["Enums"]["batch_status"]
        }
        SetofOptions: {
          from: "*"
          to: "batches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_order_status: {
        Args: {
          p_order_no: string
          p_receiver_name?: string
          p_remarks?: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: {
          amount: number | null
          batch_no: string
          created_at: string
          delivery_point_id: string
          employee_id: string
          litres: number
          order_no: string
          rate: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      write_audit: {
        Args: { _action: string; _new: string; _old: string; _record: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "Employee"
        | "Factory Operator"
        | "Head Office Coordinator"
        | "Finance"
        | "System Admin"
      batch_status: "Draft" | "Active" | "Paused" | "SoldOut" | "Closed"
      department:
        | "Production"
        | "Finance"
        | "HR"
        | "Sales"
        | "IT"
        | "Admin"
        | "Procurement"
      notification_kind:
        | "BatchPublished"
        | "CutoffReminder"
        | "OrderConfirmed"
        | "OrderCancelled"
        | "OutForDelivery"
        | "PaymentDue"
      order_status:
        | "Confirmed"
        | "Packed"
        | "OutForDelivery"
        | "Delivered"
        | "Cancelled"
        | "NotCollected"
      payment_method: "Cash" | "bKash" | "Payroll deduction"
      payment_status: "Paid" | "Unpaid" | "Partial"
      site: "Head Office – Gulshan" | "Savar Factory"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "Employee",
        "Factory Operator",
        "Head Office Coordinator",
        "Finance",
        "System Admin",
      ],
      batch_status: ["Draft", "Active", "Paused", "SoldOut", "Closed"],
      department: [
        "Production",
        "Finance",
        "HR",
        "Sales",
        "IT",
        "Admin",
        "Procurement",
      ],
      notification_kind: [
        "BatchPublished",
        "CutoffReminder",
        "OrderConfirmed",
        "OrderCancelled",
        "OutForDelivery",
        "PaymentDue",
      ],
      order_status: [
        "Confirmed",
        "Packed",
        "OutForDelivery",
        "Delivered",
        "Cancelled",
        "NotCollected",
      ],
      payment_method: ["Cash", "bKash", "Payroll deduction"],
      payment_status: ["Paid", "Unpaid", "Partial"],
      site: ["Head Office – Gulshan", "Savar Factory"],
    },
  },
} as const
