"use client"

import React from "react"
import { useUser } from "../../contexts/UserContext"

const UserSettingsContainer: React.FC = () => {
    const { user } = useUser()

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">User Settings</h2>
            <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-700">
                    <span className="font-semibold">Username:</span> {user?.username || "Not logged in"}
                </p>
            </div>
        </div>
    )
}

export default UserSettingsContainer
