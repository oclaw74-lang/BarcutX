import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Service, ServiceCategory } from '@barcutx/shared-types'

export interface CreateServicePayload {
  name: string
  description?: string
  price: number
  durationMinutes: number
  category: ServiceCategory
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {
  isActive?: boolean
}

export function useServices(shopId: string) {
  return useQuery<Service[]>({
    queryKey: ['services', shopId],
    queryFn: async () => {
      const { data } = await apiClient.get<Service[]>(
        `/barber-shops/${shopId}/services`,
      )
      return data
    },
    enabled: !!shopId,
  })
}

export function useCreateService(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<Service, Error, CreateServicePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Service>(
        `/barber-shops/${shopId}/services`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services', shopId] })
    },
  })
}

export function useUpdateService(shopId: string, serviceId: string) {
  const queryClient = useQueryClient()

  return useMutation<Service, Error, UpdateServicePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<Service>(
        `/barber-shops/${shopId}/services/${serviceId}`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services', shopId] })
    },
  })
}

export function useDeleteService(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (serviceId) => {
      await apiClient.delete(`/barber-shops/${shopId}/services/${serviceId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services', shopId] })
    },
  })
}
