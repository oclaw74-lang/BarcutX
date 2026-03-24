import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Crear cuenta — BarcutX',
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card bordered className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardContent className="mt-1 px-0">
            Empieza a usar BarcutX hoy
          </CardContent>
        </CardHeader>

        <form className="flex flex-col gap-4" aria-label="Register form">
          <div className="flex gap-3">
            <Input
              label="Nombre"
              type="text"
              name="firstName"
              autoComplete="given-name"
              placeholder="John"
              required
            />
            <Input
              label="Apellido"
              type="text"
              name="lastName"
              autoComplete="family-name"
              placeholder="Doe"
              required
            />
          </div>
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
            autoComplete="new-password"
            placeholder="••••••••"
            hint="Minimo 8 caracteres"
            required
          />
          <Button type="submit" size="md">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#9CA3AF]">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesion
          </Link>
        </p>
      </Card>
    </main>
  )
}
