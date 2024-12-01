import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Auth from '../Auth'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from 'next-themes'

// Mock do Firebase
vi.mock('@/lib/firebase')

// Mock dos hooks
vi.mock('@/contexts/AuthContext')
vi.mock('next/navigation')
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('Auth Component', () => {
  const mockLogin = vi.fn()
  const mockRegister = vi.fn()
  const mockPush = vi.fn()
  const originalConsoleError = console.error

  beforeEach(() => {
    vi.clearAllMocks()
    // Silencia console.error durante os testes
    console.error = vi.fn()
    
    // Mock do useAuth
    ;(useAuth as any).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      user: null,
      error: { message: '', context: null },
      clearError: vi.fn(),
      isAuthenticating: false
    })

    // Mock do useRouter
    ;(useRouter as any).mockReturnValue({
      push: mockPush
    })
  })

  afterEach(() => {
    // Restaura console.error após cada teste
    console.error = originalConsoleError
  })

  it('deve renderizar o componente corretamente', () => {
    render(
      <ThemeProvider>
        <Auth />
      </ThemeProvider>
    )

    expect(screen.getByText('ARKA WAR GUILD PHOENIX')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Registro')).toBeInTheDocument()
  })

  it('deve fazer login com credenciais válidas', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce(undefined)
    
    // Mock do useAuth com login bem sucedido
    ;(useAuth as any).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      user: null,
      error: { message: '', context: null },
      clearError: vi.fn(),
      isAuthenticating: false
    })

    render(
      <ThemeProvider>
        <Auth />
      </ThemeProvider>
    )

    await user.type(screen.getByTestId('email-input'), 'teste@email.com')
    await user.type(screen.getByTestId('password-input'), 'senha123')

    const loginButton = screen.getByRole('button', { name: /entrar/i })
    await user.click(loginButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('teste@email.com', 'senha123')
    })
  })

  it('deve mostrar erro quando o login falhar', async () => {
    const user = userEvent.setup()
    const mockError = { message: 'Credenciais inválidas', context: 'login' }
    
    // Mock do useAuth com erro
    ;(useAuth as any).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      user: null,
      error: mockError,
      clearError: vi.fn(),
      isAuthenticating: false
    })

    mockLogin.mockRejectedValueOnce(new Error('Login failed'))

    render(
      <ThemeProvider>
        <Auth />
      </ThemeProvider>
    )

    await user.type(screen.getByPlaceholderText('seu@email.com'), 'teste@email.com')
    await user.type(screen.getByLabelText('Senha'), 'senha123')

    const loginButton = screen.getByRole('button', { name: /entrar/i })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('error-text')).toHaveTextContent('Credenciais inválidas')
    })
  })

  it('deve fazer registro com dados válidos', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValueOnce(undefined)
    
    // Mock do useAuth para registro
    ;(useAuth as any).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      user: null,
      error: { message: '', context: null },
      clearError: vi.fn(),
      isAuthenticating: false
    })

    render(
      <ThemeProvider>
        <Auth />
      </ThemeProvider>
    )

    // Mudar para a aba de registro
    await user.click(screen.getByTestId('register-tab'))

    // Preencher o formulário
    await user.type(screen.getByTestId('register-email'), 'teste@email.com')
    await user.type(screen.getByTestId('register-password'), 'senha123')
    await user.type(screen.getByTestId('register-confirm-password'), 'senha123')
    await user.type(screen.getByTestId('register-name'), 'Teste User')

    // Submeter o formulário
    const registerButton = screen.getByRole('button', { name: /registrar/i })
    await user.click(registerButton)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'teste@email.com',
        'senha123',
        'Teste User',
        'senha123'
      )
    })
  })
})
