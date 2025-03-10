/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { getOwnerToken } from "./get_owner_token.test";
import { anEndpointAddress, aString } from "../test_data";
import {
  createEndpoint,
  deleteEndpoint,
  findEndpointById,
  updateEndpoint,
} from "./endpoint_crud";
import { EndpointVisibility } from "./fhir/extensions";
import { EndpointDirectoryConnectionType } from "./fhir/codings";

const process_before = process.env;
beforeAll(async () => {
  localStorage.setItem("owner", await getOwnerToken());
  process.env.REACT_APP_VZD = "https://fhir-directory-ref.vzd.ti-dienste.de";
});

afterAll(() => {
  process.env = process_before;
});

describe("vzd ru integration test", () => {
  jest.setTimeout(10_000);

  it("can find endpoint by id", async () => {
    const name = aString("endpoint name");
    const address = anEndpointAddress("me", "homeserver");
    const connectionType = "tim";
    const endpoint = await createEndpoint(name, address, connectionType, false);

    const foundEndpoint = await findEndpointById(endpoint.id);

    expect(foundEndpoint).toBeObject();
    expect(foundEndpoint).toHaveProperty("resourceType", "Endpoint");
    expect(foundEndpoint).toHaveProperty("status", "active");
    expect(foundEndpoint).toHaveProperty(
      "connectionType",
      EndpointDirectoryConnectionType("tim")
    );
    expect(foundEndpoint).toHaveProperty("name", name);
    expect(foundEndpoint).toHaveProperty("payloadType");
    expect(foundEndpoint).toHaveProperty("address", address);
    expect(foundEndpoint).not.toHaveProperty("extension");

    await deleteEndpoint(endpoint.id);

    await expect(findEndpointById(endpoint.id)).resolves.toBeFalsy();
  });

  it("can update endpoint", async () => {
    const originalName = aString("endpoint-name");
    const originalAddress = anEndpointAddress("me", "homeserver.com");
    const originalConnectionType = "tim";
    const endpoint = await createEndpoint(
      originalName,
      originalAddress,
      originalConnectionType,
      false
    );

    const newName = aString("new-name");
    const newAddress = anEndpointAddress("new", "homeserver.com");
    const newConnectionType = "tim-fa";

    const updatedEndpoint = await updateEndpoint({
      id: endpoint.id,
      name: newName,
      address: newAddress,
      connectionType: newConnectionType,
      hide_from_insurees: true,
    });

    expect(updatedEndpoint).toBeObject();
    expect(updatedEndpoint).toHaveProperty("resourceType", "Endpoint");
    expect(updatedEndpoint).toHaveProperty("status", "active");
    expect(updatedEndpoint).toHaveProperty(
      "connectionType",
      EndpointDirectoryConnectionType("tim-fa")
    );
    expect(updatedEndpoint).toHaveProperty("name", newName);
    expect(updatedEndpoint).toHaveProperty("payloadType");
    expect(updatedEndpoint).toHaveProperty("address", newAddress);
    expect(updatedEndpoint).toHaveProperty("extension", [
      EndpointVisibility.hideVersicherte,
    ]);

    await expect(deleteEndpoint(updatedEndpoint.id)).resolves.toBeUndefined();
  });
});
