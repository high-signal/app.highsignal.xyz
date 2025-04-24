/**
 * Application-wide constants and configuration values
 */

// Default images and assets
export const ASSETS = {
    DEFAULT_PROJECT_IMAGE:
        "https://res.cloudinary.com/duenpn7gd/image/upload/v1745265905/profile-images/1/z4lgr9kyd3qn2mpp5ifj.webp",
    DEFAULT_PROFILE_IMAGE:
        "https://res.cloudinary.com/duenpn7gd/image/upload/v1745265905/profile-images/1/z4lgr9kyd3qn2mpp5ifj.webp",
    LOGO: "https://res.cloudinary.com/duenpn7gd/image/upload/v1745266235/profile-images/1/w2ipu0xw9ao0ybhg1aio.webp",
} as const

// TODO: Application settings
export const APP_CONFIG = {
    DEFAULT_PAGINATION_LIMIT: 10,
    SIGNAL_STRENGTH_LOADING_DURATION: 30000,
} as const

//Social media links
export const SOCIAL_LINKS = {
    X: {
        url: "https://x.com/highsignalxyz",
        label: "High Signal X",
        icon: "faXTwitter",
    },
} as const
