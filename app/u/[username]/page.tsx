export default async function UserProfilePage({
    params,
}: {
    params: Promise<{
        username: string
    }>
}) {
    const { username } = await params

    return <div>User Profile: {username}</div>
}
