/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataProvider, GetListParams, GetListResult } from "ra-core/src/types";
import {
  CreateParams,
  CreateResult,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  DeleteResult,
  GetManyParams,
  GetManyReferenceParams,
  GetManyReferenceResult,
  GetManyResult,
  GetOneParams,
  GetOneResult,
  UpdateManyParams,
  UpdateManyResult,
  UpdateParams,
  UpdateResult,
} from "react-admin";
import {
  countHCS,
  createEndpoint,
  createHCS,
  deleteHCS,
  findOrganizationAndLocationId,
  searchHCS,
  updateHcsWithEndpoints,
} from "./healthcareservice_crud";
import {
  CreateHcsRequest,
  mapFhirHcsToViewHcs,
  serviceProvisionCodeByIndex,
} from "./hcs_mapper";

export const hcsDataProvider: DataProvider = {
  getList: async (
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<any>> => {
    const elements = await searchHCS(params.filter, params.sort);

    const count = params.pagination.perPage;
    const offset = (params.pagination.page - 1) * count;
    const slice = elements
      .slice(offset, offset + count)
      .map(mapFhirHcsToViewHcs);
    return {
      data: slice,
      total: elements.length,
    };
  },

  getOne: async (
    resource: string,
    params: GetOneParams
  ): Promise<GetOneResult<any>> => {
    const elements = await searchHCS({
      _id: params.id,
    });

    if (elements.length === 0) {
      return { data: {} };
    }
    if (elements.length > 1) {
      throw new Error(`Absurd: want 1, got ${elements?.length} entries`);
    }
    const data = mapFhirHcsToViewHcs(elements[0]);

    return {
      data,
    };
  },

  getMany: async (
    resource: string,
    params: GetManyParams
  ): Promise<GetManyResult<any>> => {
    const elements = await searchHCS({
      _id: params.ids.join(","),
    });

    return {
      data: elements,
    };
  },
  getManyReference: async (
    resource: string,
    params: GetManyReferenceParams
  ): Promise<GetManyReferenceResult<any>> => {
    const elements = await searchHCS(
      Object.assign(
        {
          [params.target]: params.id,
        },
        params.filter
      ),
      params.sort
    );

    const count = params.pagination.perPage;
    const offset = (params.pagination.page - 1) * count;

    return {
      data: elements.slice(offset, offset + count),
      total: elements.length,
    };
  },

  update: async (
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<any>> => {
    console.log("update", params);

    const serviceProvisionCode = (params.data.serviceProvisionCode ?? []).map(
      serviceProvisionCodeByIndex
    );

    const appointmentRequired = params.data.appointmentRequired;

    const communication = (params.data.communication ?? []).map(
      e => e.language
    );

    await updateHcsWithEndpoints(
      {
        id: params.id as string,
        name: params.data.name,
        endpoints: params.data.endpoints,
      },
      {
        serviceProvisionCode,
        appointmentRequired,
        communication,
        telecom: params.data.telecom,
        availableTime: params.data.availableTime,
        availabilityExceptions: params.data.availabilityExceptions,
      }
    );

    return await hcsDataProvider.getOne(resource, { id: params.id });
  },

  updateMany: async (
    resource: string,
    params: UpdateManyParams
  ): Promise<UpdateManyResult> => {
    throw new Error("not implemented yet");
  },

  create: async (
    resource: string,
    params: CreateParams
  ): Promise<CreateResult<any>> => {
    console.log("create", params);

    const {
      organizationId,
      locationId,
    }: { organizationId: string; locationId: string } =
      await findOrganizationAndLocationId();
    const organizationReference = "Organization/" + organizationId;
    const locationReference = "Location/" + locationId;
    const request = params.data as CreateHcsRequest;

    const createEndpoints = (request.endpoints ?? []).map(async ep =>
      createEndpoint(ep.endpoint_name, ep.endpoint_address).then(
        e => `Endpoint/${e.id}`
      )
    );

    const endpointReferences = await Promise.all(createEndpoints);

    const serviceProvisionCode = (params.data.serviceProvisionCode ?? []).map(
      serviceProvisionCodeByIndex
    );

    const appointmentRequired = params.data.appointmentRequired;

    const createResult = await createHCS(
      request.name,
      organizationReference,
      locationReference,
      endpointReferences,
      { serviceProvisionCode, appointmentRequired }
    );

    return {
      data: createResult,
    };
  },

  delete: async (
    resource: string,
    params: DeleteParams
  ): Promise<DeleteResult<any>> => {
    const count = await countHCS();

    if (count === 1) {
      throw new Error("not allowed to delete last HCS!");
    }

    await deleteHCS(params.id as string);

    return { data: { id: params.id } };
  },

  deleteMany: async (
    resource: string,
    params: DeleteManyParams
  ): Promise<DeleteManyResult> => {
    await Promise.all(params.ids.map(id => deleteHCS(id as string)));

    return { data: params.ids };
  },
};
