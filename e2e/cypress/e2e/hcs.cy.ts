/*
 * Copyright (C) 2023 - 2024 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { aString } from "./utils";

describe("Healthcare services", () => {
  beforeEach("before all tests login", () => {
    cy.apiLogin();
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
      { name: "my endpoint", address: "matrix:u/mxid:server" },
    ]);
    cy.hcsListOne(hcsName);

    cy.get("tr[resource=healthcare_services] td.column-name").first().click();

    cy.contains("Delete").click();
  });

  it("can create HCS and add endpoints and delete HCS", () => {
    const hcsName = aString("HCS");

    cy.createHcs(hcsName, []);

    cy.editHcs(hcsName, [
      { name: "my endpoint", address: "matrix:u/mxid:server" },
      { name: "my endpoint2", address: "matrix:u/mxid2:server" },
    ]);

    cy.hcsListOne(hcsName);

    cy.get("tr[resource=healthcare_services] td.column-name").first().click();

    cy.get("#endpoints\\[0\\]\\.endpoint_name").should(
      "have.value",
      "my endpoint"
    );
    cy.get("#endpoints\\[0\\]\\.endpoint_address").should(
      "have.value",
      "matrix:u/mxid:server"
    );
    cy.get("#endpoints\\[1\\]\\.endpoint_name").should(
      "have.value",
      "my endpoint2"
    );
    cy.get("#endpoints\\[1\\]\\.endpoint_address").should(
      "have.value",
      "matrix:u/mxid2:server"
    );

    cy.contains("Delete").click();
  });
});
