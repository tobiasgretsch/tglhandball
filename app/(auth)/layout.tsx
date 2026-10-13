export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background dark:bg-gray-900 px-4">
      {children}
    </div>
  );
}
