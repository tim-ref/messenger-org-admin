/*
 * Copyright (C) 2023 - 2024 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import {
  countHCS,
  createEndpoint,
  createHCS,
  deleteEndpoint,
  deleteHCS,
  findEndpointById,
  findOrganizationAndLocationId,
  searchHCS,
  updateEndpoint,
  updateHCS,
  updateHcsWithEndpoints,
} from "./healthcareservice_crud";
import { getOwnerToken } from "./get_owner_token.test";
import { anEndpointAddress, aString } from "../test_data";
import {
  HealthcareService,
  ServiceProvisionCode,
  Specialty,
} from "./fhir_types";

const process_before = process.env;
beforeAll(async () => {
  localStorage.setItem("owner", await getOwnerToken());
  process.env.REACT_APP_VZD = "https://fhir-directory-ref.vzd.ti-dienste.de";
});

afterAll(() => {
  process.env = process_before;
});

describe("vzd ru integration test", () => {
  const locationId = "e8d967d8-c419-45df-93eb-fcd36c9eda95";
  const organizationReference =
    "Organization/2e7059e0-ffd7-4233-b986-87681104bf0c";
  const locationReference = "Location/" + locationId;

  describe("searchHcs", () => {
    it("can get HealthcareService list", async () => {
      const searchResult = await searchHCS(
        {},
        {
          field: "name",
          order: "ASC",
        }
      );

      expect(searchResult).not.toBeNull();
      expect(searchResult.length).toBeGreaterThan(0);
      expect(searchResult[0].id).toBeTruthy();
      expect(searchResult[0].resourceType).toBe("HealthcareService");
      expect(searchResult[0].endpoint).not.toBeUndefined();
    });

    it("can filter", async () => {
      const endpoint_name = aString("endpoint-name");
      const endpoint_address = anEndpointAddress(
        endpoint_name,
        "homeserver.com"
      );
      const endpoint = await createEndpoint(endpoint_name, endpoint_address);

      const endpointReference = ["Endpoint/" + endpoint.id];
      const hcsName = aString("hcs-name");

      const result = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        endpointReference
      );

      const searchResult = await searchHCS({
        "name:contains": hcsName,
      });

      expect(searchResult).toPartiallyContain({ id: result.id });
      expect(searchResult.length).toBe(1);
    });
  });

  it("can count HCS", async () => {
    await expect(countHCS()).resolves.toBeGreaterThan(0);
  });

  describe("hcs", () => {
    it("can create and delete HealthcareService without endpoints", async () => {
      const endpointReference = [];
      const hcsName = aString("hcs-name");

      const result = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        endpointReference
      );
      expect(result.resourceType).toBe("HealthcareService");

      const createdHcs = await singleHcsByName(hcsName);

      expect(createdHcs.endpoint).toHaveLength(0);
      expect(createdHcs.endpoint).toBeEmpty();

      await deleteHCS(createdHcs.id);

      expect(await searchHcsByName(hcsName)).toBeEmpty();
    });

    it("hcs appointmentRequired", async () => {
      const hcsName = aString();

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        [],
        {}
      );

      expect(hcs.appointmentRequired).toBeUndefined();

      await updateHCS(
        { id: hcs.id, name: hcsName, endpointReferences: [] },
        { appointmentRequired: false, locationId }
      );
      const up1 = await singleHcsByName(hcsName);
      expect(up1.appointmentRequired).toBeFalsy();

      await updateHCS(
        { id: hcs.id, name: hcsName, endpointReferences: [] },
        { appointmentRequired: true, locationId }
      );
      const up2 = await singleHcsByName(hcsName);
      expect(up2.appointmentRequired).toBeTruthy();

      await deleteHCS(hcs.id);
    });

    it("hcs location", async () => {
      const hcsName = aString();

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        [],
        {}
      );

      expect(hcs.appointmentRequired).toBeUndefined();

      await updateHCS(
        { id: hcs.id, name: hcsName, endpointReferences: [] },
        {}
      );
      const updatedHcs = await singleHcsByName(hcsName);
      expect(updatedHcs.location).toStrictEqual([]);

      await deleteHCS(hcs.id);
    });

    it("hcs communication", async () => {
      const hcsName = aString();

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        [],
        {}
      );

      expect(hcs.communication).toBeUndefined();

      await updateHCS(
        { id: hcs.id, name: hcsName, endpointReferences: [] },
        { communication: ["deutsch", "english"], locationId }
      );
      const updated = await singleHcsByName(hcsName);
      expect(updated.communication).toHaveLength(2);
      expect(updated.communication.map(e => e.coding[0].code)).toContain(
        "deutsch"
      );
      expect(updated.communication.map(e => e.coding[0].code)).toContain(
        "english"
      );

      await deleteHCS(hcs.id);
    });

    it("hcs availability", async () => {
      const hcsName = aString();

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        [],
        {}
      );

      await updateHCS(
        { id: hcs.id, name: hcsName, endpointReferences: [] },
        {
          availableTime: [
            {
              daysOfWeek: "mon,tue,wed,thu,fri",
              availableStartTime: "10:00:00",
              availableEndTime: "14:00:00",
            },
          ],
          availabilityExceptions: "During summer holiday",
          locationId,
        }
      );

      const updated = await singleHcsByName(hcsName);
      expect(updated.availableTime).toPartiallyContain({
        daysOfWeek: ["mon", "tue", "wed", "thu", "fri"],
        availableStartTime: "10:00:00",
        availableEndTime: "14:00:00",
      });
      expect(updated.availabilityExceptions).toBe("During summer holiday");

      await deleteHCS(hcs.id);
    });

    it("can create and delete HealthcareService with multiple endpoints", async () => {
      const endpoint_name = aString("endpoint-name");
      const endpoint_name2 = aString("endpoint-name2");
      const endpoint_address = anEndpointAddress("me", "homeserver.com");
      const endpoint_address2 = anEndpointAddress("me2", "homeserver.com");

      const endpoint = await createEndpoint(endpoint_name, endpoint_address);
      const endpoint2 = await createEndpoint(endpoint_name2, endpoint_address2);
      const endpointReference = [
        "Endpoint/" + endpoint.id,
        "Endpoint/" + endpoint2.id,
      ];
      const hcsName = aString("hcs-name");

      const result = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        endpointReference
      );
      expect(result.resourceType).toBe("HealthcareService");

      const createdHcs = await singleHcsByName(hcsName);

      expect(createdHcs.endpoint).toHaveLength(2);
      expect(createdHcs.endpoint).toPartiallyContain({
        name: endpoint_name,
        address: endpoint_address,
      });
      expect(createdHcs.endpoint).toPartiallyContain({
        name: endpoint_name2,
        address: endpoint_address2,
      });

      await deleteHCS(createdHcs.id);

      expect(await searchHcsByName(hcsName)).toBeEmpty();
    });

    it("HCS serviceProvisionCode", async () => {
      const endpointReferences = [];
      const hcsName = aString("hcs-name");

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        endpointReferences,
        {
          serviceProvisionCode: [
            ServiceProvisionCode.disc,
            ServiceProvisionCode.free,
          ],
        }
      );

      expect(hcs.serviceProvisionCode).toHaveLength(2);

      await updateHCS(
        {
          id: hcs.id,
          name: hcsName,
          endpointReferences,
        },
        {
          locationId,
          serviceProvisionCode: [
            ServiceProvisionCode.disc,
            ServiceProvisionCode.free,
            ServiceProvisionCode.cost,
          ],
        }
      );

      const updated = await singleHcsByName(hcsName);

      expect(updated.serviceProvisionCode).toHaveLength(3);

      await deleteHCS(hcs.id);
    });

    it("HCS.speciality may not be set", async () => {
      /*
      Die Speciality darf abhängig von der Sync-Ressource gewählt werden.
      Also immer nur eine Teilmenge der Eltern-Ressource.
       */

      const endpointReferences = [];
      const hcsName = aString("hcs-name");

      try {
        await createHCS(
          hcsName,
          organizationReference,
          locationReference,
          endpointReferences,
          {
            speciality: [Specialty.ALLG],
          }
        );

        fail("should not come here!");
      } catch (e) {
        expect(e.response.status).toBe(400);
        expect(e.response.data.issue).toContainEqual(
          expect.objectContaining({
            diagnostics:
              "speciality does not match with speciality from VZD-Sync",
          })
        );
      }
    });

    it("update HCS name", async () => {
      const hcsName = aString("hcs-name");

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        []
      );

      const updatedName = aString("updated-name");
      await updateHCS(
        {
          id: hcs.id,
          name: updatedName,
          endpointReferences: [],
        },
        { locationId }
      );

      const updatedHcs = await singleHcsByName(updatedName);

      expect(updatedHcs.name).toBe(updatedName);

      await deleteHCS(hcs.id);

      expect(await searchHcsByName(hcsName)).toBeEmpty();
    });

    it("update HCS endpoints", async () => {
      const endpoint_name = aString("new name");
      const endpoint_address = anEndpointAddress("other", "homeserver.com");

      const endpoint = await createEndpoint(
        aString("old name"),
        anEndpointAddress()
      );
      const endpoint2 = await createEndpoint(endpoint_name, endpoint_address);

      const hcsName = aString("hcs-name");

      const result = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        [`Endpoint/${endpoint.id}`]
      );

      await updateHCS(
        {
          id: result.id,
          name: hcsName,
          endpointReferences: [`Endpoint/${endpoint2.id}`],
        },
        { locationId }
      );

      const createdHcs = await singleHcsByName(hcsName);

      expect(createdHcs.endpoint).toHaveLength(1);
      expect(createdHcs.endpoint).toPartiallyContain({
        name: endpoint_name,
        address: endpoint_address,
      });

      await deleteHCS(result.id);
      await deleteEndpoint(endpoint.id);

      expect(await searchHcsByName(hcsName)).toBeEmpty();
    });

    it("can update HCS with new endpoints", async () => {
      const hcsName = aString("hcs-name");

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        []
      );

      await updateHcsWithEndpoints({
        id: hcs.id,
        name: hcs.name,
        endpoints: [
          {
            endpoint_name: aString(),
            endpoint_address: anEndpointAddress(),
          },
          {
            endpoint_name: aString(),
            endpoint_address: anEndpointAddress(),
          },
        ],
      });

      const updated = await searchHcsByName(hcs.name);

      expect(updated).toHaveLength(1);
      expect(updated[0].endpoint).toHaveLength(2);

      await deleteHCS(hcs.id);
    });

    it("can update HCS with updated endpoints", async () => {
      const endpoint_name = aString("new name");

      const endpoint = await createEndpoint(
        aString("old name"),
        anEndpointAddress()
      );
      const endpoint2 = await createEndpoint(
        endpoint_name,
        anEndpointAddress()
      );

      const hcsName = aString("hcs-name");

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        [`Endpoint/${endpoint.id}`, `Endpoint/${endpoint2.id}`]
      );

      await updateHcsWithEndpoints({
        id: hcs.id,
        name: hcs.name,
        endpoints: [
          {
            endpoint_id: endpoint.id,
            endpoint_name: "name 1",
            endpoint_address: anEndpointAddress("updated1", "address"),
          },
          {
            endpoint_id: endpoint2.id,
            endpoint_name: "name 2",
            endpoint_address: anEndpointAddress("updated2", "address"),
          },
        ],
      });

      const updated = await searchHcsByName(hcs.name);

      console.log("Updated", updated[0].endpoint);

      expect(updated).toHaveLength(1);
      expect(updated[0].endpoint).toHaveLength(2);
      expect(updated[0].endpoint).toPartiallyContain({
        id: endpoint.id,
        name: "name 1",
        address: anEndpointAddress("updated1", "address"),
      });

      expect(updated[0].endpoint).toPartiallyContain({
        id: endpoint2.id,
        name: "name 2",
        address: anEndpointAddress("updated2", "address"),
      });

      await deleteHCS(hcs.id);
    });

    it("can update HCS with deleted endpoints", async () => {
      const endpoint = await createEndpoint(aString(), anEndpointAddress());
      const endpoint2 = await createEndpoint(aString(), anEndpointAddress());

      const hcsName = aString("hcs-name");

      const hcs = await createHCS(
        hcsName,
        organizationReference,
        locationReference,
        [`Endpoint/${endpoint.id}`, `Endpoint/${endpoint2.id}`]
      );

      await updateHcsWithEndpoints({
        id: hcs.id,
        name: hcs.name,
        endpoints: [
          {
            endpoint_id: endpoint2.id,
            endpoint_name: aString(),
            endpoint_address: anEndpointAddress(),
          },
        ],
      });

      const updated = await searchHcsByName(hcs.name);

      expect(updated).toHaveLength(1);
      expect(updated[0].endpoint).toHaveLength(1);
      expect(updated[0].endpoint).toPartiallyContain({
        id: endpoint2.id,
      });

      await expect(findEndpointById(endpoint.id)).resolves.toBeFalsy();

      await deleteHCS(hcs.id);
    });
  });

  it("can find organization and location by telematikId", async () => {
    const result = await findOrganizationAndLocationId();
    expect(result).toBeTruthy();
    expect(result.organizationId).toBeTruthy();
    expect(result.locationId).toBeTruthy();
  });

  describe("endpoints", () => {
    it("can find endpoint by id", async () => {
      const endpoint = await createEndpoint(
        aString("endpoint name"),
        anEndpointAddress("me", "homeserver")
      );
      await expect(findEndpointById(endpoint.id)).resolves.toBeTruthy();

      await deleteEndpoint(endpoint.id);

      await expect(findEndpointById(endpoint.id)).resolves.toBeFalsy();
    });

    it("can update endpoint", async () => {
      const endpoint_name = aString("endpoint-name");
      const endpoint_address = anEndpointAddress("me", "homeserver.com");
      const endpoint = await createEndpoint(endpoint_name, endpoint_address);

      const name = aString("new-name");
      const address = anEndpointAddress("new", "homeserver.com");

      const updatedEndpoint = await updateEndpoint({
        id: endpoint.id,
        name,
        address,
      });

      expect(updatedEndpoint.name).toBe(name);
      expect(updatedEndpoint.address).toBe(address);

      await expect(deleteEndpoint(updatedEndpoint.id)).resolves.toBeUndefined();
    });
  });
});

const singleHcsByName = async (name: string): Promise<HealthcareService> => {
  const result = await searchHcsByName(name);

  expect(
    result,
    `Failed to find exactly one HCS by name '${name}'.`
  ).toHaveLength(1);

  return result[0];
};

const searchHcsByName = async (name: string): Promise<HealthcareService[]> => {
  const searchResult = await searchHCS(
    { "name:contains": name },
    {
      field: "name",
      order: "ASC",
    }
  );

  return searchResult as HealthcareService[];
};
