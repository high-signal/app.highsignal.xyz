import ContentContainer from "../components/layout/ContentContainer"
import LeaderboardContainer from "../components/leaderboard/LeaderboardContainer"
import EarlyAccessInput from "../components/EarlyAccessInput"

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams
    const earlyAccessCode = params.earlyAccessCode

    return (
        <ContentContainer>
            {process.env.NODE_ENV === "development" || earlyAccessCode === "higher" ? (
                <LeaderboardContainer project="lido" />
            ) : (
                <EarlyAccessInput />
            )}
        </ContentContainer>
    )
}
