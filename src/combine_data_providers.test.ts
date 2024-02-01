/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { combineDataProviders } from "./combine_data_providers";
import { DataProvider } from "ra-core/src/types";

const fakeProvider: DataProvider = {
  create: jest.fn(),
  createMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  getList: jest.fn(),
  getMany: jest.fn(),
  getManyReference: jest.fn(),
  getOne: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};

describe("combineDataProviders", () => {
  it("requires default to be set", async () => {
    expect(() =>
      combineDataProviders({
        provider: fakeProvider,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
    ).toThrowError("No default provider passed");

    expect(() =>
      combineDataProviders({
        default: fakeProvider,
        provider: fakeProvider,
      })
    ).not.toThrow();
  });

  it("calls the appropriate provider", async () => {
    const combined = combineDataProviders({
      default: fakeProvider,
      healthcare_services: fakeProvider,
    });

    await combined.getOne("some_other_resource", { id: "id1" });
    expect(fakeProvider.getOne).toHaveBeenCalledWith("some_other_resource", {
      id: "id1",
    });

    await combined.getMany("healthcare_services", { ids: ["id2"] });
    expect(fakeProvider.getMany).toHaveBeenCalledWith("healthcare_services", {
      ids: ["id2"],
    });
  });
});
