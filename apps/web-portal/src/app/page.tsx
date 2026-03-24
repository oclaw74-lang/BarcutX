import Link from 'next/link'
import { Button } from '@/components/ui'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-primary">
          BarcutX
        </h1>
        <p className="mt-3 text-lg text-[#9CA3AF]">Tu fade, sin fila.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/login">
          <Button size="lg">Iniciar sesion</Button>
        </Link>
        <Link href="/register">
          <Button size="lg" variant="secondary">
            Crear cuenta
          </Button>
        </Link>
      </div>
    </main>
  )
}
