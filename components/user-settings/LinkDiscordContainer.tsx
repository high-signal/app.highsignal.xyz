import { useLinkAccount } from "@privy-io/react-auth"

export default function LinkDiscordButton() {
    const { linkDiscord } = useLinkAccount()

    const handleLink = () => {
        try {
            linkDiscord() // redirects user to Discord OAuth flow
        } catch (err) {
            console.error("Failed to link Discord:", err)
        }
    }

    return <button onClick={handleLink}>Link Discord Account</button>
}
