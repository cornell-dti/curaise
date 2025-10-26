export default async function Layout({
	children,
}: {
	params: Promise<{ id: string }>;
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
