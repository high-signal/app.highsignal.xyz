import ContentContainer from "../components/layout/ContentContainer"
import LeaderboardContainer from "../components/leaderboard/LeaderboardContainer"

export default function Page() {
    return (
        <ContentContainer>
            <LeaderboardContainer project="lido" />
        </ContentContainer>
    )
}
