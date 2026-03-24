import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { BarberShop } from '@barcutx/shared-types'

export interface UpdateBarberShopPayload {
  name?: string
  description?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  isActive?: boolean
}

export function useBarberShops() {
  return useQuery<BarberShop[]>({
    queryKey: ['barber-shops'],
    queryFn: async () => {
      const { data } = await apiClient.get<BarberShop[]>('/barber-shops')
      return data
    },
  })
}

export function useBarberShop(shopId: string) {
  return useQuery<BarberShop>({
    queryKey: ['barber-shops', shopId],
    queryFn: async () => {
      const { data } = await apiClient.get<BarberShop>(`/barber-shops/${shopId}`)
      return data
    },
    enabled: !!shopId,
  })
}

export function useUpdateBarberShop(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<BarberShop, Error, UpdateBarberShopPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<BarberShop>(
        `/barber-shops/${shopId}`,
        payload,
      )
      return data
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['barber-shops', shopId], updated)
      void queryClient.invalidateQueries({ queryKey: ['barber-shops'] })
    },
  })
}
