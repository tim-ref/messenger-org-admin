/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("createHcs", (name, endpoints, additionalArgs) => {
  startGroup("create new HCS");

  cy.get('a[href="#/healthcare_services"]').click();
  cy.get("#react-admin-title").should("have.text", "Healthcare services");
  cy.contains("Create").click();

  cy.get("#name").type(name);

  if (endpoints) {
    let index = 0;
    endpoints.forEach(ep => {
      cy.get("button.button-add-endpoints").click();

      cy.get(`#endpoints\\[${index}\\]\\.endpoint_name`).type(ep.name);
      cy.get(`#endpoints\\[${index}\\]\\.endpoint_address`).type(ep.address);

      index++;
    });
  }

  if (additionalArgs) {
    if (additionalArgs.serviceProvisionCode) {
      // open select box
      cy.get("#serviceProvisionCode").click();

      // check items
      additionalArgs.serviceProvisionCode.forEach(code => {
        cy.get("#menu-serviceProvisionCode li[role=option]")
          .contains(code)
          .click();
      });

      // click into foreground to close select box
      cy.get("#menu-serviceProvisionCode").click();
    }
  }

  cy.contains("Save").click();

  // wait for url to update (to edit view)
  cy.url().should("not.match", /.*\/#\/healthcare_services\/$/);
  cy.url().should("not.match", /.*\/#\/healthcare_services\/create$/);

  // check if id and name match
  cy.url().then(url => {
    const hcsId = url.split("/#/healthcare_services/")[1];
    cy.get("#id").should("have.value", hcsId);
    cy.get("#name").should("have.value", name);
  });

  cy.endGroup();
});

Cypress.Commands.add("hcsListOne", hcsName => {
  cy.get('a[href="#/healthcare_services"]').click();
  cy.get("#react-admin-title").should("have.text", "Healthcare services");

  // back on list view
  cy.get("[name='name:contains']").type(hcsName);

  cy.get("tr[resource=healthcare_services] td.column-name").should(
    "have.length",
    1
  );
});

Cypress.Commands.add("browserLogin", () => {
  startGroup("login via Browser");

  cy.visit("http://localhost:3000");

  // login form
  const username = Cypress.env("ORG_ADMIN_USERNAME");
  cy.get("input[name=username]").type(username);

  const password = Cypress.env("ORG_ADMIN_PASSWORD");
  cy.get("input[name=password]").type(password);

  const homeserverUrl = Cypress.env("HOME_SERVER_URL");
  cy.get("input[name=base_url]").type(homeserverUrl);

  cy.get("button[type=submit]").click();

  cy.get('a[href="#/users"]').click();

  // users page
  cy.get("#react-admin-title").should("have.text", "Users");

  cy.endGroup();
});

Cypress.Commands.add("apiLogin", () => {
  startGroup("Login via API");

  cy.visit("http://localhost:3000");

  const homeserverUrl = Cypress.env("HOME_SERVER_URL");
  const loginUrl = `${homeserverUrl}/_matrix/client/v3/login`;
  cy.request("POST", loginUrl, {
    device_id: null,
    initial_device_display_name: "Synapse Admin",
    type: "m.login.password",
    user: Cypress.env("ORG_ADMIN_USERNAME"),
    password: Cypress.env("ORG_ADMIN_PASSWORD"),
  }).then(response => {
    window.localStorage.setItem("access_token", response.body.access_token);
    cy.visit("/#/users");
  });

  // users page
  cy.get("#react-admin-title").should("have.text", "Users");

  cy.endGroup();
});

Cypress.Commands.add("editHcs", (hcsName, endpoints) => {
  startGroup("begin edit HCS");

  cy.hcsListOne(hcsName);

  cy.get("tr[resource=healthcare_services] td.column-name").first().click();

  if (endpoints) {
    let index = 0;
    endpoints.forEach(ep => {
      cy.get("button.button-add-endpoints").click();

      cy.get(`#endpoints\\[${index}\\]\\.endpoint_name`).type(ep.name);
      cy.get(`#endpoints\\[${index}\\]\\.endpoint_address`).type(ep.address);

      index++;
    });
  }

  cy.contains("Save").click();

  // wait for url to update (to list view)
  cy.url().should("match", /.*\/#\/healthcare_services$/);

  cy.endGroup();
});

// https://j1000.github.io/blog/2022/10/27/enhanced_cypress_logging.html
Cypress.Commands.add("endGroup", () => {
  collapseLastGroup();
  Cypress.log({ groupEnd: true, emitOnly: true } as any);
});

const startGroup = name => {
  Cypress.log({
    displayName: name,
    groupStart: true,
  } as any);
};

function collapseLastGroup() {
  const openExpanders = window.top.document.getElementsByClassName(
    "command-expander-is-open"
  );
  const numExpanders = openExpanders.length;
  const el = openExpanders[numExpanders - 1];

  if (el) el.parentElement.click();
}

// don't remove! https://stackoverflow.com/questions/35758584/cannot-redeclare-block-scoped-variable
export {};
