import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface StatCardProps {
  title: string
  value: string
  description: string
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card bordered>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-[#9CA3AF]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="mt-1 text-xs text-[#6B7280]">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Bienvenido a BarcutX
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          Resumen de actividad de tu barberia
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Citas hoy"
          value="—"
          description="Conecta tu barberia para ver datos"
        />
        <StatCard
          title="En cola"
          value="—"
          description="Clientes esperando ahora"
        />
        <StatCard
          title="Ingresos del dia"
          value="—"
          description="Total facturado hoy"
        />
        <StatCard
          title="Valoracion"
          value="—"
          description="Promedio de resenas"
        />
      </div>
    </div>
  )
}
