import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Iniciar sesion — BarcutX',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card bordered className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesion</CardTitle>
          <CardContent className="mt-1 px-0">
            Accede a tu cuenta de BarcutX
          </CardContent>
        </CardHeader>

        {/* Form — interactivity handled by a client component in the real impl */}
        <form className="flex flex-col gap-4" aria-label="Login form">
          <Input
            label="Correo electronico"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@email.com"
            required
          />
          <Input
            label="Contrasena"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
          <Button type="submit" size="md">
            Entrar
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#9CA3AF]">
          No tienes cuenta?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </main>
  )
}
