import ContentContainer from "../../components/layout/ContentContainer"
import SignalDisplay from "../../components/SignalDisplay"

interface ProfilePageProps {
    params: Promise<{
        username: string
    }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params

    return (
        <ContentContainer>
            <SignalDisplay username={username} />
        </ContentContainer>
    )
}
