/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import Client, { FhirResource } from "fhir-kit-client";
import { telematikId, withClient } from "../services/owner_client";
import { Identifier, SortPayload } from "react-admin";
import {
  AvailableTime,
  AvailableTimeInternal,
  Bundle,
  CodableConcept,
  DayOfWeek,
  FhirResourceWithId,
  HealthcareService,
  ServiceProvisionCode,
  Specialty,
  Telecom,
} from "./fhir_types";
import { ConnectionTypes, Origin } from "./fhir/codings";
import {
  createEndpoint,
  deleteEndpoint,
  updateEndpoint,
} from "./endpoint_crud";

const parseServiceProvisionCode = (
  serviceProvisionCode?: ServiceProvisionCode[]
): CodableConcept[] =>
  (serviceProvisionCode ?? []).map(code => ({
    coding: [
      {
        system:
          "http://terminology.hl7.org/CodeSystem/service-provision-conditions",
        code,
      },
    ],
  }));

const parseSpeciality = (speciality?: Specialty[]): CodableConcept[] =>
  (speciality ?? []).map(code => ({
    coding: [
      {
        system:
          "https://gematik.de/fhir/directory/ValueSet/HealthcareServiceSpecialtyVS",
        code,
      },
    ],
  }));

const parseCommunication = (communication?: string[]): CodableConcept[] =>
  (communication ?? []).map(code => ({
    coding: [
      {
        system: "http://terminology.hl7.org/5.1.0/CodeSystem-v3-ietf3066.html",
        code,
      },
    ],
  }));

type OptionalCreateUpdateHcsArgs = {
  serviceProvisionCode?: ServiceProvisionCode[];
  speciality?: Specialty[];
  appointmentRequired?: boolean;
  communication?: string[];
  telecom?: Telecom[];
  availableTime?: AvailableTimeInternal[];
  notAvailable?: string;
  availabilityExceptions?: string;
  locationId?: string;
};

const parseAvailableTime = (
  value?: AvailableTimeInternal[]
): {
  availableTime?: AvailableTime[];
} => {
  if (!value) {
    return { availableTime: [] };
  }
  return {
    availableTime: value.map(availableTime => ({
      daysOfWeek: availableTime.daysOfWeek
        .split(",")
        .map(it => it as DayOfWeek),
      availableStartTime: availableTime.availableStartTime,
      availableEndTime: availableTime.availableEndTime,
    })),
  };
};

const parseAvailabilityExceptions = (
  value?: string
): {
  availabilityExceptions?: string;
} => {
  if (!value) {
    return {};
  }
  return { availabilityExceptions: value };
};

export const createHCS = async (
  name: string,
  organizationReference: string,
  locationReference: string,
  endpointReferences: string[],
  optionalArgs?: OptionalCreateUpdateHcsArgs
): Promise<HealthcareService> => {
  if (optionalArgs?.locationId) {
    throw Error("not supported to set alternative location during create!");
  }

  const endpoint = endpointReferences.map(e => ({
    reference: e,
  }));

  const serviceProvisionCode: CodableConcept[] = parseServiceProvisionCode(
    optionalArgs?.serviceProvisionCode
  );

  const specialty: CodableConcept[] = parseSpeciality(optionalArgs?.speciality);

  const appointmentRequired = optionalArgs?.appointmentRequired;

  const request = {
    resourceType: "HealthcareService",
    body: {
      name: name,
      resourceType: "HealthcareService",
      providedBy: {
        reference: organizationReference,
      },
      meta: {
        tag: Origin.owner,
        profile: [
          "https://gematik.de/fhir/directory/StructureDefinition/HealthcareServiceDirectory",
        ],
      },
      location: [
        {
          reference: locationReference,
        },
      ],
      endpoint,
      serviceProvisionCode,
      specialty,
      appointmentRequired,
      ...parseAvailableTime(optionalArgs?.availableTime),
      ...parseAvailabilityExceptions(optionalArgs?.availabilityExceptions),
    },
  };

  return await withClient(
    async client => (await client.create(request)) as HealthcareService
  );
};

export const deleteHCS = async (id: string): Promise<void> =>
  await withClient(async client => {
    const read = await client.read({ id, resourceType: "HealthcareService" });

    await client.delete({ id, resourceType: "HealthcareService" });

    // we prefer orphaned endpoints to broken hcs, therefor we delete the hcs first
    await Promise.all(
      (read.endpoint ?? [])
        .map(endpoint => endpoint.reference.split("/")[1])
        .map((locationId: string) => deleteEndpoint(locationId))
    );
  });

export const countHCS = async (): Promise<number> => {
  return await withClient(async client => {
    const result = await client.resourceSearch({
      resourceType: "HealthcareService",
      searchParams: {},
    });

    return result.entry.filter(
      (r: FhirResourceWithId) => r.resource.resourceType === "HealthcareService"
    ).length;
  });
};

export const searchHCS = async (
  // https://build.fhir.org/search.html
  filter: {
    _id?: Identifier;
    "name:contains"?: string;
  } = {},
  sort?: SortPayload
): Promise<FhirResourceWithId[]> =>
  withClient(async client => {
    const sortPrefix = sort?.order === "DESC" ? "-" : "";

    const searchParams = {
      _include: ["Endpoint:*", "Organization:*", "Location:*"],
      _sort: !!sort ? `${sortPrefix}${sort.field}` : [],
      "organization.identifier": await telematikId(),

      ...filter,
    };

    return await extractHealthcareServicesFromSearchResults(
      client,
      (await client.resourceSearch({
        resourceType: "HealthcareService",
        searchParams,
      })) as Bundle
    );
  });

export const findOrganizationAndLocationId = async (): Promise<{
  organizationId: string;
  locationId: string;
}> => {
  const tId = await telematikId();
  const bundle = (await withClient(
    async client =>
      await client.resourceSearch({
        resourceType: "HealthcareService",
        searchParams: {
          _include: ["Organization:*", "Location:*"],
          "organization.identifier": tId,
        },
      })
  )) as Bundle;
  if (bundle.total === 0) {
    throw new Error(`no results for telematikId ${tId} from token`);
  }

  let organizationId;
  let locationId;

  bundle.entry.forEach(entry => {
    if (entry.resource.resourceType === "Location") {
      locationId = entry.resource.id;
    }
    if (entry.resource.resourceType === "Organization") {
      organizationId = entry.resource.id;
    }
  });

  if (!organizationId)
    throw Error(`No organization id found for telematikId ${tId}`);
  if (!locationId) throw Error(`No location id found for telematikId ${tId}`);

  return { organizationId, locationId };
};

export const updateHcsWithEndpoints = async (
  data: {
    id: string;
    name: string;
    endpoints: {
      endpoint_id?: string;
      endpoint_address: string;
      endpoint_name: string;
      connectionType: ConnectionTypes;
      endpoint_hide_from_insurees: boolean;
    }[];
  },
  optionalArgs?: OptionalCreateUpdateHcsArgs
) => {
  // find original HCS
  const hcsList = await searchHCS({
    _id: data.id,
  });
  if (hcsList.length !== 1) {
    throw Error(
      `Did not find exactly one HCS by id ${data.id} but ${hcsList.length}`
    );
  }
  const originalHCS = hcsList[0];

  const updatedEndpointIds = await Promise.all(
    data.endpoints.map(async e => {
      if (e.endpoint_id) {
        await updateEndpoint({
          id: e.endpoint_id,
          name: e.endpoint_name,
          address: e.endpoint_address,
          connectionType: e.connectionType,
          hide_from_insurees: e.endpoint_hide_from_insurees,
        });
        return e.endpoint_id;
      } else {
        // create new endpoint
        const r = await createEndpoint(
          e.endpoint_name,
          e.endpoint_address,
          e.connectionType,
          e.endpoint_hide_from_insurees
        );
        return r.id;
      }
    })
  );

  // remember original endpoint ids
  const originalEndpointsIds = originalHCS.endpoint?.map(
    endpoint => endpoint.id
  );

  const toBeDeletedIds = originalEndpointsIds.filter(
    ep => !updatedEndpointIds.some(x => x === ep)
  );

  const updatedEndpointRefs = updatedEndpointIds.map(ep => `Endpoint/${ep}`);

  // replace all endpoints in HCS
  await updateHCS(
    {
      id: data.id,
      name: data.name,
      endpointReferences: updatedEndpointRefs,
    },
    optionalArgs
  );

  // delete old endpoints
  await Promise.all(toBeDeletedIds.map(deleteEndpoint));
};

export const updateHCS = async (
  data: {
    id: string;
    name: string;
    endpointReferences: string[];
  },
  optionalArgs?: OptionalCreateUpdateHcsArgs
) => {
  await withClient(async client => {
    const hcsList = await searchHCS({
      _id: data.id,
    });

    if (hcsList.length !== 1) {
      throw Error(
        `Did not find exactly one HCS by id ${data.id} but ${hcsList.length}`
      );
    }

    const hcs = hcsList[0];
    const endpoint = data.endpointReferences.map(value => ({
      reference: value,
    }));

    const serviceProvisionCode: CodableConcept[] = parseServiceProvisionCode(
      optionalArgs?.serviceProvisionCode
    );

    const appointmentRequired = optionalArgs?.appointmentRequired;

    const communication: CodableConcept[] = parseCommunication(
      optionalArgs?.communication
    );

    const telecom: Telecom[] = optionalArgs?.telecom ?? [];

    const request = {
      resourceType: "HealthcareService",
      id: data.id,
      body: {
        ...hcs,
        name: data.name,
        providedBy: {
          reference: `Organization/${hcs.providedBy.id}`,
        },
        endpoint,
        serviceProvisionCode,
        appointmentRequired,
        communication,
        telecom,
        ...parseLocation(optionalArgs?.locationId),
        ...parseAvailableTime(optionalArgs?.availableTime),
        ...parseAvailabilityExceptions(optionalArgs?.availabilityExceptions),
      },
    };

    const result = await client.update(request);
    console.info(`HCS ${data.id} updated`, request, result);
  });
};

const parseLocation = (locationId?: string) => {
  if (!locationId) {
    return { location: [] };
  }

  return { location: [{ reference: `Location/${locationId}` }] };
};

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Extracts HealthcareService resources from a Bundle, and fetches referenced Endpoint resources.
 * @param client – FHIR client
 * @param bundle
 */
async function extractHealthcareServicesFromBundle(
  client: Client,
  bundle: Bundle
): Promise<FhirResourceWithId[]> {
  const healthcareServices: FhirResourceWithId[] = [];
  for (const entry of bundle.entry ?? []) {
    const resource = entry.resource;
    if (resource.resourceType === "HealthcareService") {
      healthcareServices.push(
        await resolveResourceReferences(resource, client, bundle)
      );
    }
  }
  return healthcareServices;
}

/**
 * Extract/GET HealthcareService resources from a search result (searchset distributed across paged Bundles).
 * @param client – FHIR client
 * @param bundle - the initial searchset Bundle
 */
async function extractHealthcareServicesFromSearchResults(
  client: Client,
  bundle: Bundle
): Promise<FhirResourceWithId[]> {
  let pagedBundle = Object.assign({}, bundle);
  const healthcareServices: FhirResourceWithId[] =
    await extractHealthcareServicesFromBundle(client, bundle);
  while (pagedBundle.link?.find((e: any) => e.relation === "next")) {
    healthcareServices.push(
      ...(await extractHealthcareServicesFromBundle(client, bundle))
    );
    pagedBundle = (await client.nextPage({ bundle: pagedBundle })) as Bundle;
  }
  return healthcareServices;
}

/**
 * Resolves referenced (providedBy, location, endpoint) resources in the provided HealthcareService.
 * @param healthcareService – HealthcareService resource
 * @param client – FHIR client
 * @param context – Context for Client.resolve()
 */
async function resolveResourceReferences(
  healthcareService: FhirResourceWithId,
  client: Client,
  context: FhirResource
): Promise<FhirResourceWithId> {
  const derefd: FhirResourceWithId = {
    ...healthcareService,
    endpoint: [],
    location: [],
    providedBy: {},
  };
  for (const endpoint of healthcareService.endpoint ?? []) {
    derefd.endpoint.push(
      await client.resolve({
        reference: endpoint.reference,
        context,
      })
    );
  }
  for (const location of healthcareService.location ?? []) {
    derefd.location.push(
      await client.resolve({
        reference: location.reference,
        context,
      })
    );
  }
  derefd.providedBy = await client.resolve({
    reference: healthcareService.providedBy.reference,
    context,
  });
  return derefd;
}
