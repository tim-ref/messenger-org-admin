/*
 * Copyright (C) 2023 akquinet GmbH
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
  CodableConcept,
  DayOfWeek,
  FhirResourceWithId,
  HealthcareService,
  ServiceProvisionCode,
  Specialty,
  Telecom,
} from "./fhir_types";

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
        tag: {
          system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
          code: "owner",
        },
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

export const createEndpoint = async (
  name: string,
  address: string
): Promise<FhirResourceWithId> =>
  await withClient(async client => {
    return (await client.create({
      resourceType: "Endpoint",
      body: {
        resourceType: "Endpoint",
        name,
        address,
        status: "active",
        meta: {
          tag: {
            system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
            code: "owner",
          },
          profile: [
            "https://gematik.de/fhir/directory/StructureDefinition/EndpointDirectory",
          ],
        },
        connectionType: {
          code: "tim",
          system:
            "https://gematik.de/fhir/directory/CodeSystem/EndpointDirectoryConnectionType",
        },
        payloadType: [
          {
            coding: [
              {
                code: "tim-chat",
                system:
                  "https://gematik.de/fhir/directory/CodeSystem/EndpointDirectoryPayloadType",
              },
            ],
          },
        ],
      },
    })) as FhirResourceWithId;
  });

export const deleteHCS = async (id: string): Promise<void> =>
  await withClient(async client => {
    const read = await client.read({ id, resourceType: "HealthcareService" });

    await client.delete({ id, resourceType: "HealthcareService" });

    // we prefer orphaned endpoints to broken hcs, therfor we delete the hcs first
    await Promise.all(
      (read.endpoint ?? [])
        .map(endpoint => {
          return endpoint.reference.split("/")[1];
        })
        .map(locationId => {
          return deleteEndpoint(locationId);
        })
    );
  });

export const deleteEndpoint = async (id: string): Promise<void> =>
  await withClient(async client => {
    try {
      await client.delete({ id, resourceType: "Endpoint" });
    } catch (e) {
      if (e.response.status === 410) {
        return;
      } else {
        throw e;
      }
    }
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

    return await readPages(
      client,
      await client.resourceSearch({
        resourceType: "HealthcareService",
        searchParams,
      })
    );
  });

export const findOrganizationAndLocationId = async (): Promise<{
  organizationId: string;
  locationId: string;
}> => {
  const tId = await telematikId();
  const bundle = await withClient(async client => {
    return await client.resourceSearch({
      resourceType: "HealthcareService",
      searchParams: {
        _include: ["Organization:*", "Location:*"],
        "organization.identifier": tId,
      },
    });
  });
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

export const updateEndpoint = async (data: {
  id: string;
  name: string;
  address: string;
}): Promise<FhirResource> =>
  await withClient(async client => {
    const endpoint = await client.read({
      id: data.id,
      resourceType: "Endpoint",
    });

    return await client.update({
      id: data.id,
      resourceType: "Endpoint",
      body: {
        ...endpoint,
        name: data.name,
        address: data.address,
      },
    });
  });

export const updateHcsWithEndpoints = async (
  data: {
    id: string;
    name: string;
    endpoints: {
      endpoint_id?: string;
      endpoint_address: string;
      endpoint_name: string;
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
    data.endpoints.map(e => {
      if (e.endpoint_id) {
        return updateEndpoint({
          id: e.endpoint_id,
          name: e.endpoint_name,
          address: e.endpoint_address,
        }).then(() => e.endpoint_id);
      } else {
        // create new endpoint
        return createEndpoint(e.endpoint_name, e.endpoint_address).then(
          r => r.id
        );
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

    console.log("update request", request);

    const result = await client.update(request);
    console.log("update response", result);
  });
};

const parseLocation = (locationId?: string) => {
  if (!locationId) {
    return { location: [] };
  }

  return { location: [{ reference: `Location/${locationId}` }] };
};

/* eslint-disable @typescript-eslint/no-explicit-any */

async function readBundle(client: Client, bundle: any) {
  const elements = [];
  for (const entry of bundle.entry ?? []) {
    const resource = entry.resource;
    if (resource.resourceType === "HealthcareService") {
      elements.push(await deref(resource, client, bundle));
    }
  }
  return elements;
}

async function readPages(client: Client, bundle: any) {
  let cur = Object.assign({}, bundle);
  const elements = await readBundle(client, bundle);
  while (cur.link?.find((e: any) => e.relation === "next")) {
    elements.push(...(await readBundle(client, bundle)));
    cur = await client.nextPage({ bundle: cur });
  }
  return elements;
}

async function deref(resource: any, client: Client, bundle: any) {
  const derefd = {
    ...resource,
    endpoint: [],
    location: [],
    providedBy: {},
  };
  for (const endpoint of resource.endpoint ?? []) {
    derefd.endpoint.push(
      await client.resolve({
        reference: endpoint.reference,
        context: bundle,
      })
    );
  }
  for (const location of resource.location ?? []) {
    derefd.location.push(
      await client.resolve({
        reference: location.reference,
        context: bundle,
      })
    );
  }
  derefd.providedBy = await client.resolve({
    reference: resource.providedBy.reference,
    context: bundle,
  });
  return derefd;
}
