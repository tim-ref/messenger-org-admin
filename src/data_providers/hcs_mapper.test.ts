/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { mapFhirHcsToViewHcs, serviceProvisionCodeByIndex } from "./hcs_mapper";
import { aFhirHCSResponse } from "./hcs_testdata";
import { ServiceProvisionCode } from "./fhir_types";

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
});
