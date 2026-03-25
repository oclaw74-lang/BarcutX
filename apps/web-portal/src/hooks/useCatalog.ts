import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  BarberService,
  UpdateBarberServicePayload,
  CreateBarberServicePayload,
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  PortfolioItem,
  CreatePortfolioItemPayload,
  ReorderPortfolioPayload,
} from '@/types/catalog'

// ---- Query key factories ----------------------------------------------------

const catalogKeys = {
  services: (barberId: string) => ['catalog', 'services', barberId] as const,
  products: (barberId: string) => ['catalog', 'products', barberId] as const,
  portfolio: (barberId: string) => ['catalog', 'portfolio', barberId] as const,
}

// ---- Barber Services --------------------------------------------------------

/**
 * useBarberServices — fetches all services (own + inherited) for a barber.
 */
export function useBarberServices(barberId: string) {
  return useQuery<BarberService[]>({
    queryKey: catalogKeys.services(barberId),
    queryFn: async () => {
      const { data } = await apiClient.get<BarberService[]>(
        `/barbers/${barberId}/services`,
      )
      return data
    },
    enabled: !!barberId,
  })
}

/**
 * useCreateBarberService — creates a new custom service for a barber.
 */
export function useCreateBarberService(barberId: string) {
  const queryClient = useQueryClient()

  return useMutation<BarberService, Error, CreateBarberServicePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<BarberService>(
        `/barbers/${barberId}/services`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.services(barberId),
      })
    },
  })
}

/**
 * useUpdateBarberService — updates active status or custom price for a barber service.
 */
export function useUpdateBarberService(
  barberId: string,
  barberServiceId: string,
) {
  const queryClient = useQueryClient()

  return useMutation<BarberService, Error, UpdateBarberServicePayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<BarberService>(
        `/barbers/${barberId}/services/${barberServiceId}`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.services(barberId),
      })
    },
  })
}

// ---- Products ---------------------------------------------------------------

/**
 * useBarberProducts — fetches all products for a barber.
 */
export function useBarberProducts(barberId: string) {
  return useQuery<Product[]>({
    queryKey: catalogKeys.products(barberId),
    queryFn: async () => {
      const { data } = await apiClient.get<Product[]>(
        `/barbers/${barberId}/products`,
      )
      return data
    },
    enabled: !!barberId,
  })
}

/**
 * useCreateProduct — creates a new product for a barber.
 */
export function useCreateProduct(barberId: string) {
  const queryClient = useQueryClient()

  return useMutation<Product, Error, CreateProductPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<Product>(
        `/barbers/${barberId}/products`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.products(barberId),
      })
    },
  })
}

/**
 * useUpdateProduct — updates a product (including active status).
 */
export function useUpdateProduct(barberId: string, productId: string) {
  const queryClient = useQueryClient()

  return useMutation<Product, Error, UpdateProductPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.patch<Product>(
        `/barbers/${barberId}/products/${productId}`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.products(barberId),
      })
    },
  })
}

/**
 * useDeleteProduct — deletes a product permanently.
 */
export function useDeleteProduct(barberId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (productId) => {
      await apiClient.delete(`/barbers/${barberId}/products/${productId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.products(barberId),
      })
    },
  })
}

// ---- Portfolio --------------------------------------------------------------

/**
 * useBarberPortfolio — fetches the ordered portfolio for a barber.
 */
export function useBarberPortfolio(barberId: string) {
  return useQuery<PortfolioItem[]>({
    queryKey: catalogKeys.portfolio(barberId),
    queryFn: async () => {
      const { data } = await apiClient.get<PortfolioItem[]>(
        `/barbers/${barberId}/portfolio`,
      )
      return data
    },
    enabled: !!barberId,
  })
}

/**
 * useAddPortfolioItem — adds a new photo to the barber's portfolio.
 */
export function useAddPortfolioItem(barberId: string) {
  const queryClient = useQueryClient()

  return useMutation<PortfolioItem, Error, CreatePortfolioItemPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<PortfolioItem>(
        `/barbers/${barberId}/portfolio`,
        payload,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.portfolio(barberId),
      })
    },
  })
}

/**
 * useDeletePortfolioItem — removes a photo from the portfolio.
 */
export function useDeletePortfolioItem(barberId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (itemId) => {
      await apiClient.delete(`/barbers/${barberId}/portfolio/${itemId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.portfolio(barberId),
      })
    },
  })
}

/**
 * useReorderPortfolio — persists a new display order for portfolio items.
 */
export function useReorderPortfolio(barberId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, ReorderPortfolioPayload>({
    mutationFn: async (payload) => {
      await apiClient.put(`/barbers/${barberId}/portfolio/reorder`, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: catalogKeys.portfolio(barberId),
      })
    },
  })
}
