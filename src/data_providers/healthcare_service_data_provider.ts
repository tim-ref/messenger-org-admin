/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
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
  createHCS,
  deleteHCS,
  findOrganizationAndLocationId,
  searchHCS,
  updateHcsWithEndpoints,
} from "./healthcare_service_crud";
import {
  CreateHcsRequest,
  mapFhirHcsToViewHcs,
  serviceProvisionCodeByIndex,
} from "./healthcare_service_mapper";
import synapseDataProvider from "../synapse/dataProvider";
import cloneDeep from "lodash/cloneDeep";
import { createEndpoint } from "./endpoint_crud";

export function mxIdToUri(value: string): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(
    /@([a-zA-Z0-9.\-_=/]+):([a-zA-Z0-9.\-_]+:?[a-zA-Z0-9.\-_:]*)/
  );

  if (match?.length >= 3) {
    return `matrix:u/${match[1]}:${match.slice(2).join("")}`;
  } else {
    return null;
  }
}

export function uriToMxId(value: string): string | null {
  if (!value) {
    return null;
  }
  const match = value.match(
    /matrix:u\/([a-zA-Z0-9.\-_=/]+):([a-zA-Z0-9.\-_]+:?[a-zA-Z0-9.\-_:]*)/
  );

  if (match?.length >= 3) {
    return `@${match[1]}:${match.slice(2).join("")}`;
  } else {
    return null;
  }
}

export function connectionRefersToUser(connectionType?: string): boolean {
  return ["tim-fa", "tim-bot"].includes(connectionType);
}

export function maybeAppendChatbot(
  connectionType: "tim-fa" | "tim-bot",
  displayname?: string
): string {
  if (
    connectionType !== "tim-bot" ||
    !displayname ||
    displayname.match(/\(Chatbot\)$/)
  ) {
    return displayname;
  } else {
    return `${displayname} (Chatbot)`;
  }
}

/**
 * Handle connection type from the form. If tim-fa or tim-bot, load the User indicated by
 * endpoint_address to set Endpoint.name = User.displayname. In case of tim-bot,
 * "(Chatbot)" appendix is enforced.
 **/
export async function formatEndpoint(value) {
  const endpoint = cloneDeep(value);
  if (connectionRefersToUser(endpoint.connectionType)) {
    if (!value.endpoint_address) {
      throw new Error(
        `${endpoint.connectionType} Endpoint needs an endpoint_address`
      );
    }
    const mxid = uriToMxId(value.endpoint_address);
    if (!mxid) {
      throw new Error(
        `tim-fa: unable to resolve ${value.endpoint_address} to mxid`
      );
    }
    const user = await synapseDataProvider.getOne("users", { id: mxid });

    endpoint.endpoint_name = maybeAppendChatbot(
      endpoint.connectionType,
      user.data?.displayname
    );
  }
  return endpoint;
}

export const hcsDataProvider: DataProvider = {
  getList: async (
    _resource: string,
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
    _resource: string,
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
    _resource: string,
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
    _resource: string,
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
    const serviceProvisionCode = (params.data.serviceProvisionCode ?? []).map(
      serviceProvisionCodeByIndex
    );

    const appointmentRequired = params.data.appointmentRequired;

    const communication = (params.data.communication ?? []).map(
      e => e.language
    );
    const endpoints = await Promise.all(
      params.data?.endpoints?.map(formatEndpoint) ?? []
    );

    await updateHcsWithEndpoints(
      {
        id: params.id as string,
        name: params.data.name,
        endpoints: endpoints,
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
    _resource: string,
    _params: UpdateManyParams
  ): Promise<UpdateManyResult> => {
    throw new Error("not implemented yet");
  },

  create: async (
    _resource: string,
    params: CreateParams
  ): Promise<CreateResult<any>> => {
    const {
      organizationId,
      locationId,
    }: { organizationId: string; locationId: string } =
      await findOrganizationAndLocationId();
    const organizationReference = "Organization/" + organizationId;
    const locationReference = "Location/" + locationId;
    const request = params.data as CreateHcsRequest;

    const endpoints = await Promise.all(
      request.endpoints?.map(formatEndpoint) ?? []
    );

    const createEndpoints = (endpoints ?? []).map(ep =>
      createEndpoint(
        ep.endpoint_name,
        ep.endpoint_address,
        ep.connectionType,
        ep.endpoint_hide_from_insurees
      ).then(e => `Endpoint/${e.id}`)
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
    _resource: string,
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
    _resource: string,
    params: DeleteManyParams
  ): Promise<DeleteManyResult> => {
    await Promise.all(params.ids.map(id => deleteHCS(id as string)));

    return { data: params.ids };
  },
};
