// En: client/app/(auth)/layout.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Usamos flexbox para centrar el contenido vertical y horizontalmente
    <main className="flex min-h-screen w-full items-center justify-center bg-input/50 ">
      {children}
    </main>
  );
}
