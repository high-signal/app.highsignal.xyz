import { NextResponse } from "next/server"

export type MethodPermission = {
    requiresAuth: boolean
    requiresProjectAdmin?: boolean
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
            GET: { requiresAuth: true },
        },
    },
    {
        path: "/projects",
        methods: {
            GET: { requiresAuth: false }, // Public read access
            POST: { requiresAuth: true, requiresProjectAdmin: true }, // Only project admins can create
        },
    },
    {
        path: "/projects/:projectId",
        methods: {
            GET: { requiresAuth: false }, // Public read access
            PUT: { requiresAuth: true, requiresProjectAdmin: true },
            PATCH: { requiresAuth: true, requiresProjectAdmin: true },
            DELETE: { requiresAuth: true, requiresProjectAdmin: true },
        },
    },
]

// Helper function to get permissions for a specific path and method
export function getRoutePermissions(path: string, method: string): MethodPermission | undefined {
    const route = routePermissions.find((permission) => path.startsWith(permission.path))
    if (!route) return undefined

    return route.methods[method]
}
