/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { currentConfig } from "./config";

describe("config test", () => {
  it.each([
    {
      url: "http://localhost",
      expectedMxDomain: "test1.eu.timref.akquinet.nx2.dev",
    },
    {
      url: "https://org-admin-client.eu.timref.akquinet.nx2.dev",
      expectedMxDomain: "test1.eu.timref.akquinet.nx2.dev",
    },
    {
      url: "https://org-admin-client.ru.timref.akquinet.nx2.dev",
      expectedMxDomain: "test1.ru.timref.akquinet.nx2.dev",
    },
    {
      url: "https://org-admin-client.tu.timref.akquinet.nx2.dev",
      expectedMxDomain: "test1.tu.timref.akquinet.nx2.dev",
    },
  ])("should use correct mx domain", ({ url, expectedMxDomain }) => {
    withWindowLocation(url, () => {
      expect(currentConfig().mxDomain).toBe(expectedMxDomain);
    });
  });
});

function withWindowLocation(hostname: string, block: () => void) {
  const backup = window.location;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyWindow = window as any;

  delete anyWindow.location;
  anyWindow.location = new URL(hostname);

  try {
    block();
  } finally {
    window.location = backup;
  }
}
