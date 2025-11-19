import { Separator } from "@/components/ui/separator"

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <Separator />
      <footer className="bg-background px-6 py-4">
        <p className="text-center text-sm text-muted-foreground">
          © {currentYear} Prospera Digital LLC. Todos los derechos reservados.
        </p>
      </footer>
    </>
  )
}