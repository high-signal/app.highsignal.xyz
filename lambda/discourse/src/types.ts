export interface DiscourseUserActivity {
    user_actions: DiscourseUserAction[]
}

export interface DiscourseUserAction {
    action_type: number
    action_code: number
    created_at: string
    updated_at: string
    post_id: number
    post_number: number
    topic_id?: number
    raw: string | null
    cooked?: string
}
