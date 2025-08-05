/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { adminUserUri, aString } from "./utils";

describe("Healthcare services", () => {
  const homeserverWithoutHttps = `${Cypress.env("HOME_SERVER_URL")}`.replace(
    /^https?:\/\//,
    ""
  );
  beforeEach("before all tests login", () => {
    cy.browserLogin();
  });

  it("can create and delete HCS entry without endpoint", () => {
    const hcsName = aString("HCS");

    cy.createHcs(hcsName, []);
    cy.hcsListOne(hcsName);

    cy.get("tr[resource=healthcare_services] td input").first().click();
    cy.contains("Delete").click();
  });

  it("can create HCS with serviceProvisionCode", () => {
    const hcsName = aString("HCS");

    cy.createHcs(hcsName, [], { serviceProvisionCode: ["free", "disc"] });
    cy.hcsListOne(hcsName);

    cy.get("tr[resource=healthcare_services] td input").first().click();
    cy.contains("Delete").click();
  });

  it("can create and delete HCS entry with endpoint", () => {
    const hcsName = aString("HCS");

    cy.createHcs(hcsName, [
      {
        name: "my endpoint",
        address: `matrix:u/mxid:${homeserverWithoutHttps}`,
        connectionType: "tim",
      },
    ]);
    cy.hcsListOne(hcsName);

    cy.get("tr[resource=healthcare_services] td.column-name").first().click();

    cy.contains("Delete").click();
  });

  it("can create and delete HCS entry with tim, tim-fa, and tim-bot endpoint connection types", () => {
    const hcsName = aString("HCS");

    cy.createHcs(hcsName, [
      {
        name: "my tim endpoint",
        address: `matrix:u/mxid:${homeserverWithoutHttps}`,
        connectionType: "tim",
      },
      {
        name: "my tim-fa endpoint",
        address: adminUserUri(),
        connectionType: "tim-fa",
      },
      {
        name: "my tim-bot endpoint",
        address: adminUserUri(),
        connectionType: "tim-bot",
      },
    ]);
    cy.hcsListOne(hcsName);

    cy.get("tr[resource=healthcare_services] td.column-name").first().click();

    cy.contains("Delete").click();
  });
  it("can create HCS and add endpoints and delete HCS", () => {
    const hcsName = aString("HCS");

    cy.createHcs(hcsName, []);

    cy.editHcs(hcsName, [
      {
        name: "my endpoint",
        address: `matrix:u/mxid:${homeserverWithoutHttps}`,
        connectionType: "tim",
      },
      {
        name: "my endpoint2",
        address: `matrix:u/mxid2:${homeserverWithoutHttps}`,
        connectionType: "tim",
      },
      {
        name: "this should be ignored because tim-fa",
        address: adminUserUri(),
        connectionType: "tim-fa",
      },
      {
        name: "this should be ignored because tim-bot",
        address: adminUserUri(),
        connectionType: "tim-bot",
      },
    ]);

    cy.hcsListOne(hcsName);

    cy.get("tr[resource=healthcare_services] td.column-name").first().click();

    cy.get("#endpoints\\[0\\]\\.endpoint_name").should(
      "have.value",
      "my endpoint"
    );
    cy.get("#endpoints\\[0\\]\\.connectionType").should(
      "have.text",
      "TI-Messenger Endpoint"
    );
    cy.get("#endpoints\\[0\\]\\.endpoint_address_txt").should(
      "have.value",
      `matrix:u/mxid:${homeserverWithoutHttps}`.trim()
    );

    cy.get("#endpoints\\[1\\]\\.endpoint_name").should(
      "have.value",
      "my endpoint2"
    );
    cy.get("#endpoints\\[1\\]\\.connectionType").should(
      "have.text",
      "TI-Messenger Endpoint"
    );
    cy.get("#endpoints\\[1\\]\\.endpoint_address_txt").should(
      "have.value",
      `matrix:u/mxid2:${homeserverWithoutHttps}`.trim()
    );

    cy.get("#endpoints\\[2\\]\\.endpoint_name").should(
      "have.value",
      "Admin für Testtreiber"
    );
    cy.get("#endpoints\\[2\\]\\.connectionType").should(
      "have.text",
      "TI-Messenger Funktionsaccount"
    );
    cy.get("#endpoints\\[2\\]\\.endpoint_address_ref").should(
      "have.text",
      adminUserUri()
    );

    cy.get("#endpoints\\[3\\]\\.endpoint_name").should(
      "have.value",
      "Admin für Testtreiber (Chatbot)"
    );
    cy.get("#endpoints\\[3\\]\\.connectionType").should(
      "have.text",
      "TI-Messenger Chatbot"
    );
    cy.get("#endpoints\\[3\\]\\.endpoint_address_ref").should(
      "have.text",
      adminUserUri()
    );

    cy.contains("Delete").click();
    cy.contains("Confirm").click();
  });

  it("cannot add an endpoint outside of the organization to a hcs", () => {
    const hcsName = aString("HCS");
    cy.createHcs(hcsName, []);

    const endpoints = [
      { name: "my endpoint", address: `matrix:u/mxid:matrix.com` },
    ];

    cy.hcsListOne(hcsName);

    cy.get("tr[resource=healthcare_services] td.column-name").first().click();

    if (endpoints) {
      endpoints.forEach((ep, index) => {
        cy.get("button.button-add-endpoints").click();

        cy.get(`#endpoints\\[${index}\\]\\.endpoint_name`).type(ep.name);
        cy.get(`#endpoints\\[${index}\\]\\.endpoint_address_txt`).type(
          ep.address
        );
      });
    }
    cy.contains("Save").click();

    cy.contains("Endpoints can only be created for your organization").should(
      "contain.text",
      "Endpoints can only be created for your organization"
    );
    cy.contains("Delete").click();
  });
});
