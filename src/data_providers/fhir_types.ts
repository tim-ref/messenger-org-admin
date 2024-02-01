/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { FhirResource } from "fhir-kit-client";

export type FhirResourceWithId = FhirResource & { id: string };

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

// http://hl7.org/fhir/endpoint.html
type Endpoint = { id: string; name?: string; address: string };

// availableTime/notAvailable sind orientiert an http://hl7.org/fhir/metadatatypes.html#Availability

/*
  Arvato: Die Pflege der Öffnungszeiten ist eines dieser Felder die nicht zwischen Gematik und Arvato abgestimmt ist.
        (Das trifft im Grunde für alle FHIR-Attribute zu die nicht aus dem LDAP-VZD synchronisiert werden.)
        Deshalb haben wir hierzu auch keinerlei Tests inkl. Testdaten / Best Practices.
 */

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export enum DayOfWeekSelection {
  mon = "mon",
  tue = "tue",
  wed = "wed",
  thu = "thu",
  fri = "fri",
  sat = "sat",
  sun = "sun",
}

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
