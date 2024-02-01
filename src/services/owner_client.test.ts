/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import jfm from "jest-fetch-mock";
import { escapeDQ } from "../test_helpers";
import { regserviceUri, telematikId, vzdUri, withClient } from "./owner_client";
beforeAll(async () => {
  jfm.enableMocks();
});
beforeEach(async () => {
  jfm.resetMocks();

  localStorage.clear();
  localStorage.setItem("user_id", "USER_ID");
  localStorage.setItem("access_token", "ACCESS_TOKEN");
  localStorage.setItem("base_url", "HOMESERVER_BASE_URL");
});

afterAll(() => {
  jfm.disableMocks();
});

describe("withClient", () => {
  it("acquires new regservice and owner tokens when none are in storage", async () => {
    givenHomeserverResponse("USER_ID", "ACCESS_TOKEN", "OIDC_TOKEN");
    givenRegServiceResponse("USER_ID", "OIDC_TOKEN", "REGSERVICE_TOKEN");
    givenVzdResponse("REGSERVICE_TOKEN", "OWNER_TOKEN");
    givenOwnerResponse(
      "HealthcareService",
      "OWNER_TOKEN",
      `{ "some": "value" }`
    );
    const res = await withClient(async client => {
      return await client.resourceSearch({
        resourceType: "HealthcareService",
        searchParams: {},
      });
    });

    expect(res?.some).toBe("value");
    expect(jfm).toHaveBeenCalledTimes(4);
  });

  it("acquires new regservice and owner tokens when the current token is invalid", async () => {
    const json = `{ "some": "value" }`;
    localStorage.setItem("owner", "INVALID");
    // this should fail the expected token…
    givenOwnerResponse("HealthcareService", "OWNER_TOKEN", json);
    givenHomeserverResponse("USER_ID", "ACCESS_TOKEN", "OIDC_TOKEN");
    givenRegServiceResponse("USER_ID", "OIDC_TOKEN", "REGSERVICE_TOKEN");
    givenVzdResponse("REGSERVICE_TOKEN", "OWNER_TOKEN");
    // …and this should succeed after acquiring new token and retrying.
    givenOwnerResponse("HealthcareService", "OWNER_TOKEN", json);

    const res = await withClient(client => {
      return client.resourceSearch({
        resourceType: "HealthcareService",
        searchParams: {},
      });
    });

    expect(res?.some).toBe("value");
    expect(jfm).toHaveBeenCalledTimes(5);
  });

  it("uses preexisting owner token", async () => {
    const json = `{ "some": "value" }`;
    localStorage.setItem("owner", "OWNER_TOKEN");
    givenOwnerResponse("HealthcareService", "OWNER_TOKEN", json);
    const res = await withClient(client => {
      return client.resourceSearch({
        resourceType: "HealthcareService",
        searchParams: {},
      });
    });
    expect(res?.some).toBe("value");
    expect(jfm).toHaveBeenCalledTimes(1);
  });
});

describe.skip("telematikId", () => {
  // jwt encode --secret key '{ "aud": "aud", "exp": 2147483647, "iat": 0, "iss": "iss", "sub": "TELEMATIK_ID" }'
  const correct =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhdWQiLCJleHAiOjIxNDc0ODM2NDcsImlhdCI6MCwiaXNzIjoiaXNzIiwic3ViIjoiVEVMRU1BVElLX0lEIn0.mrQV1rFg4g5JvYeJKtanLmUdn210IL-b3oNSQuvTfE0";
  // jwt encode --secret key '{ "aud": "aud", "exp": 2147483647, "iat": 0, "iss": "iss" }'
  const nosub =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhdWQiLCJleHAiOjIxNDc0ODM2NDcsImlhdCI6MCwiaXNzIjoiaXNzIn0.-4eq4jwBcgESBRMU7O1bAz4FbuqKaTEv0ALtgHzMfhQ";
  const invalid = "invalid";

  it("can parse from correct owner tokens", async () => {
    localStorage.setItem("owner", correct);
    const tid = await telematikId();
    expect(tid).toBe("TELEMATIK_ID");
  });

  it("can't parse incorrect tokens", async () => {
    localStorage.setItem("owner", nosub);
    expect(async () => {
      await telematikId();
    }).toThrow();
  });

  it("can't parse invalid tokens", async () => {
    localStorage.setItem("owner", invalid);
    expect(async () => {
      await telematikId();
    }).toThrow();
  });
});

function givenHomeserverResponse(
  expectMxId: string,
  expectMatrixToken: string,
  returnToken: string
) {
  jfm.mockOnce(async req => {
    const expectedUrl = `HOMESERVER_BASE_URL/_matrix/client/v3/user/${expectMxId}/openid/request_token`;
    const expectedBody = `{}`;
    const body = await req.text();

    if (req.url !== expectedUrl) {
      return { status: 404 };
    }
    if (body !== expectedBody) {
      return { status: 401 };
    }
    return `{ "access_token": "${escapeDQ`${returnToken}`}" }`;
  });
}

function givenRegServiceResponse(
  expectMxId: string,
  expectOIDCToken: string,
  returnToken: string
) {
  jfm.mockOnce(async req => {
    const expectedUrl = `${regserviceUri}/openid/user/${encodeURIComponent(
      expectMxId
    )}/requesttoken`;
    const expectedBody = `request_token=${encodeURIComponent(expectOIDCToken)}`;
    const body = await req.text();
    if (req.url !== expectedUrl) {
      return { status: 404 };
    }
    if (body !== expectedBody) {
      return { status: 401 };
    }
    return `{ "access_token": "${escapeDQ`${returnToken}`}" }`;
  });
}

function givenVzdResponse(expectRegserviceToken: string, returnToken: string) {
  jfm.mockOnce(async req => {
    const expectedUrl = `${vzdUri()}/owner-authenticate`;
    const expectedAuthorization = `Bearer ${encodeURIComponent(
      expectRegserviceToken
    )}`;
    if (req.url !== expectedUrl) {
      return { status: 404 };
    }
    if (req.headers.get("authorization") !== expectedAuthorization) {
      return { status: 401 };
    }
    return `{ "access_token": "${escapeDQ`${returnToken}`}" }`;
  });
}

function givenOwnerResponse(
  path: string,
  expectOwnerToken: string,
  body: string
) {
  jfm.mockOnce(async req => {
    const expectedUrl = `${vzdUri()}/owner/${path}`;

    if (req.url !== expectedUrl) {
      return { status: 404 };
    }
    if (
      req.headers.get("authorization") !==
      `Bearer ${encodeURIComponent(expectOwnerToken)}`
    ) {
      return { status: 401 };
    }
    return body;
  });
}
