Cypress.Commands.add("login", () => {
  cy.request({
    method: "POST",
    url: "http://127.0.0.1:8000/token",
    form: true,
    body: {
      username: "demo@example.com",
      password: "demo123",
    },
  }).then((response) => {
    window.localStorage.setItem("token", response.body.access_token);
  });
});