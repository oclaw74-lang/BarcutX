import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Prevent WebSocket connections in tests
vi.mock('@/hooks/useQueue', () => ({
  useQueue: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
  useCallNextInQueue: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useUpdateQueueEntry: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useQueueWebSocket: vi.fn(),
}))

vi.mock('@/hooks/useAppointments', () => ({
  useAppointments: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
  useUpdateAppointmentStatus: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
}))

vi.mock('@/hooks/useServices', () => ({
  useServices: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
  useCreateService: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useUpdateService: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
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

describe('Dashboard overview page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the welcome heading', async () => {
    const { default: DashboardPage } = await import(
      '../src/app/(dashboard)/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <DashboardPage />
      </Wrapper>,
    )

    expect(
      screen.getByRole('heading', { name: /bienvenido a barcutx/i }),
    ).toBeInTheDocument()
  })

  it('renders the three stats cards', async () => {
    const { default: DashboardPage } = await import(
      '../src/app/(dashboard)/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <DashboardPage />
      </Wrapper>,
    )

    expect(screen.getByText(/citas hoy/i)).toBeInTheDocument()
    expect(screen.getByText(/en cola/i)).toBeInTheDocument()
    expect(screen.getByText(/servicios activos/i)).toBeInTheDocument()
  })

  it('shows empty state when no pending appointments', async () => {
    const { default: DashboardPage } = await import(
      '../src/app/(dashboard)/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <DashboardPage />
      </Wrapper>,
    )

    expect(
      screen.getByText(/no hay reservas pendientes para hoy/i),
    ).toBeInTheDocument()
  })
})

describe('Services page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the services heading', async () => {
    const { default: ServicesPage } = await import(
      '../src/app/(dashboard)/services/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <ServicesPage />
      </Wrapper>,
    )

    expect(
      screen.getByRole('heading', { name: /servicios/i }),
    ).toBeInTheDocument()
  })

  it('renders the add service button', async () => {
    const { default: ServicesPage } = await import(
      '../src/app/(dashboard)/services/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <ServicesPage />
      </Wrapper>,
    )

    expect(
      screen.getByRole('button', { name: /agregar servicio/i }),
    ).toBeInTheDocument()
  })

  it('shows empty table row when no services exist', async () => {
    const { default: ServicesPage } = await import(
      '../src/app/(dashboard)/services/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <ServicesPage />
      </Wrapper>,
    )

    expect(
      screen.getByText(/no hay servicios registrados/i),
    ).toBeInTheDocument()
  })
})

describe('Queue page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the queue heading', async () => {
    const { default: QueuePage } = await import(
      '../src/app/(dashboard)/queue/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <QueuePage />
      </Wrapper>,
    )

    expect(
      screen.getByRole('heading', { name: /cola virtual/i }),
    ).toBeInTheDocument()
  })

  it('renders the call next button', async () => {
    const { default: QueuePage } = await import(
      '../src/app/(dashboard)/queue/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <QueuePage />
      </Wrapper>,
    )

    expect(
      screen.getByRole('button', { name: /llamar siguiente/i }),
    ).toBeInTheDocument()
  })

  it('shows empty state when queue is empty', async () => {
    const { default: QueuePage } = await import(
      '../src/app/(dashboard)/queue/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <QueuePage />
      </Wrapper>,
    )

    expect(screen.getByText(/cola vacia/i)).toBeInTheDocument()
  })
})
