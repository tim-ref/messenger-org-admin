/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

export const aFhirHCSResponse = (
  name = "health care service name",
  id = "c014695e-760f-4205-8e3b-39bdc59d5089"
) => ({
  resourceType: "HealthcareService",
  id,
  meta: {
    versionId: "1",
    lastUpdated: "2023-05-05T18:31:25.052+02:00",
    source: "#vizNpHytLxembstZ",
    profile: [
      "https://gematik.de/fhir/directory/StructureDefinition/HealthcareServiceDirectory",
    ],
    tag: [
      {
        system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
        code: "owner",
        userSelected: false,
      },
    ],
  },
  providedBy: {
    resourceType: "Organization",
    id: "2e7059e0-ffd7-4233-b986-87681104bf0c",
    meta: {
      versionId: "1",
      lastUpdated: "2023-03-30T14:22:01.163+02:00",
      source: "#Nb2qHNooWkNG4BAP",
      profile: [
        "https://gematik.de/fhir/directory/StructureDefinition/OrganizationDirectory",
      ],
      tag: [
        {
          system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
          code: "ldap",
          display: "Synchronized from LDAP VZD",
          userSelected: false,
        },
      ],
    },
    text: {
      status: "generated",
      div: '<div xmlns="http://www.w3.org/1999/xhtml">&lt;div&gt;This is a sync generated Organization&lt;/div&gt;</div>',
    },
    identifier: [
      {
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "PRN",
            },
          ],
        },
        system: "https://gematik.de/fhir/sid/telematik-id",
        value: "1111-akq",
      },
      {
        system: "https://gematik.de/fhir/directory/CodeSystem/ldapUID",
        value: "13bfec55-e565-413f-84f1-e36fd8e1b666",
      },
    ],
    active: true,
    type: [
      {
        coding: [
          {
            system:
              "https://gematik.de/fhir/directory/CodeSystem/OrganizationProfessionOID",
            code: "1.2.276.0.76.4.53",
          },
        ],
      },
    ],
    name: "Anzeigenamen",
    alias: ["organization"],
  },
  location: [
    {
      resourceType: "Location",
      id: "e8d967d8-c419-45df-93eb-fcd36c9eda95",
      meta: {
        versionId: "1",
        lastUpdated: "2023-03-30T14:22:01.163+02:00",
        source: "#Nb2qHNooWkNG4BAP",
        profile: [
          "https://gematik.de/fhir/directory/StructureDefinition/LocationDirectory",
        ],
        tag: [
          {
            system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
            code: "ldap",
            display: "Synchronized from LDAP VZD",
            userSelected: false,
          },
        ],
      },
      text: {
        status: "generated",
        div: '<div xmlns="http://www.w3.org/1999/xhtml">&lt;div&gt;This is a sync generated Location&lt;/div&gt;</div>',
      },
      identifier: [
        {
          system: "https://gematik.de/fhir/directory/CodeSystem/ldapUID",
          value: "13bfec55-e565-413f-84f1-e36fd8e1b666",
        },
      ],
      address: {
        use: "work",
        type: "postal",
        text: "streetAddress&#13;&#10;postalCode&#13;&#10;localityName&#13;&#10;stateOrProvinceName&#13;&#10;DE",
        line: ["streetAddress"],
        city: "localityName",
        state: "stateOrProvinceName",
        postalCode: "postalCode",
        country: "DE",
      },
    },
  ],
  name,

  serviceProvisionCode: [
    {
      coding: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/service-provision-conditions",
          code: "cost",
        },
      ],
    },

    {
      coding: [
        {
          system:
            "http://terminology.hl7.org/CodeSystem/service-provision-conditions",
          code: "free",
        },
      ],
    },
  ],

  endpoint: [
    {
      resourceType: "Endpoint",
      id: "f0ea8450-fe13-4796-85f9-afa4952465de",
      meta: {
        versionId: "1",
        lastUpdated: "2023-05-05T18:31:24.774+02:00",
        source: "#xIaD5I2wuGIamZrY",
        profile: [
          "https://gematik.de/fhir/directory/StructureDefinition/EndpointDirectory",
        ],
        tag: [
          {
            system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
            code: "owner",
            userSelected: false,
          },
        ],
      },
      status: "active",
      connectionType: {
        system:
          "https://gematik.de/fhir/directory/CodeSystem/EndpointDirectoryConnectionType",
        code: "tim",
      },
      name: "@name:homeserver.bar",
      payloadType: [
        {
          coding: [
            {
              system:
                "https://gematik.de/fhir/directory/CodeSystem/EndpointDirectoryPayloadType",
              code: "tim-chat",
            },
          ],
        },
      ],
      address: "@name:homeserver.bar",
    },
  ],
});
