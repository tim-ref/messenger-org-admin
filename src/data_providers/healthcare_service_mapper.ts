/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import isEqual from "lodash/fp/isEqual";
import {
  AvailableTime,
  CodableConcept,
  Endpoint,
  FhirResourceWithId,
  ServiceProvisionCode,
} from "./fhir_types";
import { EndpointVisibility } from "./fhir/extensions";

export type CreateHcsRequest = {
  name: string;
  endpoints?: [EndpointView];
};

type EndpointView = {
  endpoint_name: string;
  endpoint_address: string;
  connectionType: string;
  endpoint_hide_from_insurees: boolean;
};
type SavedEndpointView = EndpointView & { endpoint_id: string };

// our view representation of a HCS with multiple endpoints
type ViewHcs = {
  id: string;
  name: string;
  organization_name: string;
  organization_id: string;
  endpoints: [SavedEndpointView];

  // Indices der selektierten Enum ServiceProvisionCode
  serviceProvisionCode: number[];
  appointmentRequired: boolean;
  communication: { language: string }[];
  telecom: { system: string; use: string; value: string }[];
  availabilityExceptions?: string;
  availableTime?: {
    daysOfWeek: string;
    availableStartTime: string;
    availableEndTime: string;
  }[];
  locationId: string;
};
export const mapFhirHcsToViewHcs = (hcs: FhirResourceWithId): ViewHcs => {
  return {
    id: hcs.id,
    name: hcs.name,
    organization_name: hcs.providedBy.name,
    organization_id: hcs.providedBy.id,
    endpoints: hcs.endpoint?.map(mapFhirEndpointToViewEndpoint) ?? [],
    serviceProvisionCode: (hcs.serviceProvisionCode ?? []).map(
      mapFhirServiceProvisionCodeToView
    ),
    appointmentRequired: hcs.appointmentRequired ?? false,
    communication: (hcs.communication ?? []).map(it => ({
      language: it.coding[0].code,
    })),
    telecom: (hcs.telecom ?? []).map(it => ({
      system: it.system,
      use: it.use,
      value: it.value,
    })),
    availabilityExceptions: hcs.availabilityExceptions,
    availableTime: (hcs.availableTime ?? []).map((at: AvailableTime) => ({
      daysOfWeek: at.daysOfWeek?.join(",") ?? [],
      availableEndTime: at.availableEndTime,
      availableStartTime: at.availableStartTime,
    })),
    locationId: hcs.location[0]?.id,
  };
};

function mapFhirEndpointToViewEndpoint(endpoint: Endpoint): SavedEndpointView {
  return {
    endpoint_id: endpoint.id,
    endpoint_name: endpoint.name,
    endpoint_address: endpoint.address,
    connectionType: endpoint.connectionType.code,
    endpoint_hide_from_insurees:
      endpoint.extension?.some(isEqual(EndpointVisibility.hideVersicherte)) ===
      true,
  };
}

// "cost"  => 0
const serviceProvisionCodeIndexByEnumMap = new Map(
  Object.values(ServiceProvisionCode).map((code, index) => [code, index])
);

const mapFhirServiceProvisionCodeToView = (e: CodableConcept) => {
  if (e.coding.length !== 1) {
    console.warn("unexpected coding length!");
  }

  const name = e.coding[0].code as ServiceProvisionCode;
  return serviceProvisionCodeIndexByEnumMap.get(name);
};

// 0 => "cost
const serviceProvisionCodeByIndexMap = new Map(
  Object.values(ServiceProvisionCode).map((code, index) => [index, code])
);

export const serviceProvisionCodeByIndex = (
  index: number
): ServiceProvisionCode => serviceProvisionCodeByIndexMap.get(index);

export const serviceProvisionCodeChoices = () =>
  Object.values(ServiceProvisionCode).map((code, index) => ({
    id: index,
    name: code,
  }));
