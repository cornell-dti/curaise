export default function BuyerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ADD BUYER NAVBAR HERE */}
      <main className="flex-grow">{children}</main>
    </div>
  );
}
