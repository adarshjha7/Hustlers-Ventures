export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We can add a global background color here if we want all auth pages to share it
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}