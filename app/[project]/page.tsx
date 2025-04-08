import ContentContainer from "../../components/layout/ContentContainer"
import LeaderboardContainer from "../../components/leaderboard/LeaderboardContainer"

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
            <LeaderboardContainer project={project} />
        </ContentContainer>
    )
}
