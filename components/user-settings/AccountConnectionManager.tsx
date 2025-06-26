"use client"

import { Text, Button, Spinner, Menu, Portal, HStack, Box, Image, Skeleton } from "@chakra-ui/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { FontAwesomeIconProps } from "@fortawesome/react-fontawesome"
import { faEllipsisVertical, faRefresh, faSignOut } from "@fortawesome/free-solid-svg-icons"

import SettingsInputField from "../ui/SettingsInputField"

interface CustomMenuItemProps {
    value: string
    onClick?: () => void
    isHeading?: boolean
    children: React.ReactNode
}

const CustomMenuItem = ({ value, onClick, isHeading = false, children }: CustomMenuItemProps) => (
    <Menu.Item
        h={"35px"}
        pointerEvents={isHeading ? "none" : "auto"}
        cursor={"pointer"}
        value={value}
        overflow={"hidden"}
        onClick={onClick}
        transition={"all 0.2s ease"}
        _active={{ bg: "button.secondary.active" }}
        _highlighted={{ bg: "button.secondary.hover" }}
        px={4}
        py={3}
    >
        {children}
    </Menu.Item>
)

export interface AccountConnectionConfig {
    displayName: string
    urlSlug?: string
    logoUrl?: string
    logoIcon?: FontAwesomeIconProps["icon"]
    connectionType?: string // e.g., "Forum", "Discord", "Telegram"
    apiEndpoints?: {
        authRequest: string
        authProcess: string
        disconnect: string
    }
    successMessages?: {
        connected: string
        disconnected: string
    }
    errorMessages?: {
        authRequest: string
        authProcess: string
        disconnect: string
    }
}

export interface AccountConnectionManagerProps {
    config: AccountConnectionConfig
    isConnected: boolean
    isConnectedLoading: boolean
    connectionValue: string
    isSubmitting: boolean
    isProcessingAuthRequest?: boolean
    isBrokenConnection: boolean
    onConnect: () => void
    onDisconnect: () => void
    onRefresh?: () => void
    getConnectionTypeText?: () => string
    getConnectionDescription: () => string
    children?: React.ReactNode // For modals and other custom elements
}

export default function AccountConnectionManager({
    config,
    isConnected,
    isConnectedLoading,
    connectionValue,
    isSubmitting,
    isProcessingAuthRequest = false,
    isBrokenConnection,
    onConnect,
    onDisconnect,
    onRefresh,
    getConnectionTypeText,
    getConnectionDescription,
    children,
}: AccountConnectionManagerProps) {
    return (
        <>
            {children}
            <SettingsInputField
                label={`${config.displayName} ${config.connectionType || ""}`}
                labelIcon={
                    config.logoUrl && config.logoUrl.startsWith("http") ? (
                        <Box boxSize="16px" ml={1} mr={1} mb={1}>
                            <Image
                                src={config.logoUrl}
                                alt={config.displayName}
                                boxSize="100%"
                                objectFit="cover"
                                borderRadius="full"
                                transform="scale(1.5)"
                            />
                        </Box>
                    ) : (
                        config.logoIcon && <FontAwesomeIcon icon={config.logoIcon} size="lg" />
                    )
                }
                description={getConnectionDescription()}
                isPrivate={true}
                value={connectionValue}
                error=""
                isEditable={!isSubmitting && !isConnected}
                inputReplacement={
                    isConnectedLoading ? (
                        <Skeleton defaultSkeleton h={"100%"} w={"100%"} borderRadius="full" />
                    ) : (
                        !isConnected && (
                            <Button
                                primaryButton
                                h={"100%"}
                                w={"100%"}
                                onClick={onConnect}
                                borderRadius="full"
                                disabled={isSubmitting || isProcessingAuthRequest}
                            >
                                {isSubmitting || isProcessingAuthRequest ? (
                                    <Spinner size="sm" color="white" />
                                ) : (
                                    <Text fontWeight="bold">Connect</Text>
                                )}
                            </Button>
                        )
                    )
                }
                rightElement={
                    !isConnectedLoading &&
                    isConnected && (
                        <Menu.Root>
                            <Menu.Trigger asChild>
                                <Button
                                    {...(isBrokenConnection && {
                                        secondaryButton: true,
                                    })}
                                    {...(!isBrokenConnection && {
                                        successButton: true,
                                    })}
                                    h={"100%"}
                                    w={"120px"}
                                    pl={2}
                                    pr={0}
                                    border={"2px solid"}
                                    color={isBrokenConnection ? "textColor" : "lozenge.text.active"}
                                    borderColor={isBrokenConnection ? "teal.500" : "lozenge.border.active"}
                                    borderRightRadius="full"
                                    disabled={isSubmitting}
                                >
                                    <HStack gap={1}>
                                        {isSubmitting ? (
                                            <Spinner size="sm" color="lozenge.text.active" />
                                        ) : (
                                            <>
                                                <Text fontWeight="bold">
                                                    {isBrokenConnection ? "Refresh" : "Connected"}
                                                </Text>
                                                <FontAwesomeIcon icon={faEllipsisVertical} size="lg" />
                                            </>
                                        )}
                                    </HStack>
                                </Button>
                            </Menu.Trigger>
                            <Portal>
                                <Menu.Positioner mt={"-4px"}>
                                    <Menu.Content
                                        borderRadius={"12px"}
                                        borderWidth={2}
                                        borderColor={"contentBorder"}
                                        overflow={"hidden"}
                                        p={0}
                                        bg={"pageBackground"}
                                    >
                                        {getConnectionTypeText && (
                                            <CustomMenuItem value="connection-type" isHeading>
                                                <HStack overflow={"hidden"} color="textColorMuted" gap={1}>
                                                    <Text fontWeight="bold">{getConnectionTypeText()}</Text>
                                                </HStack>
                                            </CustomMenuItem>
                                        )}
                                        {onRefresh && (
                                            <CustomMenuItem value="refresh" onClick={onRefresh}>
                                                <HStack overflow={"hidden"}>
                                                    <Text fontWeight="bold">Refresh connection</Text>
                                                    <Box w="20px">
                                                        <FontAwesomeIcon icon={faRefresh} />
                                                    </Box>
                                                </HStack>
                                            </CustomMenuItem>
                                        )}
                                        <CustomMenuItem value="disconnect" onClick={onDisconnect}>
                                            <HStack overflow={"hidden"}>
                                                <Text fontWeight="bold" color="orange.500">
                                                    Disconnect
                                                </Text>
                                                <Box w="20px">
                                                    <FontAwesomeIcon icon={faSignOut} />
                                                </Box>
                                            </HStack>
                                        </CustomMenuItem>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu.Root>
                    )
                }
            />
        </>
    )
}
