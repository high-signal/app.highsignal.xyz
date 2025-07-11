export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    public: {
        Tables: {
            access_codes: {
                Row: {
                    code: string
                    id: number
                }
                Insert: {
                    code: string
                    id?: number
                }
                Update: {
                    code?: string
                    id?: number
                }
                Relationships: []
            }
            forum_users: {
                Row: {
                    auth_encrypted_payload: string | null
                    auth_post_code: string | null
                    auth_post_code_created: number | null
                    auth_post_id: string | null
                    created_at: string
                    forum_username: string | null
                    last_updated: string | null
                    project_id: number
                    user_id: number
                }
                Insert: {
                    auth_encrypted_payload?: string | null
                    auth_post_code?: string | null
                    auth_post_code_created?: number | null
                    auth_post_id?: string | null
                    created_at?: string
                    forum_username?: string | null
                    last_updated?: string | null
                    project_id: number
                    user_id: number
                }
                Update: {
                    auth_encrypted_payload?: string | null
                    auth_post_code?: string | null
                    auth_post_code_created?: number | null
                    auth_post_id?: string | null
                    created_at?: string
                    forum_username?: string | null
                    last_updated?: string | null
                    project_id?: number
                    user_id?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "forum_users_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "forum_users_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "user_project_scores"
                        referencedColumns: ["user_id"]
                    },
                    {
                        foreignKeyName: "forum_users_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            peak_signals: {
                Row: {
                    created_at: string
                    display_name: string
                    id: number
                    image_alt: string | null
                    image_src: string | null
                    name: string
                    project_id: number
                    value: number
                }
                Insert: {
                    created_at?: string
                    display_name: string
                    id?: number
                    image_alt?: string | null
                    image_src?: string | null
                    name: string
                    project_id: number
                    value: number
                }
                Update: {
                    created_at?: string
                    display_name?: string
                    id?: number
                    image_alt?: string | null
                    image_src?: string | null
                    name?: string
                    project_id?: number
                    value?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "peak_signals_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                ]
            }
            project_admins: {
                Row: {
                    created_at: string
                    project_id: number
                    user_id: number
                }
                Insert: {
                    created_at?: string
                    project_id: number
                    user_id?: number
                }
                Update: {
                    created_at?: string
                    project_id?: number
                    user_id?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "project_admins_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_admins_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "user_project_scores"
                        referencedColumns: ["user_id"]
                    },
                    {
                        foreignKeyName: "project_admins_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            project_signal_strengths: {
                Row: {
                    auth_parent_post_url: string | null
                    auth_types: string[] | null
                    created_at: string
                    enabled: boolean
                    max_value: number | null
                    previous_days: number
                    project_id: number
                    signal_strength_id: number
                    url: string | null
                }
                Insert: {
                    auth_parent_post_url?: string | null
                    auth_types?: string[] | null
                    created_at?: string
                    enabled?: boolean
                    max_value?: number | null
                    previous_days?: number
                    project_id: number
                    signal_strength_id?: number
                    url?: string | null
                }
                Update: {
                    auth_parent_post_url?: string | null
                    auth_types?: string[] | null
                    created_at?: string
                    enabled?: boolean
                    max_value?: number | null
                    previous_days?: number
                    project_id?: number
                    signal_strength_id?: number
                    url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "project_signal_strengths_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_signal_strengths_signal_strength_id_fkey"
                        columns: ["signal_strength_id"]
                        isOneToOne: false
                        referencedRelation: "signal_strengths"
                        referencedColumns: ["id"]
                    },
                ]
            }
            projects: {
                Row: {
                    created_at: string
                    display_name: string
                    id: number
                    peak_signals_enabled: boolean
                    peak_signals_max_value: number
                    project_logo_url: string | null
                    url_slug: string
                }
                Insert: {
                    created_at?: string
                    display_name: string
                    id?: number
                    peak_signals_enabled?: boolean
                    peak_signals_max_value?: number
                    project_logo_url?: string | null
                    url_slug: string
                }
                Update: {
                    created_at?: string
                    display_name?: string
                    id?: number
                    peak_signals_enabled?: boolean
                    peak_signals_max_value?: number
                    project_logo_url?: string | null
                    url_slug?: string
                }
                Relationships: []
            }
            prompts: {
                Row: {
                    created_at: string
                    id: number
                    prompt: string | null
                    signal_strength_id: number | null
                    type: string | null
                }
                Insert: {
                    created_at?: string
                    id?: number
                    prompt?: string | null
                    signal_strength_id?: number | null
                    type?: string | null
                }
                Update: {
                    created_at?: string
                    id?: number
                    prompt?: string | null
                    signal_strength_id?: number | null
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "prompts_signal_strength_id_fkey"
                        columns: ["signal_strength_id"]
                        isOneToOne: false
                        referencedRelation: "signal_strengths"
                        referencedColumns: ["id"]
                    },
                ]
            }
            signal_strengths: {
                Row: {
                    available_auth_types: string[] | null
                    display_name: string | null
                    id: number
                    max_chars: number | null
                    model: string | null
                    name: string
                    status: string
                    temperature: number | null
                }
                Insert: {
                    available_auth_types?: string[] | null
                    display_name?: string | null
                    id?: number
                    max_chars?: number | null
                    model?: string | null
                    name: string
                    status?: string
                    temperature?: number | null
                }
                Update: {
                    available_auth_types?: string[] | null
                    display_name?: string | null
                    id?: number
                    max_chars?: number | null
                    model?: string | null
                    name?: string
                    status?: string
                    temperature?: number | null
                }
                Relationships: []
            }
            user_peak_signals: {
                Row: {
                    created_at: string | null
                    peak_signal_id: number
                    user_id: number
                }
                Insert: {
                    created_at?: string | null
                    peak_signal_id: number
                    user_id: number
                }
                Update: {
                    created_at?: string | null
                    peak_signal_id?: number
                    user_id?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "user_peak_signals_peak_signal_id_fkey"
                        columns: ["peak_signal_id"]
                        isOneToOne: false
                        referencedRelation: "peak_signals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_peak_signals_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "user_project_scores"
                        referencedColumns: ["user_id"]
                    },
                    {
                        foreignKeyName: "user_peak_signals_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_signal_strengths: {
                Row: {
                    completion_tokens: number | null
                    created: number
                    day: string | null
                    description: string | null
                    explained_reasoning: string | null
                    id: number
                    improvements: string | null
                    last_checked: number | null
                    logs: string | null
                    max_chars: number | null
                    max_value: number | null
                    model: string | null
                    project_id: number
                    prompt_id: number | null
                    prompt_tokens: number | null
                    raw_value: number | null
                    request_id: string | null
                    signal_strength_id: number
                    summary: string | null
                    temperature: number | null
                    test_requesting_user: number | null
                    user_id: number
                    value: number | null
                }
                Insert: {
                    completion_tokens?: number | null
                    created: number
                    day?: string | null
                    description?: string | null
                    explained_reasoning?: string | null
                    id?: never
                    improvements?: string | null
                    last_checked?: number | null
                    logs?: string | null
                    max_chars?: number | null
                    max_value?: number | null
                    model?: string | null
                    project_id: number
                    prompt_id?: number | null
                    prompt_tokens?: number | null
                    raw_value?: number | null
                    request_id?: string | null
                    signal_strength_id: number
                    summary?: string | null
                    temperature?: number | null
                    test_requesting_user?: number | null
                    user_id?: number
                    value?: number | null
                }
                Update: {
                    completion_tokens?: number | null
                    created?: number
                    day?: string | null
                    description?: string | null
                    explained_reasoning?: string | null
                    id?: never
                    improvements?: string | null
                    last_checked?: number | null
                    logs?: string | null
                    max_chars?: number | null
                    max_value?: number | null
                    model?: string | null
                    project_id?: number
                    prompt_id?: number | null
                    prompt_tokens?: number | null
                    raw_value?: number | null
                    request_id?: string | null
                    signal_strength_id?: number
                    summary?: string | null
                    temperature?: number | null
                    test_requesting_user?: number | null
                    user_id?: number
                    value?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_signal_strengths_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_signal_strengths_prompt_id_fkey"
                        columns: ["prompt_id"]
                        isOneToOne: false
                        referencedRelation: "prompts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_signal_strengths_signal_strength_id_fkey"
                        columns: ["signal_strength_id"]
                        isOneToOne: false
                        referencedRelation: "signal_strengths"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_signal_strengths_test_requesting_user_fkey"
                        columns: ["test_requesting_user"]
                        isOneToOne: false
                        referencedRelation: "user_project_scores"
                        referencedColumns: ["user_id"]
                    },
                    {
                        foreignKeyName: "user_signal_strengths_test_requesting_user_fkey"
                        columns: ["test_requesting_user"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_signal_strengths_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "user_project_scores"
                        referencedColumns: ["user_id"]
                    },
                    {
                        foreignKeyName: "user_signal_strengths_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    created_at: string
                    default_profile: boolean
                    display_name: string
                    id: number
                    is_deleted: boolean
                    is_super_admin: boolean
                    privy_id: string | null
                    profile_image_url: string
                    signup_code: string
                    username: string
                }
                Insert: {
                    created_at?: string
                    default_profile?: boolean
                    display_name: string
                    id?: number
                    is_deleted?: boolean
                    is_super_admin?: boolean
                    privy_id?: string | null
                    profile_image_url?: string
                    signup_code: string
                    username: string
                }
                Update: {
                    created_at?: string
                    default_profile?: boolean
                    display_name?: string
                    id?: number
                    is_deleted?: boolean
                    is_super_admin?: boolean
                    privy_id?: string | null
                    profile_image_url?: string
                    signup_code?: string
                    username?: string
                }
                Relationships: []
            }
        }
        Views: {
            user_project_scores: {
                Row: {
                    display_name: string | null
                    project_id: number | null
                    rank: number | null
                    total_score: number | null
                    user_id: number | null
                    username: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "project_signal_strengths_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
        ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
              Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
          Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
        ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
      ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
      : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
        ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
      ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {},
    },
} as const
