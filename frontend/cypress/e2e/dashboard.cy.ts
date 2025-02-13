describe("Dashboard Page", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "http://127.0.0.1:8000/pdfs", { fixture: "pdfs.json" }).as("fetchPDFs");
    cy.visit("http://localhost:5173/");
    cy.wait("@fetchPDFs");
  });

  it("should display the dashboard header", () => {
    cy.contains("Code Challenge Dashboard").should("be.visible");
  });

  it("should display the welcome message", () => {
    cy.contains("Welcome to the Dashboard").should("be.visible");
  });

  it("should display the logout button", () => {
    cy.contains("button", "Logout").should("be.visible");
  });

  it("should display the file drop zone", () => {
    cy.get('[data-testid="dropzone"]').should("be.visible");
  });

  it("should display the PDF table", () => {
    cy.get("table").should("be.visible");
  });

  it("should have table headers", () => {
    cy.get("table thead tr")
      .should("be.visible")
      .within(() => {
        cy.contains("TITLE").should("be.visible");
        cy.contains("SIZE").should("be.visible");
        cy.contains("TOTAL PAGES").should("be.visible");
      });
  });
  it("should display the file drop zone", () => {
    cy.get('[data-testid="dropzone"]').should("be.visible");
  });

});