/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

// See https://www.hl7.org/fhir/R4/datatypes.html#codesystem
export type Coding = {
  readonly system?: string;
  readonly version?: string;
  readonly code?: string;
  readonly display?: string;
  readonly userSelected?: boolean;
};

export type ConnectionTypes = "tim" | "tim-fa" | "tim-bot";

export function EndpointDirectoryConnectionType(code: ConnectionTypes): Coding {
  return {
    system:
      "https://gematik.de/fhir/directory/CodeSystem/EndpointDirectoryConnectionType",
    code,
  };
}

export const EndpointDirectoryPayloadType = {
  timChat: {
    system:
      "https://gematik.de/fhir/directory/CodeSystem/EndpointDirectoryPayloadType",
    code: "tim-chat",
  } as Coding,
};

export const Origin = {
  ldapUnselected: {
    system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
    code: "ldap",
    display: "Synchronized from LDAP VZD",
    userSelected: false,
  } as Coding,
  owner: {
    system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
    code: "owner",
  } as Coding,
  ownerUnselected: {
    system: "https://gematik.de/fhir/directory/CodeSystem/Origin",
    code: "owner",
    userSelected: false,
  } as Coding,
};
