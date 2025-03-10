/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import fetchMock from "jest-fetch-mock";

const process_before = process.env;

beforeAll(async () => {
  fetchMock.disableMocks();
  process.env.REACT_APP_VZD = "https://fhir-directory-ref.vzd.ti-dienste.de";
});

afterAll(() => {
  process.env = process_before;
  fetchMock.enableMocks();
});

describe("getOwnerToken", () => {
  it("can read env", async () => {
    expect(process.env.REGSERVICE_OPENID_TOKEN).toEqual(
      expect.stringContaining(".")
    );
  });
  it("can get owner token", async () => {
    const token = await getOwnerToken();
    console.log("owner token workaround");
    console.log(`localStorage.setItem("owner", "${token}");`);
    expect(token).toMatch(/^ey.*/);
  });
});

export async function getOwnerToken(): Promise<string> {
  const resp = await fetch(
    "https://fhir-directory-ref.vzd.ti-dienste.de/owner-authenticate",
    {
      headers: {
        Authorization: `Bearer ${process.env.REGSERVICE_OPENID_TOKEN}`,
      },
    }
  );
  expect(resp.status).toBe(200);
  const responseBody = await resp.text();
  return JSON.parse(responseBody).access_token;
}
