/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { hcsDataProvider } from "./healthcareservice_dataprovider";
import {
  countHCS,
  createEndpoint,
  createHCS,
  deleteHCS,
  findOrganizationAndLocationId,
  searchHCS,
  updateHcsWithEndpoints,
} from "./healthcareservice_crud";
import { aFhirHCSResponse } from "./hcs_testdata";
import { aString } from "../test_data";
import { HcsForm } from "../components/Hcs";
import { ServiceProvisionCode } from "./fhir_types";

jest.mock("./healthcareservice_crud", () => ({
  searchHCS: jest.fn(),
  deleteHCS: jest.fn(),
  createHCS: jest.fn(),
  findOrganizationAndLocationId: jest.fn(),
  createEndpoint: jest.fn(),
  countHCS: jest.fn(),
  updateHcsWithEndpoints: jest.fn(),
}));

const searchHCSMock = searchHCS as jest.MockedFn<typeof searchHCS>;
const countHCSMock = countHCS as jest.MockedFn<typeof countHCS>;
const deleteHCSMock = deleteHCS as jest.MockedFn<typeof deleteHCS>;
const createHCSMock = createHCS as jest.MockedFn<typeof createHCS>;
const updateHcsWithEndpointsMock = updateHcsWithEndpoints as jest.MockedFn<
  typeof updateHcsWithEndpoints
>;

const findOrganizationAndLocationIdMock =
  findOrganizationAndLocationId as jest.MockedFn<
    typeof findOrganizationAndLocationId
  >;

const createEndpointMock = createEndpoint as jest.MockedFn<
  typeof createEndpoint
>;

const givenOrganizationAndLocation = (
  organizationId = "anOrganizationId",
  locationId = "anLocationId"
) =>
  findOrganizationAndLocationIdMock.mockReturnValue(
    Promise.resolve({
      organizationId,
      locationId,
    })
  );

const givenCreateEndpointSucceeds = () =>
  createEndpointMock.mockReturnValue(
    Promise.resolve({
      id: "anEndpointId",
      resourceType: "Endpoint",
    })
  );

describe("Healthcareservice Dataprovider", () => {
  beforeEach(() => {
    searchHCSMock.mockReset();
    deleteHCSMock.mockReset();
    createEndpointMock.mockReset();
    findOrganizationAndLocationIdMock.mockReset();
    countHCSMock.mockReset();
  });

  describe("create Hcs", () => {
    it("create without endpoints", async () => {
      givenOrganizationAndLocation();

      const form: HcsForm = { name: "my name" };

      await hcsDataProvider.create("hcs", {
        data: { ...form },
      });

      expect(createHCSMock).toHaveBeenCalledWith(
        "my name",
        expect.anything(),
        expect.anything(),
        [],
        expect.anything()
      );
    });

    it("create with optional args", async () => {
      givenOrganizationAndLocation();

      const form: HcsForm = { name: aString() };

      await hcsDataProvider.create("hcs", {
        data: { ...form, serviceProvisionCode: [0] },
      });

      expect(createHCSMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        [],
        { serviceProvisionCode: [ServiceProvisionCode.free] }
      );
    });

    it("create uses location and organization", async () => {
      givenOrganizationAndLocation("myOrganizationId", "myLocationId");

      const form: HcsForm = { name: aString() };

      await hcsDataProvider.create("hcs", {
        data: { ...form },
      });

      expect(createHCSMock).toHaveBeenCalledWith(
        expect.anything(),
        "Organization/myOrganizationId",
        "Location/myLocationId",
        expect.anything(),
        expect.anything()
      );
    });

    it("create with endpoints", async () => {
      givenOrganizationAndLocation();
      givenCreateEndpointSucceeds();

      const form: HcsForm = {
        name: "my name",
        endpoints: [
          {
            endpoint_name: "my endpoint name",
            endpoint_address: "my endpoint address",
          },
          {
            endpoint_name: "my endpoint2 name",
            endpoint_address: "my endpoint2 address",
          },
        ],
      };

      await hcsDataProvider.create("hcs", {
        data: { ...form },
      });

      expect(createHCSMock).toHaveBeenCalledWith(
        "my name",
        expect.anything(),
        expect.anything(),
        ["Endpoint/anEndpointId", "Endpoint/anEndpointId"],
        expect.anything()
      );
    });

    it("endpoints are created", async () => {
      givenOrganizationAndLocation();
      givenCreateEndpointSucceeds();

      const form: HcsForm = {
        name: "my name",
        endpoints: [
          {
            endpoint_name: "my endpoint name",
            endpoint_address: "my endpoint address",
          },
          {
            endpoint_name: "my endpoint2 name",
            endpoint_address: "my endpoint2 address",
          },
        ],
      };

      await hcsDataProvider.create("hcs", {
        data: {
          ...form,
        },
      });

      expect(createEndpointMock).toHaveBeenCalledWith(
        "my endpoint name",
        "my endpoint address"
      );
      expect(createEndpointMock).toHaveBeenCalledWith(
        "my endpoint2 name",
        "my endpoint2 address"
      );
    });
  });

  describe("delete", () => {
    it("can delete", async () => {
      countHCSMock.mockReturnValue(Promise.resolve(10));
      const result = await hcsDataProvider.delete("hcs", { id: "id" });

      expect(result.data.id).toBe("id");
      expect(deleteHCSMock).toHaveBeenCalled();
    });

    it("delete fails if there is only one HCS left", async () => {
      countHCSMock.mockReturnValue(Promise.resolve(1));
      await expect(hcsDataProvider.delete("hcs", { id: "id" })).rejects.toThrow(
        /last HCS/
      );
    });
  });

  it("delete many", async () => {
    const result = await hcsDataProvider.deleteMany("hcs", {
      ids: ["id1", "id2"],
    });

    expect(result.data).toContainValues(["id1", "id2"]);
    expect(deleteHCSMock).toHaveBeenCalledWith("id1");
    expect(deleteHCSMock).toHaveBeenCalledWith("id2");
  });

  it("get one", async () => {
    searchHCSMock.mockReturnValue(
      Promise.resolve([aFhirHCSResponse("name", "id")])
    );

    const result = await hcsDataProvider.getOne("hcs", { id: "id" });

    expect(result.data.id).toBe("id");
  });

  it("get many", async () => {
    searchHCSMock.mockReturnValue(
      Promise.resolve([{ resourceType: "foo", id: "id" }])
    );

    const result = await hcsDataProvider.getMany("hcs", {
      ids: ["id1", "id2"],
    });

    expect(result.data.length).toBe(1);
    expect(searchHCSMock).toHaveBeenCalledWith({ _id: "id1,id2" });
  });

  describe("getList", () => {
    it("result is paginated", async () => {
      searchHCSMock.mockReturnValue(
        Promise.resolve([
          aFhirHCSResponse(aString(), "id1"),
          aFhirHCSResponse(aString(), "id2"),
          aFhirHCSResponse(aString(), "id3"),
          aFhirHCSResponse(aString(), "id4"),
        ])
      );

      const params = {
        pagination: {
          page: 1,
          perPage: 2,
        },
        filter: {},
        sort: {
          field: "name",
          order: "ASC",
        },
      };

      const result1 = await hcsDataProvider.getList("hcs", params);
      expect(result1.total).toBe(4);
      expect(result1.data).toIncludeAllPartialMembers([
        { id: "id1" },
        { id: "id2" },
      ]);

      params.pagination.page = 2;
      const result2 = await hcsDataProvider.getList("hcs", params);
      expect(result2.total).toBe(4);
      expect(result2.data).toIncludeAllPartialMembers([
        { id: "id3" },
        { id: "id4" },
      ]);
    });

    it("can use filter", async () => {
      searchHCSMock.mockReturnValue(
        Promise.resolve([aFhirHCSResponse(aString(), "id1")])
      );

      const params = {
        pagination: {
          page: 1,
          perPage: 2,
        },
        filter: {
          "name:contains": "hcs name",
        },
        sort: {
          field: "name",
          order: "ASC",
        },
      };

      await hcsDataProvider.getList("hcs", params);

      expect(searchHCSMock).toHaveBeenCalledWith(
        {
          "name:contains": "hcs name",
        },
        { field: "name", order: "ASC" }
      );
    });
  });

  describe("getOne", () => {
    it("can get one", async () => {
      searchHCSMock.mockReturnValue(
        Promise.resolve([aFhirHCSResponse("name")])
      );

      const one = await hcsDataProvider.getOne("hcs", { id: "id" });

      expect(one.data.name).toBe("name");

      expect(searchHCSMock).toHaveBeenCalledWith({ _id: "id" });
    });
  });

  describe("update", () => {
    it("can update Hcs", async () => {
      searchHCSMock.mockReturnValue(
        Promise.resolve([aFhirHCSResponse("Old Name")])
      );

      type HcsView = HcsForm & {
        id: string;
        organization_name: string;
        organization_id: string;
        serviceProvisionCode?: number[];
        appointmentRequired: boolean;
        communication?: string[];
      };

      const oldState: HcsView = {
        id: aString(),
        name: "Name",
        endpoints: [],
        organization_name: aString(),
        organization_id: aString(),
        appointmentRequired: false,
      };

      const newState: HcsView = {
        ...oldState,
        serviceProvisionCode: [0],

        endpoints: [
          {
            endpoint_name: "Endpoint Name",
            endpoint_address: "Endpoint Address",
          },
        ],
      };

      await hcsDataProvider.update("hcs", {
        id: "myId",
        data: {
          ...newState,
        },
        previousData: {
          ...oldState,
        },
      });

      expect(updateHcsWithEndpointsMock).toHaveBeenCalledWith(
        {
          id: "myId",
          name: "Name",
          endpoints: [
            {
              endpoint_name: "Endpoint Name",
              endpoint_address: "Endpoint Address",
            },
          ],
        },
        {
          serviceProvisionCode: [ServiceProvisionCode.free],
          appointmentRequired: false,
          communication: [],
        }
      );
    });
  });
});
