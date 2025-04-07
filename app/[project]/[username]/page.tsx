import ContentContainer from "../../../components/layout/ContentContainer"
import SignalDisplayContainer from "../../../components/signal-display/SignalDisplayContainer"

export default async function ProfilePage({
    params,
}: {
    params: Promise<{
        project: string
        username: string
    }>
}) {
    const { project, username } = await params

    return (
        <ContentContainer>
            <SignalDisplayContainer project={project} username={username} />
        </ContentContainer>
    )
}
