import { NextResponse } from "next/server"

export type Role = "loggedInUser" | "targetUser" | "superAdmin" | "projectAdmin"

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
        path: "/api/me",
        methods: {
            GET: {
                requiresAuth: true,
                allowedAccess: ["loggedInUser"],
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
