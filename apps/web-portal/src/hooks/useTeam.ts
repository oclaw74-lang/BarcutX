import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  ShopBarber,
  BarberInvitation,
  JoinRequest,
  InviteBarberPayload,
} from '@/types/team'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const teamKeys = {
  barbers: (shopId: string) => ['team', 'barbers', shopId] as const,
  invitations: (shopId: string) => ['team', 'invitations', shopId] as const,
  joinRequests: (shopId: string) => ['team', 'join-requests', shopId] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetches the list of active barbers for a given shop.
 */
export function useShopBarbers(shopId: string) {
  return useQuery<ShopBarber[]>({
    queryKey: teamKeys.barbers(shopId),
    queryFn: async () => {
      const { data } = await apiClient.get<ShopBarber[]>(
        `/barber-shops/${shopId}/barbers`,
      )
      return data
    },
    enabled: !!shopId,
  })
}

/**
 * Fetches the list of invitations sent by the shop.
 */
export function useInvitations(shopId: string) {
  return useQuery<BarberInvitation[]>({
    queryKey: teamKeys.invitations(shopId),
    queryFn: async () => {
      const { data } = await apiClient.get<BarberInvitation[]>(
        `/barber-shops/${shopId}/invitations`,
      )
      return data
    },
    enabled: !!shopId,
  })
}

/**
 * Fetches join requests from barbers who want to join the shop.
 */
export function useJoinRequests(shopId: string) {
  return useQuery<JoinRequest[]>({
    queryKey: teamKeys.joinRequests(shopId),
    queryFn: async () => {
      const { data } = await apiClient.get<JoinRequest[]>(
        `/barber-shops/${shopId}/join-requests`,
      )
      return data
    },
    enabled: !!shopId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Sends an invitation to a barber by email.
 */
export function useInviteBarber(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<BarberInvitation, Error, InviteBarberPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<BarberInvitation>(
        `/barber-shops/${shopId}/invitations`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teamKeys.invitations(shopId),
      })
    },
  })
}

/**
 * Resends a previously sent invitation.
 */
export function useResendInvitation(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<BarberInvitation, Error, string>({
    mutationFn: async (invitationId) => {
      const { data } = await apiClient.post<BarberInvitation>(
        `/barber-shops/${shopId}/invitations/${invitationId}/resend`,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teamKeys.invitations(shopId),
      })
    },
  })
}

/**
 * Cancels a pending invitation.
 */
export function useCancelInvitation(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (invitationId) => {
      await apiClient.delete(
        `/barber-shops/${shopId}/invitations/${invitationId}`,
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teamKeys.invitations(shopId),
      })
    },
  })
}

/**
 * Approves a barber join request.
 */
export function useApproveRequest(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<JoinRequest, Error, string>({
    mutationFn: async (requestId) => {
      const { data } = await apiClient.post<JoinRequest>(
        `/barber-shops/${shopId}/join-requests/${requestId}/approve`,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teamKeys.joinRequests(shopId),
      })
      void queryClient.invalidateQueries({
        queryKey: teamKeys.barbers(shopId),
      })
    },
  })
}

/**
 * Rejects a barber join request.
 */
export function useRejectRequest(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<JoinRequest, Error, string>({
    mutationFn: async (requestId) => {
      const { data } = await apiClient.post<JoinRequest>(
        `/barber-shops/${shopId}/join-requests/${requestId}/reject`,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teamKeys.joinRequests(shopId),
      })
    },
  })
}

/**
 * Removes a barber from the shop.
 */
export function useRemoveBarber(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (barberId) => {
      await apiClient.delete(`/barber-shops/${shopId}/barbers/${barberId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teamKeys.barbers(shopId),
      })
    },
  })
}
