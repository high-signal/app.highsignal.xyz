/**
 * Application-wide constants and configuration values
 */

// Global colors
export const COLORS = {
    PAGE_BACKGROUND_DARK: "#001B36",
} as const

// Default images and assets
export const ASSETS = {
    DEFAULT_PROJECT_IMAGE:
        "https://res.cloudinary.com/duenpn7gd/image/upload/v1745265905/profile-images/1/z4lgr9kyd3qn2mpp5ifj.webp",
    DEFAULT_PROFILE_IMAGE:
        "https://res.cloudinary.com/duenpn7gd/image/upload/v1745265905/profile-images/1/z4lgr9kyd3qn2mpp5ifj.webp",
    LOGO_BASE_URL: "https://res.cloudinary.com/duenpn7gd/image/upload",
    LOGO_ID: "logo-coin_jvr3ni.png",
} as const

// TODO: Application settings
export const APP_CONFIG = {
    DEFAULT_PAGINATION_LIMIT: 100,
    SIGNAL_STRENGTH_LOADING_DURATION: 30000,
    IMAGE_UPLOAD_WIDTH: 300,
    TEST_TIMER_MAX_DURATION: 30000,
} as const

//Social media links
export const SOCIAL_LINKS = {
    X: {
        url: "https://x.com/highsignalxyz",
        label: "High Signal X",
        icon: "faXTwitter",
    },
} as const
