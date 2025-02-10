describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/login')
  })

  it('should show login form', () => {
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.contains('button', 'Sign In').should('be.visible')
  })

  it('should show error message with invalid credentials', () => {
    cy.get('input[name="email"]').type('wrong@example.com')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.contains('button', 'Sign In').click()
    cy.contains('Login failed').should('be.visible')
  })

  it('should login successfully with correct credentials', () => {
    cy.get('input[name="email"]').type('demo@example.com')
    cy.get('input[name="password"]').type('demo123')
    cy.contains('button', 'Sign In').click()
    cy.url().should('eq', 'http://localhost:5173/')
    cy.contains('Welcome to the Dashboard').should('be.visible')
  })
}) 