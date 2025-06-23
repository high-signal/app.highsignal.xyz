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
        "https://res.cloudinary.com/duenpn7gd/image/upload/w_300,h_300,c_fill,q_auto,f_webp/v1750341763/profile-images/1/z4lgr9kyd3qn2mpp5ifj",
    DEFAULT_PROFILE_IMAGE:
        "https://res.cloudinary.com/duenpn7gd/image/upload/w_300,h_300,c_fill,q_auto,f_webp/v1750341763/profile-images/1/z4lgr9kyd3qn2mpp5ifj",
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

// External links
export const EXTERNAL_LINKS = {
    website: {
        url: "https://highsignal.xyz",
        label: "High Signal",
        icon: "faGlobe",
    },
    X: {
        url: "https://x.com/highsignalxyz",
        label: "High Signal X",
        icon: "faXTwitter",
    },
} as const
