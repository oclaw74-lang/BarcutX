import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  BarberTalent,
  BarberTalentDetail,
  BarberPortfolioItem,
  TalentFilters,
  SendInvitationPayload,
  InvitationResponse,
} from '@/types/talent'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const talentKeys = {
  all: ['talent'] as const,
  list: (filters: Partial<TalentFilters>) =>
    ['talent', 'list', filters] as const,
  detail: (id: string) => ['talent', 'detail', id] as const,
  portfolio: (id: string) => ['talent', 'portfolio', id] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetches the list of available barbers, optionally filtered by city, specialty
 * and availability type.
 */
export function useAvailableBarbers(filters: Partial<TalentFilters> = {}) {
  const { city, specialty, availabilityType } = filters

  return useQuery<BarberTalent[]>({
    queryKey: talentKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (city && city.trim()) params.set('city', city.trim())
      if (specialty && specialty !== 'Todos') params.set('specialty', specialty)
      if (availabilityType && availabilityType !== 'Todos')
        params.set('availability_type', availabilityType)
      params.set('limit', '20')

      const { data } = await apiClient.get<BarberTalent[]>(
        `/api/v1/barbers/available?${params.toString()}`,
      )
      return data
    },
  })
}

/**
 * Fetches the public profile of a single barber by id.
 */
export function useBarberPublicProfile(id: string) {
  return useQuery<BarberTalentDetail>({
    queryKey: talentKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<BarberTalentDetail>(
        `/api/v1/barbers/${id}/public`,
      )
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetches the portfolio images for a barber.
 */
export function useBarberPortfolio(id: string) {
  return useQuery<BarberPortfolioItem[]>({
    queryKey: talentKeys.portfolio(id),
    queryFn: async () => {
      const { data } = await apiClient.get<BarberPortfolioItem[]>(
        `/api/v1/barbers/${id}/portfolio`,
      )
      return data
    },
    enabled: !!id,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Sends an invitation from a shop to a barber on the talent marketplace.
 */
export function useSendInvitation(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<InvitationResponse, Error, SendInvitationPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<InvitationResponse>(
        `/api/v1/shops/${shopId}/invitations`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: talentKeys.all,
      })
    },
  })
}
