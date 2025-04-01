import ContentContainer from "../components/layout/ContentContainer"
import Leaderboard from "../components/Leaderboard"
import EarlyAccessInput from "../components/EarlyAccessInput"

interface PageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ searchParams }: PageProps) {
    const earlyAccessCode = searchParams.earlyAccessCode

    return <ContentContainer>{earlyAccessCode === "higher" ? <Leaderboard /> : <EarlyAccessInput />}</ContentContainer>
}
