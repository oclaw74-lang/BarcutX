import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { ShopBarber, BarberInvitation, JoinRequest } from '../src/types/team'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockBarbers: ShopBarber[] = [
  {
    id: 'b1',
    userId: 'u1',
    shopId: 'demo',
    name: 'Carlos Lopez',
    role: 'senior',
    status: 'active',
    clientsToday: 4,
    revenueToday: 200,
    joinedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'b2',
    userId: 'u2',
    shopId: 'demo',
    name: 'Maria Garcia',
    role: 'associate',
    status: 'active',
    clientsToday: 2,
    revenueToday: 80,
    joinedAt: '2024-03-01T00:00:00Z',
  },
]

const mockInvitations: BarberInvitation[] = [
  {
    id: 'inv1',
    shopId: 'demo',
    email: 'nuevo@barbero.com',
    status: 'pending',
    sentAt: '2026-03-20T10:00:00Z',
    expiresAt: '2026-03-27T10:00:00Z',
  },
]

const mockJoinRequests: JoinRequest[] = [
  {
    id: 'req1',
    shopId: 'demo',
    userId: 'u3',
    name: 'Pedro Sanchez',
    specialty: 'Fade y degradados',
    message: 'Tengo 5 anos de experiencia y me gustaria unirme a vuestro equipo.',
    status: 'pending',
    requestedAt: '2026-03-22T09:00:00Z',
  },
  {
    id: 'req2',
    shopId: 'demo',
    userId: 'u4',
    name: 'Ana Torres',
    status: 'pending',
    requestedAt: '2026-03-23T14:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useTeam', () => ({
  useShopBarbers: vi.fn(() => ({
    data: mockBarbers,
    isLoading: false,
    isError: false,
  })),
  useInvitations: vi.fn(() => ({
    data: mockInvitations,
    isLoading: false,
    isError: false,
  })),
  useJoinRequests: vi.fn(() => ({
    data: mockJoinRequests,
    isLoading: false,
    isError: false,
  })),
  useInviteBarber: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    variables: undefined,
  })),
  useRemoveBarber: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    variables: undefined,
  })),
  useResendInvitation: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    variables: undefined,
  })),
  useCancelInvitation: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    variables: undefined,
  })),
  useApproveRequest: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    variables: undefined,
  })),
  useRejectRequest: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    variables: undefined,
  })),
}))

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return Wrapper
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Team management page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders active barbers tab by default', async () => {
    const { default: EquipoPage } = await import(
      '../src/app/(dashboard)/equipo/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <EquipoPage />
      </Wrapper>,
    )

    expect(
      screen.getByRole('heading', { name: /gestion de equipo/i }),
    ).toBeInTheDocument()

    expect(screen.getByText('Carlos Lopez')).toBeInTheDocument()
    expect(screen.getByText('Maria Garcia')).toBeInTheDocument()
  })

  it('shows the invite modal when clicking "+ Invitar barbero" and closes it', async () => {
    const { default: EquipoPage } = await import(
      '../src/app/(dashboard)/equipo/page'
    )
    const Wrapper = createWrapper()
    const user = userEvent.setup()

    render(
      <Wrapper>
        <EquipoPage />
      </Wrapper>,
    )

    const inviteButton = screen.getByRole('button', { name: /invitar barbero/i })
    await user.click(inviteButton)

    expect(
      screen.getByRole('dialog', { name: /invitar barbero/i }),
    ).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: /cerrar modal/i })
    await user.click(closeButton)

    expect(
      screen.queryByRole('dialog', { name: /invitar barbero/i }),
    ).not.toBeInTheDocument()
  })

  it('shows pending requests count badge on the requests tab', async () => {
    const { default: EquipoPage } = await import(
      '../src/app/(dashboard)/equipo/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <EquipoPage />
      </Wrapper>,
    )

    // mockJoinRequests has 2 pending items
    const badge = screen.getByText('2')
    expect(badge).toBeInTheDocument()
  })

  it('shows approve and reject buttons in the requests tab', async () => {
    const { default: EquipoPage } = await import(
      '../src/app/(dashboard)/equipo/page'
    )
    const Wrapper = createWrapper()
    const user = userEvent.setup()

    render(
      <Wrapper>
        <EquipoPage />
      </Wrapper>,
    )

    const requestsTab = screen.getByRole('tab', { name: /solicitudes/i })
    await user.click(requestsTab)

    const approveButtons = screen.getAllByRole('button', { name: /aprobar/i })
    const rejectButtons = screen.getAllByRole('button', { name: /rechazar/i })

    expect(approveButtons).toHaveLength(2)
    expect(rejectButtons).toHaveLength(2)
  })
})
