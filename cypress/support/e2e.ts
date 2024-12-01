/// <reference types="cypress" />
import './commands'

// Configuração global do Cypress
Cypress.on('window:before:load', (win) => {
  // Aqui podemos adicionar configurações globais se necessário
})
