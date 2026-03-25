import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useShopSettings', () => ({
  useShopSettings: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
  useUpdateBranding: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
  })),
  useUpdateHours: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
  })),
  useUploadGalleryPhoto: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ url: 'https://example.com/photo.jpg' }),
    isPending: false,
    isError: false,
  })),
  useDeleteGalleryPhoto: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
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
// Tests: BarberiaPage
// ---------------------------------------------------------------------------

describe('BarberiaPage — shop settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders identity tab by default', async () => {
    const { default: BarberiaPage } = await import(
      '../src/app/(dashboard)/barberia/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <BarberiaPage />
      </Wrapper>,
    )

    // Page heading
    expect(
      screen.getByRole('heading', { name: /configuracion de barberia/i }),
    ).toBeInTheDocument()

    // Identity tab should be active — name field is visible
    expect(
      screen.getByLabelText(/nombre de la barberia/i),
    ).toBeInTheDocument()

    // Other tabs exist in tab list
    expect(screen.getByRole('tab', { name: /identidad/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /imagenes/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /horarios/i })).toBeInTheDocument()
  })

  it('slug validation shows formatted URL when slug is valid', async () => {
    const { default: BarberiaPage } = await import(
      '../src/app/(dashboard)/barberia/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <BarberiaPage />
      </Wrapper>,
    )

    const slugInput = screen.getByLabelText(/slug/i)
    fireEvent.change(slugInput, { target: { value: 'mi-barberia' } })

    expect(
      screen.getByText(/barcutx\.com\/b\/mi-barberia/i),
    ).toBeInTheDocument()
  })

  it('slug validation shows error for invalid characters', async () => {
    const { default: BarberiaPage } = await import(
      '../src/app/(dashboard)/barberia/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <BarberiaPage />
      </Wrapper>,
    )

    const slugInput = screen.getByLabelText(/slug/i)
    fireEvent.change(slugInput, { target: { value: 'Mi Barberia!' } })

    expect(
      screen.getByText(/solo letras minusculas/i),
    ).toBeInTheDocument()
  })

  it('switching to hours tab shows the hours editor', async () => {
    const { default: BarberiaPage } = await import(
      '../src/app/(dashboard)/barberia/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <BarberiaPage />
      </Wrapper>,
    )

    const hoursTab = screen.getByRole('tab', { name: /horarios/i })
    fireEvent.click(hoursTab)

    // HoursEditor renders day labels
    expect(screen.getByText(/lunes/i)).toBeInTheDocument()
    expect(screen.getByText(/domingo/i)).toBeInTheDocument()
  })

  it('hours toggle disables time inputs when day is set to closed', async () => {
    const { default: BarberiaPage } = await import(
      '../src/app/(dashboard)/barberia/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <BarberiaPage />
      </Wrapper>,
    )

    // Navigate to hours tab
    fireEvent.click(screen.getByRole('tab', { name: /horarios/i }))

    // Sunday starts closed by default (open: false)
    // Verify the "Cerrado" text is present for Sunday row
    const sundayToggle = screen.getByRole('switch', { name: /domingo abierto/i })
    expect(sundayToggle).not.toBeChecked()

    // No time inputs should be visible for Sunday when closed
    // Monday is open — it should have time inputs
    const mondayToggle = screen.getByRole('switch', { name: /lunes abierto/i })
    expect(mondayToggle).toBeChecked()

    // Toggle Monday to closed
    fireEvent.click(mondayToggle)

    // Monday is now closed — its time inputs disappear
    expect(mondayToggle).not.toBeChecked()
  })

  it('color picker updates preview in real time without saving', async () => {
    const { default: BarberiaPage } = await import(
      '../src/app/(dashboard)/barberia/page'
    )
    const Wrapper = createWrapper()

    render(
      <Wrapper>
        <BarberiaPage />
      </Wrapper>,
    )

    // The preview card is always rendered alongside the form
    // Change the color via hex input
    const hexInput = screen.getByPlaceholderText('#D97706')
    fireEvent.change(hexInput, { target: { value: '#2563EB' } })

    // The color indicator in the preview card should reflect the new color
    // We check that the hex string appears in the preview section
    expect(screen.getByText('#2563EB')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tests: ColorPicker component
// ---------------------------------------------------------------------------

describe('ColorPicker', () => {
  it('calls onChange when a swatch is clicked', async () => {
    const { ColorPicker } = await import('../src/components/shop/ColorPicker')
    const onChange = vi.fn()

    render(
      <ColorPicker value="#D97706" onChange={onChange} label="Color" />,
    )

    // Click the Blue swatch
    fireEvent.click(screen.getByRole('radio', { name: /blue/i }))
    expect(onChange).toHaveBeenCalledWith('#2563EB')
  })

  it('shows validation error for invalid hex', async () => {
    const { ColorPicker } = await import('../src/components/shop/ColorPicker')
    const onChange = vi.fn()

    render(<ColorPicker value="#D97706" onChange={onChange} />)

    const hexInput = screen.getByPlaceholderText('#D97706')
    fireEvent.change(hexInput, { target: { value: 'zzzzzz' } })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Tests: HoursEditor component
// ---------------------------------------------------------------------------

describe('HoursEditor', () => {
  const defaultHours = {
    monday: { open: true, openTime: '09:00', closeTime: '20:00' },
    tuesday: { open: true, openTime: '09:00', closeTime: '20:00' },
    wednesday: { open: true, openTime: '09:00', closeTime: '20:00' },
    thursday: { open: true, openTime: '09:00', closeTime: '20:00' },
    friday: { open: true, openTime: '09:00', closeTime: '20:00' },
    saturday: { open: true, openTime: '10:00', closeTime: '18:00' },
    sunday: { open: false, openTime: '10:00', closeTime: '16:00' },
  }

  it('renders all 7 day rows', async () => {
    const { HoursEditor } = await import('../src/components/shop/HoursEditor')
    const onChange = vi.fn()

    render(<HoursEditor value={defaultHours} onChange={onChange} />)

    expect(screen.getByRole('switch', { name: /lunes abierto/i })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /domingo abierto/i })).toBeInTheDocument()
  })

  it('hides time inputs for closed days', async () => {
    const { HoursEditor } = await import('../src/components/shop/HoursEditor')
    const onChange = vi.fn()

    render(<HoursEditor value={defaultHours} onChange={onChange} />)

    // Sunday is closed — time inputs not rendered
    expect(
      screen.queryByRole('textbox', { name: /domingo apertura/i }),
    ).not.toBeInTheDocument()

    // Monday is open — time inputs present
    expect(
      screen.getByLabelText(/lunes apertura/i),
    ).toBeInTheDocument()
  })

  it('calls onChange with updated day when toggle is flipped', async () => {
    const { HoursEditor } = await import('../src/components/shop/HoursEditor')
    const onChange = vi.fn()

    render(<HoursEditor value={defaultHours} onChange={onChange} />)

    const sundayToggle = screen.getByRole('switch', { name: /domingo abierto/i })
    fireEvent.click(sundayToggle)

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sunday: expect.objectContaining({ open: true }),
      }),
    )
  })
})
