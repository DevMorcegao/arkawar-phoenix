describe('Authentication Tests', () => {
  beforeEach(() => {
    cy.clearFirebaseAuth()
    cy.visit('/login')
    // Esperar a tela de loading desaparecer
    cy.get('[data-testid="theme-loading-screen"]').should('exist')
    cy.get('[data-testid="theme-loading-screen"]', { timeout: 5000 }).should('not.exist')
  })

  it('should show login form by default', () => {
    cy.get('[data-testid="login-tab"]').should('have.attr', 'data-state', 'active')
    cy.get('[data-testid="register-tab"]').should('have.attr', 'data-state', 'inactive')
  })

  it('should switch between login and register forms', () => {
    // Verificar estado inicial
    cy.get('[data-testid="login-tab"]').should('have.attr', 'data-state', 'active')
    cy.get('[data-testid="login-form"]').should('be.visible')
    cy.get('[data-testid="register-form"]').should('not.be.visible')

    // Mudar para registro
    cy.get('[data-testid="register-tab"]').click()
    cy.get('[data-testid="register-tab"]').should('have.attr', 'data-state', 'active')
    cy.get('[data-testid="login-tab"]').should('have.attr', 'data-state', 'inactive')
    cy.get('[data-testid="register-form"]').should('be.visible')
    cy.get('[data-testid="login-form"]').should('not.be.visible')

    // Voltar para login
    cy.get('[data-testid="login-tab"]').click()
    cy.get('[data-testid="login-tab"]').should('have.attr', 'data-state', 'active')
    cy.get('[data-testid="register-tab"]').should('have.attr', 'data-state', 'inactive')
    cy.get('[data-testid="login-form"]').should('be.visible')
    cy.get('[data-testid="register-form"]').should('not.be.visible')
  })

  it('should login successfully with correct credentials', () => {
    cy.mockFirebaseAuthSuccess()

    cy.get('[data-testid="email-input"]').type('test@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()

    // Esperar pela requisição de login
    cy.wait('@signInRequest').its('response.statusCode').should('eq', 200)
    
    // Esperar pela requisição do Firestore
    cy.wait('@getUserDoc').its('response.statusCode').should('eq', 200)

    // Verificar redirecionamento
    cy.url().should('include', '/parties')
  })

  it('should show error message with wrong credentials', () => {
    cy.mockFirebaseAuthError('auth/wrong-password')

    cy.get('[data-testid="email-input"]').type('test@example.com')
    cy.get('[data-testid="password-input"]').type('wrongpassword')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@signInError')
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Senha incorreta')
  })

  it('should show loading state during authentication', () => {
    cy.mockFirebaseAuthLoadingState()

    cy.get('[data-testid="email-input"]').type('test@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()

    cy.get('[data-testid="loading-spinner"]').should('be.visible')
    cy.get('[data-testid="login-button"]').should('be.disabled')
  })

  it('should register new user successfully', () => {
    cy.mockFirebaseRegisterSuccess()

    // Mudar para o formulário de registro
    cy.get('[data-testid="register-tab"]').click()

    // Preencher formulário
    cy.get('[data-testid="register-email-input"]').type('newuser@example.com')
    cy.get('[data-testid="register-password-input"]').type('password123')
    cy.get('[data-testid="register-name-input"]').type('New User')
    cy.get('[data-testid="register-button"]').click()

    // Esperar pela requisição de registro
    cy.wait('@signUpRequest').its('response.statusCode').should('eq', 200)

    // Verificar redirecionamento
    cy.url().should('include', '/parties')
  })

  it('should handle too many requests error', () => {
    cy.mockFirebaseAuthError('auth/too-many-requests')

    cy.get('[data-testid="email-input"]').type('test@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@signInError')
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Muitas tentativas de login. Tente novamente mais tarde')
  })
})
