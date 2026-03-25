import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard — BarcutX',
}

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Mi Barberia', href: '/dashboard/shop' },
  { label: 'Servicios', href: '/dashboard/services' },
  { label: 'Catalogo', href: '/dashboard/catalogo' },
  { label: 'Reservas', href: '/dashboard/appointments' },
  { label: 'Cola Virtual', href: '/dashboard/queue' },
  { label: 'Equipo', href: '/dashboard/equipo' },
  { label: 'Configuracion', href: '/dashboard/settings' },
]

function Sidebar() {
  return (
    <aside className="flex w-60 flex-col gap-2 border-r border-border bg-surface px-4 py-6">
      <Link href="/" className="mb-6 font-display text-xl font-bold text-primary">
        BarcutX
      </Link>
      <nav aria-label="Dashboard navigation">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex rounded-md px-3 py-2 text-sm text-[#9CA3AF] transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <span className="text-sm font-medium text-white">Panel de control</span>
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary"
          aria-label="User avatar"
        >
          U
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
