import ContentContainer from "../../components/layout/ContentContainer"
import SignalDisplayContainer from "../../components/signal-display/SignalDisplayContainer"

interface ProfilePageProps {
    params: Promise<{
        username: string
    }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params

    return (
        <ContentContainer>
            <SignalDisplayContainer username={username} />
        </ContentContainer>
    )
}
