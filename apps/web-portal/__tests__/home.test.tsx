import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '../src/app/page'

/**
 * HomePage smoke tests.
 * Verifies the landing page renders the brand name and navigation links
 * without throwing errors.
 */
describe('HomePage', () => {
  it('renders the BarcutX brand heading', () => {
    render(<HomePage />)
    const heading = screen.getByRole('heading', { name: /barcutx/i, level: 1 })
    expect(heading).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<HomePage />)
    expect(screen.getByText(/tu fade, sin fila/i)).toBeInTheDocument()
  })

  it('renders the login link', () => {
    render(<HomePage />)
    const loginLink = screen.getByRole('link', { name: /iniciar sesion/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('renders the register link', () => {
    render(<HomePage />)
    const registerLink = screen.getByRole('link', { name: /crear cuenta/i })
    expect(registerLink).toBeInTheDocument()
    expect(registerLink).toHaveAttribute('href', '/register')
  })
})
