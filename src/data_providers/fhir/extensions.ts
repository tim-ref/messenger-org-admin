/*
 * Copyright (C) 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

// See https://www.hl7.org/fhir/R4/extensibility.html
import { FhirResource } from "fhir-kit-client";
import isEqual from "lodash/fp/isEqual";
import _ from "lodash";
import { Coding } from "./codings";

export type Extension = { readonly url: string; readonly valueCoding?: Coding };

// See https://gematik.de/fhir/directory/StructureDefinition/EndpointVisibility
export const EndpointVisibility = {
  hideVersicherte: {
    url: "https://gematik.de/fhir/directory/StructureDefinition/EndpointVisibility",
    valueCoding: {
      system:
        "https://gematik.de/fhir/directory/CodeSystem/EndpointVisibilityCS",
      code: "hide-versicherte",
    },
  } as Extension,
};

/**
 * Adds an Extension to an element, modifying the element.
 * @param {FhirResource} element - The element the extension should be added to.
 * @param {Extension} extension - The Extension to be added.
 */
export function addExtension(
  element: FhirResource,
  extension: Extension
): FhirResource {
  if (element.extension?.some(isEqual(extension)) !== true) {
    element.extension ??= [];
    element.extension.push(extension);
  }
  return element;
}

/**
 * Removes an Extension from an element, modifying the element.
 * @param {FhirResource} element - The element the extension should be removed from.
 * @param {Extension} extension - The Extension to be removed.
 */
export function removeExtension(
  element: FhirResource,
  extension: Extension
): FhirResource {
  if (element.extension?.some(isEqual(extension)) === true) {
    _.remove(element.extension, isEqual(extension));
  }
  return element;
}
