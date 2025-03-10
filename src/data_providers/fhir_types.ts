/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { FhirResource } from "fhir-kit-client";
import { Extension } from "./fhir/extensions";
import { Coding } from "./fhir/codings";

export type FhirResourceWithId = FhirResource & { id: string };

type BundleEntry = {
  readonly resource?: FhirResourceWithId;
};

type BundleLink = {
  readonly relation: string;
};

// See https://hl7.org/fhir/R4/bundle.html
export type Bundle = {
  readonly resourceType: "Bundle";
  readonly type: string;
  readonly total?: number;
  readonly link?: BundleLink[];
  readonly entry?: BundleEntry[];
};

// http://hl7.org/fhir/valueset-service-provision-conditions.html
export enum ServiceProvisionCode {
  free = "free",
  disc = "disc",
  cost = "cost",
}

// http://hl7.org/fhir/datatypes.html#CodeableConcept
export type CodableConcept = {
  coding: [
    {
      system: string;
      code: string;
    }
  ];
};

export type Telecom = {
  system: string;
  value: string;
  use: string;
};

// https://gematik.de/fhir/directory/CodeSystem/EndpointDirectoryConnectionType
export type EndpointConnectionType = Coding;

// http://hl7.org/fhir/endpoint.html
// See https://www.hl7.org/fhir/R4/extensibility.html
export type Endpoint = {
  readonly id: string;
  name?: string;
  address: string;
  connectionType: EndpointConnectionType;
  extension?: Extension[];
};

// availableTime/notAvailable sind orientiert an http://hl7.org/fhir/metadatatypes.html#Availability

/*
  Arvato: Die Pflege der Öffnungszeiten ist eines dieser Felder die nicht zwischen Gematik und Arvato abgestimmt ist.
        (Das trifft im Grunde für alle FHIR-Attribute zu die nicht aus dem LDAP-VZD synchronisiert werden.)
        Deshalb haben wir hierzu auch keinerlei Tests inkl. Testdaten / Best Practices.
 */

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type AvailableTimeInternal = {
  daysOfWeek?: string;
  availableStartTime?: string; // hh:mm:ss
  availableEndTime?: string; // hh:mm:ss
};

export type AvailableTime = {
  daysOfWeek?: DayOfWeek[];
  allDay?: boolean;
  availableStartTime?: string; // hh:mm:ss
  availableEndTime?: string; // hh:mm:ss
};

// das scheint eine Anpassung von Gematik/Arvato zu sein. diese ist wohl auf Seiten der Arvato implementiert: https://simplifier.net/packages/de.gematik.fhir.directory/0.10.1/files/1998329
// das scheint die offizielle Spec zu sein: http://hl7.org/fhir/healthcareservice.html
export type HealthcareService = {
  id: string;
  resourceType: "HealthcareService";
  name?: string;
  endpoint: Endpoint[];
  serviceProvisionCode?: CodableConcept[];
  speciality?: CodableConcept[];
  appointmentRequired?: boolean;
  communication?: CodableConcept[];
  telecom?: Telecom[];
  availableTime?: AvailableTime[];
  availabilityExceptions?: string;
  location: { id: string }[];
};

// https://simplifier.net/packages/de.gematik.fhir.directory/0.10.1/files/1998331
// see package.json fhir-gen für die Generierung
export { Specialty } from "./fhir/generatedSpecialty";
