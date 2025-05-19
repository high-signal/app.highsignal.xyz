import ClientGate from "../components/early-access/ClientGate"

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams
    const earlyAccessCodeUrlParam = params.earlyAccessCode

    return <ClientGate earlyAccessCodeUrlParam={earlyAccessCodeUrlParam?.toString() ?? ""} />
}
