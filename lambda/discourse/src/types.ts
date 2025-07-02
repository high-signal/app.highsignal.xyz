export interface DiscourseUserActivity {
    user_actions: DiscourseUserAction[]
}

export interface DiscourseUserAction {
    action_type: number
    created_at: string
    cooked?: string
    topic_id?: number
    post_number?: number
    post_id?: number
    // Other potential fields from the Discourse API
}
