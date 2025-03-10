/*
 * Copyright (C) 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { FhirResource } from "fhir-kit-client";
import {
  addExtension,
  EndpointVisibility,
  removeExtension,
} from "./extensions";

describe("addExtension", () => {
  test("can add an Extension - missing property", () => {
    const resource: FhirResource = { resourceType: "test double" };
    addExtension(resource, EndpointVisibility.hideVersicherte);

    expect(resource).toHaveProperty("extension");
    expect(resource.extension).toBeArrayOfSize(1);
    expect(resource.extension).toContain(EndpointVisibility.hideVersicherte);
  });

  test("can add an Extension - empty array", () => {
    const resource: FhirResource = {
      resourceType: "test double",
      extension: [],
    };
    addExtension(resource, EndpointVisibility.hideVersicherte);

    expect(resource).toHaveProperty("extension");
    expect(resource.extension).toBeArrayOfSize(1);
    expect(resource.extension).toContain(EndpointVisibility.hideVersicherte);
  });

  test("can add an Extension - non-empty array", () => {
    const otherExtension = { url: "any", value: "also any" };
    const resource: FhirResource = {
      resourceType: "test double",
      extension: [otherExtension],
    };
    addExtension(resource, EndpointVisibility.hideVersicherte);

    expect(resource).toHaveProperty("extension");
    expect(resource.extension).toBeArrayOfSize(2);
    expect(resource.extension).toContain(otherExtension);
    expect(resource.extension).toContain(EndpointVisibility.hideVersicherte);
  });

  test("can add an Extension - Extension already present", () => {
    const resource: FhirResource = {
      resourceType: "test double",
      extension: [EndpointVisibility.hideVersicherte],
    };
    addExtension(resource, EndpointVisibility.hideVersicherte);

    expect(resource).toHaveProperty("extension");
    expect(resource.extension).toBeArrayOfSize(1);
    expect(resource.extension).toContain(EndpointVisibility.hideVersicherte);
  });
});

describe("removeExtension", () => {
  test("can remove an Extension - missing property", () => {
    const resource: FhirResource = { resourceType: "test double" };
    removeExtension(resource, EndpointVisibility.hideVersicherte);

    expect(resource).not.toHaveProperty("extension");
  });

  test("can remove an Extension - empty array", () => {
    const resource: FhirResource = {
      resourceType: "test double",
      extension: [],
    };
    removeExtension(resource, EndpointVisibility.hideVersicherte);

    expect(resource).toHaveProperty("extension");
    expect(resource.extension).toBeArrayOfSize(0);
  });

  test("can remove an Extension - Extension not present", () => {
    const otherExtension = { url: "any", value: "also any" };
    const resource: FhirResource = {
      resourceType: "test double",
      extension: [otherExtension],
    };
    removeExtension(resource, EndpointVisibility.hideVersicherte);

    expect(resource).toHaveProperty("extension");
    expect(resource.extension).toBeArrayOfSize(1);
    expect(resource.extension).toContain(otherExtension);
  });

  test("can remove an Extension - Extension present", () => {
    const resource: FhirResource = {
      resourceType: "test double",
      extension: [EndpointVisibility.hideVersicherte],
    };
    removeExtension(resource, EndpointVisibility.hideVersicherte);

    expect(resource).toHaveProperty("extension");
    expect(resource.extension).toBeArrayOfSize(0);
  });
});
