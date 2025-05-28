"use client"

import { HStack, Text, VStack } from "@chakra-ui/react"

import SignalStrengthSettings from "./SignalStrengthSettings"
import SettingsTabbedContent from "../../ui/SettingsTabbedContent"
import ProjectPicker from "../../ui/ProjectPicker"
import UserPicker from "../../ui/UserPicker"
import { useEffect, useState } from "react"
import { useGetUsers } from "../../../hooks/useGetUsers"

export default function SignalStrengthSettingsContainer({
    signalStrengths,
}: {
    signalStrengths: SignalStrengthData[]
}) {
    const [project, setProject] = useState<ProjectData | null>(null)
    const [selectedUsername, setSelectedUsername] = useState<string>("")
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const [newUserSelectedTrigger, setNewUserSelectedTrigger] = useState(false)
    const [selectedUserRawData, setSelectedUserRawData] = useState<UserData | null>(null)

    // When a test user is selected, fetch the user data with superadmin fields
    // Get the standard user data
    const {
        users: testUser,
        loading: testUserLoading,
        error: testUserError,
    } = useGetUsers("lido", selectedUsername, false, selectedUsername.length > 0, true)

    useEffect(() => {
        if (selectedUsername && testUser.length > 0 && testUser[0].username === selectedUsername) {
            setSelectedUser(testUser[0])
        }
    }, [selectedUsername, testUser, newUserSelectedTrigger])

    // Get the raw user data
    const {
        users: rawUser,
        loading: rawUserLoading,
        error: rawUserError,
    } = useGetUsers("lido", selectedUsername, false, selectedUsername.length > 0, true, true)

    useEffect(() => {
        if (selectedUsername && rawUser.length > 0 && rawUser[0].username === selectedUsername) {
            setSelectedUserRawData(rawUser[0])
        }
    }, [selectedUsername, rawUser, newUserSelectedTrigger])

    return (
        <VStack gap={4} maxW={"100%"}>
            <VStack
                gap={4}
                maxW={"100%"}
                borderRadius={{ base: "0px", sm: "16px" }}
                bg={"contentBackground"}
                py={3}
                px={{ base: 2, sm: 5 }}
                w={"500px"}
                alignItems={"center"}
            >
                <HStack w={"100%"} flexWrap={"wrap"} gap={{ base: 2, sm: 3 }}>
                    <Text w={"80px"} fontWeight={"bold"} pl={{ base: 2, sm: 0 }}>
                        Project
                    </Text>
                    <ProjectPicker
                        onProjectSelect={(project) => {
                            setProject(project)
                        }}
                        onClear={() => {
                            setProject(null)
                            setSelectedUsername("")
                            setSelectedUser(null)
                        }}
                        isSuperAdminRequesting={true}
                    />
                </HStack>
                <HStack w={"100%"} flexWrap={"wrap"} gap={{ base: 2, sm: 3 }}>
                    <Text w={"80px"} fontWeight={"bold"} pl={{ base: 2, sm: 0 }}>
                        User
                    </Text>
                    <UserPicker
                        signalStrengths={signalStrengths}
                        onUserSelect={(user) => {
                            setNewUserSelectedTrigger(!newUserSelectedTrigger)
                            setSelectedUsername(user.username || "")
                            setSelectedUser(null)
                        }}
                        onClear={() => {
                            setSelectedUsername("")
                            setSelectedUser(null)
                        }}
                        disabled={!project}
                        isSuperAdminRequesting={true}
                    />
                </HStack>
            </VStack>
            <SettingsTabbedContent
                tabs={[
                    ...signalStrengths.map((signalStrength) => ({
                        value: signalStrength.name,
                        label: signalStrength.displayName.split(" ")[0],
                        disabled: signalStrength.status != "active",
                        content: (
                            <SignalStrengthSettings
                                signalStrength={signalStrength}
                                project={project}
                                selectedUser={selectedUser}
                                selectedUserRawData={selectedUserRawData}
                                newUserSelectedTrigger={newUserSelectedTrigger}
                            />
                        ),
                    })),
                ]}
            />
        </VStack>
    )
}
