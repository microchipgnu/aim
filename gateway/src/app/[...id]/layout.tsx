
export default async function ProjectsLayout({
    children,
    params,
}: {
    children: React.ReactNode,
    params: Promise<{ id: string[] }>
}) {
    return children
}