/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import {
  formatEndpoint,
  hcsDataProvider,
  mxIdToUri,
  uriToMxId,
} from "./healthcare_service_data_provider";
import {
  countHCS,
  createHCS,
  deleteHCS,
  findOrganizationAndLocationId,
  searchHCS,
  updateHcsWithEndpoints,
} from "./healthcare_service_crud";
import { aFhirHCSResponse } from "./healthcare_service_testdata";
import { aString } from "../test_data";
import { HcsForm } from "../components/Hcs";
import { ServiceProvisionCode } from "./fhir_types";
import synapseDataProvider from "../synapse/dataProvider";
import { createEndpoint } from "./endpoint_crud";

jest.mock("./healthcare_service_crud", () => ({
  searchHCS: jest.fn(),
  deleteHCS: jest.fn(),
  createHCS: jest.fn(),
  findOrganizationAndLocationId: jest.fn(),
  countHCS: jest.fn(),
  updateHcsWithEndpoints: jest.fn(),
}));

jest.mock("./endpoint_crud", () => ({
  createEndpoint: jest.fn(),
}));

jest.mock("../synapse/dataProvider", () => ({
  getOne: jest.fn(),
}));

const searchHCSMock = searchHCS as jest.MockedFn<typeof searchHCS>;
const countHCSMock = countHCS as jest.MockedFn<typeof countHCS>;
const deleteHCSMock = deleteHCS as jest.MockedFn<typeof deleteHCS>;
const createHCSMock = createHCS as jest.MockedFn<typeof createHCS>;
const updateHcsWithEndpointsMock = updateHcsWithEndpoints as jest.MockedFn<
  typeof updateHcsWithEndpoints
>;

const getOneMock = synapseDataProvider.getOne as jest.MockedFn<
  typeof synapseDataProvider.getOne
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
    getOneMock.mockReset();
  });

  describe("tim-fa Endpoints", () => {
    it("maps mxId ←→ uri", async () => {
      const mxId = "@user:server.invalid";
      expect(mxIdToUri(mxId)).toBe("matrix:u/user:server.invalid");
      expect(uriToMxId(mxIdToUri(mxId))).toBe(mxId);
    });

    it("uses User.displayname as Endpoint.name for tim-fa and tim-bot connection types", async () => {
      const def = await formatEndpoint({
        endpoint_name: "default",
        connectionType: "tim",
      });
      expect(def.endpoint_name).toBe("default");
      expect(def.connectionType).toBe("tim");

      await expect(
        formatEndpoint({
          endpoint_name: "tim-fa endpoint without address",
          connectionType: "tim-fa",
        })
      ).rejects.toThrow(`tim-fa Endpoint needs an endpoint_address`);

      getOneMock.mockResolvedValueOnce({
        data: {
          displayname: "displayname of user",
        },
      });
      const timfa = await formatEndpoint({
        endpoint_name: "should be ignored due to tim-fa",
        endpoint_address: "matrix:u/user:server.invalid",
        connectionType: "tim-fa",
      });
      expect(getOneMock).toHaveBeenCalledWith("users", {
        id: "@user:server.invalid",
      });
      expect(timfa.endpoint_name).toBe("displayname of user");
      expect(timfa.connectionType).toBe("tim-fa");

      getOneMock.mockResolvedValueOnce({
        data: {
          displayname: "Bender",
        },
      });
      const timbot1 = await formatEndpoint({
        endpoint_name: "should be ignored due to tim-bot",
        endpoint_address: "matrix:u/user:server.invalid",
        connectionType: "tim-bot",
      });
      expect(getOneMock).toHaveBeenCalledWith("users", {
        id: "@user:server.invalid",
      });
      // formatEndpoint forces (Chatbot) appendix…
      expect(timbot1.endpoint_name).toBe("Bender (Chatbot)");
      expect(timbot1.connectionType).toBe("tim-bot");

      getOneMock.mockResolvedValueOnce({
        data: {
          displayname: "Bender (Chatbot)",
        },
      });
      const timbot2 = await formatEndpoint({
        endpoint_name: "should be ignored due to tim-bot",
        endpoint_address: "matrix:u/user:server.invalid",
        connectionType: "tim-bot",
      });
      expect(getOneMock).toHaveBeenCalledWith("users", {
        id: "@user:server.invalid",
      });
      // …but doesn't add another appendix when already present.
      expect(timbot2.endpoint_name).toBe("Bender (Chatbot)");
      expect(timbot2.connectionType).toBe("tim-bot");
    });
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
            connectionType: "tim",
            endpoint_hide_from_insurees: false,
          },
          {
            endpoint_name: "my endpoint2 name",
            endpoint_address: "my endpoint2 address",
            connectionType: "tim",
            endpoint_hide_from_insurees: true,
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
        "my endpoint address",
        "tim",
        false
      );
      expect(createEndpointMock).toHaveBeenCalledWith(
        "my endpoint2 name",
        "my endpoint2 address",
        "tim",
        true
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
            connectionType: "tim",
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
              connectionType: "tim",
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
