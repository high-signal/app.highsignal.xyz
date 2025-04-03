import ContentContainer from "../components/layout/ContentContainer"
import Leaderboard from "../components/Leaderboard"
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
                <Leaderboard project="lido" />
            ) : (
                <EarlyAccessInput />
            )}
        </ContentContainer>
    )
}
