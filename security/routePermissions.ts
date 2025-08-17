export type Role = "loggedInUser" | "targetUser" | "projectAdmin" | "superAdmin"

export type MethodPermission = {
    requiresAuth: boolean
    allowedAccess?: Role[]
}

export type RoutePermission = {
    path: string
    methods: {
        [key: string]: MethodPermission
    }
}

export const routePermissions: RoutePermission[] = [
    {
        path: "/api/data/",
        methods: {
            GET: {
                requiresAuth: false,
            },
        },
    },
    {
        path: "/api/info",
        methods: {
            // Public read access to project info (Vercel region, etc.)
            GET: {
                requiresAuth: false,
            },
        },
    },
    {
        path: "/api/manifest.json",
        methods: {
            // Public read access to PWA manifest
            GET: {
                requiresAuth: false,
            },
        },
    },
    {
        path: "/api/me",
        methods: {
            GET: {
                requiresAuth: true,
                allowedAccess: ["loggedInUser"],
            },
        },
    },
    {
        path: "/api/private-data/users",
        methods: {
            GET: {
                requiresAuth: true,
                allowedAccess: ["targetUser", "projectAdmin", "superAdmin"],
            },
        },
    },
    {
        path: "/api/projects",
        methods: {
            // Public read access to project config data
            GET: {
                requiresAuth: false,
            },
        },
    },
    {
        path: "/api/settings/u",
        methods: {
            GET: {
                requiresAuth: true,
                allowedAccess: ["targetUser", "superAdmin"],
            },
            POST: {
                requiresAuth: true,
                allowedAccess: ["targetUser", "superAdmin"],
            },
            PATCH: {
                requiresAuth: true,
                allowedAccess: ["targetUser", "superAdmin"],
            },
            PUT: {
                requiresAuth: true,
                allowedAccess: ["targetUser", "superAdmin"],
            },
            DELETE: {
                requiresAuth: true,
                allowedAccess: ["targetUser", "superAdmin"],
            },
        },
    },
    {
        path: "/api/settings/p",
        methods: {
            GET: {
                requiresAuth: true,
                allowedAccess: ["projectAdmin", "superAdmin"],
            },
            POST: {
                requiresAuth: true,
                allowedAccess: ["projectAdmin", "superAdmin"],
            },
            PATCH: {
                requiresAuth: true,
                allowedAccess: ["projectAdmin", "superAdmin"],
            },
            DELETE: {
                requiresAuth: true,
                allowedAccess: ["projectAdmin", "superAdmin"],
            },
        },
    },
    {
        path: "/api/superadmin",
        methods: {
            GET: {
                requiresAuth: true,
                allowedAccess: ["superAdmin"],
            },
            POST: {
                requiresAuth: true,
                allowedAccess: ["superAdmin"],
            },
            PATCH: {
                requiresAuth: true,
                allowedAccess: ["superAdmin"],
            },
        },
    },
    {
        path: "/api/settings/superadmin",
        methods: {
            GET: {
                requiresAuth: true,
                allowedAccess: ["superAdmin"],
            },
            POST: {
                requiresAuth: true,
                allowedAccess: ["superAdmin"],
            },
            PATCH: {
                requiresAuth: true,
                allowedAccess: ["superAdmin"],
            },
            DELETE: {
                requiresAuth: true,
                allowedAccess: ["superAdmin"],
            },
        },
    },
    {
        path: "/api/users",
        methods: {
            // Public read access to user data
            GET: {
                requiresAuth: false,
            },
            // User creation
            POST: {
                requiresAuth: true,
                allowedAccess: ["loggedInUser"],
            },
            // User data edits
            PATCH: {
                requiresAuth: true,
                allowedAccess: ["targetUser", "superAdmin"],
            },
        },
    },
]

// Helper function to get permissions for a specific path and method
export function getRoutePermissions(path: string, method: string): MethodPermission | undefined {
    const route = routePermissions.find((permission) => path.startsWith(permission.path))
    if (!route) return undefined

    return route.methods[method]
}
