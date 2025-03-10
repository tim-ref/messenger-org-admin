/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { aString, adminUserUri } from "./utils";

describe("Healthcare services", () => {
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
        address: "matrix:u/mxid:server",
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
        address: "matrix:u/mxid:server",
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
        address: "matrix:u/mxid:server",
        connectionType: "tim",
      },
      {
        name: "my endpoint2",
        address: "matrix:u/mxid2:server",
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
      "matrix:u/mxid:server"
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
      "matrix:u/mxid2:server"
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
});
