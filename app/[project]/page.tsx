import ContentContainer from "../../components/layout/ContentContainer"
import Leaderboard from "../../components/leaderboard/Leaderboard"

export default async function ProjectLeaderboardPage({
    params,
}: {
    params: Promise<{
        project: string
    }>
}) {
    const { project } = await params

    return (
        <ContentContainer>
            <Leaderboard project={project} />
        </ContentContainer>
    )
}
