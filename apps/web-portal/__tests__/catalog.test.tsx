import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { BarberService, Product, PortfolioItem } from '../src/types/catalog'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockBarberService: BarberService = {
  id: 'bs-1',
  barberId: 'demo',
  service: {
    id: 's-1',
    barberShopId: 'shop-1',
    name: 'Corte clasico',
    description: 'Un corte clasico',
    price: 15,
    durationMinutes: 30,
    category: 'haircut',
    isActive: true,
  },
  customPrice: null,
  isActive: true,
  isInherited: false,
}

const mockProduct: Product = {
  id: 'p-1',
  barberId: 'demo',
  name: 'Cera mate',
  description: 'Cera premium',
  price: 12.99,
  stock: 5,
  category: 'wax',
  imageUrl: undefined,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const mockPortfolioItem: PortfolioItem = {
  id: 'pi-1',
  barberId: 'demo',
  imageUrl: 'https://example.com/photo.jpg',
  caption: 'Fade clásico',
  order: 0,
  createdAt: '2026-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Mocks — catalog hooks
// ---------------------------------------------------------------------------

vi.mock('../src/hooks/useCatalog', () => ({
  useBarberServices: vi.fn(() => ({
    data: [mockBarberService],
    isLoading: false,
    isError: false,
  })),
  useBarberProducts: vi.fn(() => ({
    data: [mockProduct],
    isLoading: false,
    isError: false,
  })),
  useBarberPortfolio: vi.fn(() => ({
    data: [mockPortfolioItem],
    isLoading: false,
    isError: false,
  })),
  useCreateBarberService: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useUpdateBarberService: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useCreateProduct: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useUpdateProduct: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useDeleteProduct: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useAddPortfolioItem: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useDeletePortfolioItem: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  })),
  useReorderPortfolio: vi.fn(() => ({
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
// Tests — CatalogoPage
// ---------------------------------------------------------------------------

describe('Catalog page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tabs correctly', async () => {
    const { default: CatalogoPage } = await import(
      '../src/app/(dashboard)/catalogo/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <CatalogoPage />
      </Wrapper>,
    )

    expect(screen.getByRole('tab', { name: /mis servicios/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /mis productos/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /mi portafolio/i })).toBeInTheDocument()
  })

  it('renders service list on services tab', async () => {
    const { default: CatalogoPage } = await import(
      '../src/app/(dashboard)/catalogo/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <CatalogoPage />
      </Wrapper>,
    )

    // Services tab is active by default
    expect(screen.getByText('Corte clasico')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('calls toggle handler when toggling service active/inactive', async () => {
    const { useUpdateBarberService } = await import('../src/hooks/useCatalog')
    const mutateAsync = vi.fn()
    vi.mocked(useUpdateBarberService).mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
    } as ReturnType<typeof useUpdateBarberService>)

    const { default: CatalogoPage } = await import(
      '../src/app/(dashboard)/catalogo/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <CatalogoPage />
      </Wrapper>,
    )

    const toggle = screen.getByRole('switch', { name: /reordenar/i }) ?? screen.getAllByRole('switch')[0]
    fireEvent.click(toggle)

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ isActive: false })
    })
  })

  it('opens add product modal when button is clicked', async () => {
    const { default: CatalogoPage } = await import(
      '../src/app/(dashboard)/catalogo/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <CatalogoPage />
      </Wrapper>,
    )

    // Switch to products tab
    fireEvent.click(screen.getByRole('tab', { name: /mis productos/i }))

    const addButton = screen.getByRole('button', { name: /agregar producto/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /nuevo producto/i }),
      ).toBeInTheDocument()
    })
  })

  it('renders portfolio grid on portfolio tab', async () => {
    const { default: CatalogoPage } = await import(
      '../src/app/(dashboard)/catalogo/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <CatalogoPage />
      </Wrapper>,
    )

    fireEvent.click(screen.getByRole('tab', { name: /mi portafolio/i }))

    await waitFor(() => {
      expect(screen.getByTestId('portfolio-grid')).toBeInTheDocument()
      expect(screen.getByTestId('portfolio-upload-button')).toBeInTheDocument()
    })

    // Portfolio item is rendered
    expect(screen.getByAltText('Fade clásico')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tests — individual components
// ---------------------------------------------------------------------------

describe('ServiceRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders service name, duration and price', async () => {
    const { ServiceRow } = await import('../src/components/catalog/ServiceRow')
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <ServiceRow barberId="demo" barberService={mockBarberService} />
      </Wrapper>,
    )

    expect(screen.getByText('Corte clasico')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('15.00 EUR')).toBeInTheDocument()
  })
})

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product name and price', async () => {
    const { ProductCard } = await import('../src/components/catalog/ProductCard')
    const Wrapper = createWrapper()
    const onEdit = vi.fn()

    render(
      <Wrapper>
        <ProductCard barberId="demo" product={mockProduct} onEdit={onEdit} />
      </Wrapper>,
    )

    expect(screen.getByText('Cera mate')).toBeInTheDocument()
    expect(screen.getByText('12.99 EUR')).toBeInTheDocument()
    expect(screen.getByText('Stock: 5')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const { ProductCard } = await import('../src/components/catalog/ProductCard')
    const Wrapper = createWrapper()
    const onEdit = vi.fn()

    render(
      <Wrapper>
        <ProductCard barberId="demo" product={mockProduct} onEdit={onEdit} />
      </Wrapper>,
    )

    fireEvent.click(screen.getByRole('button', { name: /editar cera mate/i }))
    expect(onEdit).toHaveBeenCalledWith(mockProduct)
  })
})

describe('PortfolioGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders portfolio items and upload button', async () => {
    const { PortfolioGrid } = await import('../src/components/catalog/PortfolioGrid')
    const Wrapper = createWrapper()
    const onUpload = vi.fn()

    render(
      <Wrapper>
        <PortfolioGrid
          barberId="demo"
          items={[mockPortfolioItem]}
          onUpload={onUpload}
        />
      </Wrapper>,
    )

    expect(screen.getByTestId('portfolio-grid')).toBeInTheDocument()
    expect(screen.getByTestId('portfolio-item')).toBeInTheDocument()
    expect(screen.getByTestId('portfolio-upload-button')).toBeInTheDocument()
  })

  it('calls onUpload when upload button is clicked', async () => {
    const { PortfolioGrid } = await import('../src/components/catalog/PortfolioGrid')
    const Wrapper = createWrapper()
    const onUpload = vi.fn()

    render(
      <Wrapper>
        <PortfolioGrid barberId="demo" items={[]} onUpload={onUpload} />
      </Wrapper>,
    )

    fireEvent.click(screen.getByTestId('portfolio-upload-button'))
    expect(onUpload).toHaveBeenCalledOnce()
  })
})
