'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api'
import type { QueueEntry, QueueUpdate } from '@barcutx/shared-types'

export function useQueue(shopId: string) {
  return useQuery<QueueEntry[]>({
    queryKey: ['queue', shopId],
    queryFn: async () => {
      const { data } = await apiClient.get<QueueEntry[]>(
        `/barber-shops/${shopId}/queue`,
      )
      return data
    },
    enabled: !!shopId,
    refetchInterval: 30_000,
  })
}

export function useCallNextInQueue(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<QueueEntry, Error, void>({
    mutationFn: async () => {
      const { data } = await apiClient.post<QueueEntry>(
        `/barber-shops/${shopId}/queue/call-next`,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['queue', shopId] })
    },
  })
}

export function useUpdateQueueEntry(shopId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    QueueEntry,
    Error,
    { entryId: string; status: QueueEntry['status'] }
  >({
    mutationFn: async ({ entryId, status }) => {
      const { data } = await apiClient.patch<QueueEntry>(
        `/barber-shops/${shopId}/queue/${entryId}`,
        { status },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['queue', shopId] })
    },
  })
}

/**
 * useQueueWebSocket — subscribes to real-time queue updates via WebSocket.
 * Invalidates the ['queue', shopId] query cache on every incoming message.
 *
 * @param shopId - The barber shop ID to subscribe to
 * @param enabled - Set to false to skip the connection (e.g. shopId not ready)
 */
export function useQueueWebSocket(shopId: string, enabled = true) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !shopId) return

    const wsBaseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, 'ws').replace(
        /\/api\/v1\/?$/,
        '',
      ) ?? 'ws://localhost:8001'

    function connect() {
      const ws = new WebSocket(`${wsBaseUrl}/ws/queue/${shopId}`)
      wsRef.current = ws

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const message = JSON.parse(event.data) as QueueUpdate
          if (message.type === 'queue_update') {
            void queryClient.invalidateQueries({ queryKey: ['queue', shopId] })
          }
        } catch {
          // ignore malformed frames
        }
      }

      ws.onclose = () => {
        // Reconnect after 3 seconds on unexpected close
        reconnectTimeoutRef.current = setTimeout(connect, 3_000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [shopId, enabled, queryClient])
}
