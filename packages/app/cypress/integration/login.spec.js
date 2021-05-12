/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

describe('Login', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/catalog/entities**', {
      fixture: 'entities.json',
    });

    cy.intercept('GET', '**/guest', {
      fixture: 'guest.json',
    });
  });

  it('should render the login page', () => {
    cy.visit('/');
    cy.contains('Backstage Example App');
  });

  it('should be able to login', () => {
    cy.get('button').contains('Enter').click();
    cy.url().should('include', '/catalog');

    cy.contains('artist-lookup');
  });
});