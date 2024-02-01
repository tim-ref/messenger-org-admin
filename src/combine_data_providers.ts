/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { DataProvider } from "ra-core/src/types";

/**
 * Combines data providers for multiple resources into a single one.
 */
export function combineDataProviders(
  providers: { [key: string]: DataProvider } & { default: DataProvider }
): DataProvider {
  if (typeof providers.default !== "object") {
    throw new Error("No default provider passed");
  }
  const providerForResource = (resource: string) =>
    providers[resource] || providers.default;

  return {
    getList: (resource, params) =>
      providerForResource(resource).getList(resource, params),
    getOne: (resource, params) =>
      providerForResource(resource).getOne(resource, params),
    getMany: (resource, params) =>
      providerForResource(resource).getMany(resource, params),
    getManyReference: (resource, params) =>
      providerForResource(resource).getManyReference(resource, params),
    create: (resource, params) =>
      providerForResource(resource).create(resource, params),
    createMany: (resource, params) =>
      providerForResource(resource).createMany(resource, params),
    update: (resource, params) =>
      providerForResource(resource).update(resource, params),
    updateMany: (resource, params) =>
      providerForResource(resource).updateMany(resource, params),
    delete: (resource, params) =>
      providerForResource(resource).delete(resource, params),
    deleteMany: (resource, params) =>
      providerForResource(resource).deleteMany(resource, params),
  };
}
