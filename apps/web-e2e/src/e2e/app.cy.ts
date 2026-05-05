import { getHomePage } from '../support/app.po';

describe('web-app-e2e', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    // Verify that the welcome message is displayed
    getHomePage().contains(/Hello, World!/);
  });
});
