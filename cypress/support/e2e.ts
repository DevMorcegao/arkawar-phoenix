/// <reference types="cypress" />
import './commands'

// Configuração global do Cypress
Cypress.on('window:before:load', (win) => {
  // Aqui podemos adicionar configurações globais se necessário
})

Cypress.on('uncaught:exception', (err) => {
  // Retornar false previne que o Cypress falhe o teste
  if (err.message.includes('auth/internal-error')) {
    return false
  }
  return true
})
