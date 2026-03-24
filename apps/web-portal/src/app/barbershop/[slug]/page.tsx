import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { BarbershopPublic, Service } from '@/lib/types'

interface BarbershopPageProps {
  params: Promise<{ slug: string }>
}

/**
 * generateMetadata runs on the server and receives the resolved params.
 * In Next.js 15, params is a Promise.
 */
export async function generateMetadata({
  params,
}: BarbershopPageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug} — BarcutX`,
    description: `Reserva tu cita en ${slug} a traves de BarcutX.`,
  }
}

/** Placeholder while real API integration lands in the next sprint. */
async function fetchBarbershop(slug: string): Promise<BarbershopPublic | null> {
  // TODO: replace with apiClient call once auth + API are wired up
  const placeholder: BarbershopPublic = {
    id: slug,
    name: slug,
    slug,
    address: '--',
    city: '--',
    country: '--',
    isActive: true,
  }
  return placeholder
}

async function fetchServices(_shopId: string): Promise<Service[]> {
  // TODO: replace with apiClient call
  return []
}

export default async function BarbershopProfilePage({
  params,
}: BarbershopPageProps) {
  const { slug } = await params
  const shop = await fetchBarbershop(slug)

  if (!shop) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-[#9CA3AF]">Barberia no encontrada.</p>
      </main>
    )
  }

  const services = await fetchServices(shop.id)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Hero */}
      <div className="mb-8 flex flex-col gap-2">
        {shop.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shop.coverUrl}
            alt={`${shop.name} cover`}
            className="h-48 w-full rounded-lg object-cover"
          />
        )}
        <h1 className="font-display text-3xl font-bold text-white">
          {shop.name}
        </h1>
        <p className="text-sm text-[#9CA3AF]">
          {shop.address}, {shop.city}, {shop.country}
        </p>
        {shop.description && (
          <p className="text-sm text-[#9CA3AF]">{shop.description}</p>
        )}

        <div className="mt-2 flex gap-3">
          <Button size="md">Reservar cita</Button>
          <Button size="md" variant="secondary">
            Unirme a la cola
          </Button>
        </div>
      </div>

      {/* Services */}
      <section aria-labelledby="services-heading">
        <h2
          id="services-heading"
          className="mb-4 font-display text-xl font-semibold text-white"
        >
          Servicios
        </h2>

        {services.length === 0 ? (
          <p className="text-sm text-[#6B7280]">
            Sin servicios publicados todavia.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <Card key={service.id} bordered>
                <CardHeader>
                  <CardTitle className="text-base">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#9CA3AF]">
                      {service.durationMinutes} min
                    </span>
                    <span className="font-semibold text-primary">
                      ${service.price}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
