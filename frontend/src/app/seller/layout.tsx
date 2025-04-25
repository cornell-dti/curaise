export default function SellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ADD SELLER NAVBAR HERE */}
      <main className="flex-grow">{children}</main>
    </div>
  );
}
