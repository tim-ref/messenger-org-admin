/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { addExtension, EndpointVisibility } from "./fhir/extensions";
import { ServiceProvisionCode } from "./fhir_types";
import {
  mapFhirHcsToViewHcs,
  serviceProvisionCodeByIndex,
} from "./healthcare_service_mapper";
import { aFhirHCSResponse } from "./healthcare_service_testdata";

describe("hcs_mapper", () => {
  it("can map hcs to view", () => {
    const viewHcs = mapFhirHcsToViewHcs(aFhirHCSResponse("asdf"));

    expect(viewHcs).toEqual(
      expect.objectContaining({
        id: "c014695e-760f-4205-8e3b-39bdc59d5089",
        name: "asdf",
        endpoints: [
          {
            endpoint_name: "@name:homeserver.bar",
            endpoint_id: "f0ea8450-fe13-4796-85f9-afa4952465de",
            endpoint_address: "@name:homeserver.bar",
            connectionType: "tim",
            endpoint_hide_from_insurees: false,
          },
        ],
        organization_name: "Anzeigenamen",
        organization_id: "2e7059e0-ffd7-4233-b986-87681104bf0c",
      })
    );
  });

  it("can map hcs with hidden endpoint to view", () => {
    const healthcareService = aFhirHCSResponse("asdf");
    addExtension(
      healthcareService.endpoint[0],
      EndpointVisibility.hideVersicherte
    );
    const viewHcs = mapFhirHcsToViewHcs(healthcareService);

    expect(viewHcs).toEqual(
      expect.objectContaining({
        id: "c014695e-760f-4205-8e3b-39bdc59d5089",
        name: "asdf",
        endpoints: [
          {
            endpoint_name: "@name:homeserver.bar",
            endpoint_id: "f0ea8450-fe13-4796-85f9-afa4952465de",
            endpoint_address: "@name:homeserver.bar",
            connectionType: "tim",
            endpoint_hide_from_insurees: true,
          },
        ],
        organization_name: "Anzeigenamen",
        organization_id: "2e7059e0-ffd7-4233-b986-87681104bf0c",
      })
    );
  });

  it("serviceProvisionCode is mapped to selected indices", () => {
    const hcs = mapFhirHcsToViewHcs(aFhirHCSResponse("asdf"));

    expect(hcs).toEqual(
      expect.objectContaining({
        serviceProvisionCode: expect.arrayContaining([0, 2]),
      })
    );
  });

  it("can map serviceProvisionCode index to enum", () => {
    expect(serviceProvisionCodeByIndex(0)).toBe(ServiceProvisionCode.free);
    expect(serviceProvisionCodeByIndex(1)).toBe(ServiceProvisionCode.disc);
    expect(serviceProvisionCodeByIndex(2)).toBe(ServiceProvisionCode.cost);
  });

  it("maps endpoints' connection type code to connectionType in the view", () => {
    ["tim", "tim-fa", "tim-bot"].forEach(connectionType => {
      const viewTim = mapFhirHcsToViewHcs(
        aFhirHCSResponse("name", "id", connectionType)
      );
      expect(viewTim.endpoints).toHaveLength(1);
      expect(viewTim.endpoints[0].connectionType).toEqual(connectionType);
    });
  });
});
