import ContentContainer from "../components/layout/ContentContainer"
import LeaderboardContainer from "../components/leaderboard/LeaderboardContainer"
import EarlyAccessInput from "../components/early-access/EarlyAccessInput"

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams
    const earlyAccessCode = params.earlyAccessCode

    return (
        <>
            {process.env.NODE_ENV === "development" || earlyAccessCode === "higher" ? (
                <ContentContainer>
                    <LeaderboardContainer project="lido" />
                </ContentContainer>
            ) : (
                <EarlyAccessInput />
            )}
        </>
    )
}
