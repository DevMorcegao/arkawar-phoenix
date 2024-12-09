import { logger } from '../../../lib/logger'

// Configurar interceptações do Firestore
export function setupFirestoreMocks() {
  logger.debug('FirestoreMock', 'Configurando mocks do Firestore')

  // Mock das requisições do Firestore Listen
  cy.intercept('POST', '**/google.firestore.v1.Firestore/Listen*', {
    delay: 300,
    statusCode: 200,
    body: {
      target_change: {
        target_change_type: 'NO_CHANGE',
        resume_token: 'mock-token'
      }
    }
  }).as('firestoreRequest')

  // Mock das requisições GET do canal do Firestore
  cy.intercept('GET', '**/google.firestore.v1.Firestore/Listen/channel*', {
    delay: 200,
    statusCode: 200,
    body: '1\n{"result":{"token":"mock-token"}}\n'
  }).as('firestoreChannel')

  // Mock das requisições BatchGet do Firestore
  cy.intercept('POST', '**/google.firestore.v1.Firestore/BatchGet*', {
    delay: 200,
    statusCode: 200,
    body: {
      found: [],
      missing: []
    }
  }).as('firestoreBatchGet')
}
