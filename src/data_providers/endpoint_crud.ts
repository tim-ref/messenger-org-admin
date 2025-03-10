/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { FhirResource } from "fhir-kit-client";
import { withClient } from "../services/owner_client";
import { FhirResourceWithId } from "./fhir_types";
import {
  addExtension,
  EndpointVisibility,
  removeExtension,
} from "./fhir/extensions";
import {
  ConnectionTypes,
  EndpointDirectoryConnectionType,
  EndpointDirectoryPayloadType,
  Origin,
} from "./fhir/codings";

/**
 * Create a FHIR Endpoint
 * @param name - Endpoint name
 * @param address - Endpoint address
 * @param connectionType
 * @param hide_from_insurees - Extension endpointVisibility
 * @see {@link https://www.hl7.org/fhir/R4/endpoint.html}
 */
export const createEndpoint = async (
  name: string,
  address: string,
  connectionType: ConnectionTypes = "tim",
  hide_from_insurees: boolean
): Promise<FhirResourceWithId> =>
  await withClient(async client => {
    const endpoint: FhirResource = {
      resourceType: "Endpoint",
      name,
      address,
      status: "active",
      meta: {
        tag: Origin.owner,
        profile: [
          "https://gematik.de/fhir/directory/StructureDefinition/EndpointDirectory",
        ],
      },
      connectionType: EndpointDirectoryConnectionType(connectionType),
      payloadType: [
        {
          coding: [EndpointDirectoryPayloadType.timChat],
        },
      ],
    };
    if (hide_from_insurees)
      addExtension(endpoint, EndpointVisibility.hideVersicherte);

    const request = {
      resourceType: "Endpoint",
      body: endpoint,
    };

    const response = (await client.create(request)) as FhirResourceWithId;

    console.info(`Endpoint created`, request, response);
    return response;
  });

export const deleteEndpoint = async (id: string): Promise<void> =>
  await withClient(async client => {
    try {
      const response = await client.delete({ id, resourceType: "Endpoint" });
      console.info(`Endpoint ${id} deleted`, response);
    } catch (e) {
      if (e.response.status === 410) {
        return;
      } else {
        throw e;
      }
    }
  });

/**
 * Update a FHIR Endpoint
 * @see {@link https://www.hl7.org/fhir/R4/endpoint.html}
 */
export const updateEndpoint = async (data: {
  id: string;
  name: string;
  address: string;
  connectionType: ConnectionTypes;
  hide_from_insurees: boolean;
}): Promise<FhirResource> =>
  await withClient(async client => {
    const endpoint = await client.read({
      id: data.id,
      resourceType: "Endpoint",
    });

    const endpointWithChanges = {
      ...endpoint,
      name: data.name,
      address: data.address,
      connectionType: EndpointDirectoryConnectionType(data.connectionType),
    };
    if (data.hide_from_insurees)
      addExtension(endpointWithChanges, EndpointVisibility.hideVersicherte);
    else
      removeExtension(endpointWithChanges, EndpointVisibility.hideVersicherte);

    const request = {
      id: data.id,
      resourceType: "Endpoint",
      body: endpointWithChanges,
    };

    const response = await client.update(request);
    console.info(`Endpoint ${data.id} updated`, request, response);
    return response;
  });

export const findEndpointById = async (id: string): Promise<FhirResource> => {
  return withClient(async client => {
    try {
      return await client.read({
        resourceType: "Endpoint",
        id,
      });
    } catch (e) {
      return null;
    }
  });
};
