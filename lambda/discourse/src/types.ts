export interface DiscourseUserActivity {
    user_actions: DiscourseUserAction[]
}

export interface DiscourseUserAction {
    action_type: number
    created_at: string
    // Other potential fields: post_number, topic_id, etc.
}
