import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShopBranding {
  name: string
  slug: string
  tagline: string
  accentColor: string
  instagramUrl: string
  whatsapp: string
  logoUrl: string | null
  coverUrl: string | null
  galleryUrls: string[]
}

export interface DayHours {
  open: boolean
  openTime: string
  closeTime: string
}

export type WeekHours = Record<
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  DayHours
>

export interface ShopSettings {
  branding: ShopBranding
  hours: WeekHours
}

export interface UpdateBrandingPayload {
  name?: string
  slug?: string
  tagline?: string
  accentColor?: string
  instagramUrl?: string
  whatsapp?: string
  logoUrl?: string | null
  coverUrl?: string | null
  galleryUrls?: string[]
}

export interface UpdateHoursPayload {
  hours: WeekHours
}

export interface UploadPhotoPayload {
  file: File
  type: 'logo' | 'cover' | 'gallery'
}

export interface UploadPhotoResponse {
  url: string
}

export interface DeleteGalleryPhotoPayload {
  url: string
}

// ─── Query keys ──────────────────────────────────────────────────────────────

const shopSettingsKey = (shopId: string) => ['shop-settings', shopId] as const

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetches the current branding + hours settings for a given shop.
 */
export function useShopSettings(shopId: string) {
  return useQuery<ShopSettings>({
    queryKey: shopSettingsKey(shopId),
    queryFn: async () => {
      const { data } = await apiClient.get<ShopSettings>(
        `/barber-shops/${shopId}/settings`,
      )
      return data
    },
    enabled: !!shopId,
  })
}

/**
 * Updates branding fields (name, slug, colors, social links, etc.).
 */
export function useUpdateBranding(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<ShopSettings, Error, UpdateBrandingPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<ShopSettings>(
        `/barber-shops/${shopId}/settings/branding`,
        payload,
      )
      return data
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(shopSettingsKey(shopId), updated)
    },
  })
}

/**
 * Updates the weekly hours schedule.
 */
export function useUpdateHours(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<ShopSettings, Error, UpdateHoursPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<ShopSettings>(
        `/barber-shops/${shopId}/settings/hours`,
        payload,
      )
      return data
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(shopSettingsKey(shopId), updated)
    },
  })
}

/**
 * Uploads a logo, cover or gallery photo and returns the new URL.
 */
export function useUploadGalleryPhoto(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<UploadPhotoResponse, Error, UploadPhotoPayload>({
    mutationFn: async ({ file, type }) => {
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)

      const { data } = await apiClient.post<UploadPhotoResponse>(
        `/barber-shops/${shopId}/settings/upload`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shopSettingsKey(shopId) })
    },
  })
}

/**
 * Removes a photo URL from the gallery.
 */
export function useDeleteGalleryPhoto(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, DeleteGalleryPhotoPayload>({
    mutationFn: async ({ url }) => {
      await apiClient.delete(`/barber-shops/${shopId}/settings/gallery`, {
        data: { url },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shopSettingsKey(shopId) })
    },
  })
}
