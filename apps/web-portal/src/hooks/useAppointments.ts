import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Appointment, AppointmentStatus } from '@barcutx/shared-types'

export interface AppointmentFilters {
  status?: AppointmentStatus
  date?: string
}

export interface UpdateAppointmentStatusPayload {
  status: AppointmentStatus
}

export function useAppointments(shopId: string, filters?: AppointmentFilters) {
  return useQuery<Appointment[]>({
    queryKey: ['appointments', shopId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.date) params.set('date', filters.date)

      const { data } = await apiClient.get<Appointment[]>(
        `/barber-shops/${shopId}/appointments?${params.toString()}`,
      )
      return data
    },
    enabled: !!shopId,
  })
}

export function useUpdateAppointmentStatus(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    Appointment,
    Error,
    { appointmentId: string; status: AppointmentStatus }
  >({
    mutationFn: async ({ appointmentId, status }) => {
      const { data } = await apiClient.patch<Appointment>(
        `/barber-shops/${shopId}/appointments/${appointmentId}`,
        { status } satisfies UpdateAppointmentStatusPayload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['appointments', shopId],
      })
    },
  })
}
