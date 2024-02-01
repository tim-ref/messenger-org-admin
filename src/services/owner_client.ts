/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { fetchUtils } from "react-admin";
import { decodeJwt } from "jose";
import Client from "fhir-kit-client";

function getRegserviceUri() {
  if (process.env.NODE_ENV !== "production") {
    return (
      process.env.REACT_APP_REGSERVICE ??
      "http://localhost:8080/backend/regservice"
    );
  } else {
    return "regservice/backend/regservice";
  }
}

export const regserviceUri = getRegserviceUri();

export function vzdUri() {
  if (process.env.NODE_ENV !== "production") {
    return process.env.REACT_APP_VZD ?? "http://localhost:8090";
  } else {
    return "vzd";
  }
}

async function fetchOidcToken() {
  const mxId = localStorage.getItem("user_id");
  const accessToken = localStorage.getItem("access_token");
  const homeserverBaseUrl = localStorage.getItem("base_url");

  const response = await fetchUtils.fetchJson(
    `${homeserverBaseUrl}/_matrix/client/v3/user/${mxId}/openid/request_token`,
    {
      method: "POST",
      mode: "cors",
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }),
      body: `{}`,
    }
  );

  const oidcToken: string = response?.json?.access_token ?? null;

  if (oidcToken === null) {
    throw new Error("Unable to acquire oicd token");
  }

  return oidcToken;
}

async function fetchRegServiceToken(oidcToken: string) {
  const mxId = localStorage.getItem("user_id");

  const response = await fetchUtils.fetchJson(
    `${regserviceUri}/openid/user/${encodeURIComponent(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      mxId!
    )}/requesttoken`,
    {
      method: "POST",
      mode: "cors",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      body: `request_token=${encodeURIComponent(oidcToken!)}`,
    }
  );

  const token: string = response?.json?.access_token ?? null;

  if (token === null) {
    throw new Error("Unable to acquire regservice token");
  }

  return token;
}

async function fetchOwnerToken(regserviceToken: string) {
  const url = `${vzdUri()}/owner-authenticate`;

  const response = await fetchUtils.fetchJson(url, {
    mode: "cors",
    user: {
      authenticated: true,
      token: `Bearer ${encodeURIComponent(regserviceToken)}`,
    },
  });

  const token: string = response?.json?.access_token ?? null;

  if (token === null) {
    throw new Error("Unable to acquire owner token");
  }

  return token;
}

async function getOwnerToken() {
  const cachedToken = localStorage.getItem("owner");

  if (cachedToken) {
    return cachedToken;
  }

  let regServiceToken;
  switch (process.env.NODE_ENV) {
    case "production":
    case "test":
      // fetch first oidc token from synapse and then token from the regservice
      const oidcToken = await fetchOidcToken();
      regServiceToken = await fetchRegServiceToken(oidcToken);
      break;
    case "development":
      // local dev override: fetch the token from properties
      regServiceToken = process.env.REACT_APP_REGSERVICE_TOKEN;
      break;
    default:
      throw new Error("unexpected case");
  }

  if (!regServiceToken) {
    throw Error(
      `no reg service token available! stage=${process.env.NODE_ENV}`
    );
  }

  const token = await fetchOwnerToken(regServiceToken);
  localStorage.setItem("owner", token);
  return token;
}

async function ownerClient() {
  return new Client({
    baseUrl: `${vzdUri()}/owner`,
    bearerToken: await getOwnerToken(),
  });
}

export async function telematikId() {
  const tid = decodeJwt(await getOwnerToken())?.sub;

  if (!tid) {
    throw new Error("Unable to parse sub from owner token");
  }
  return tid;
}

export async function withClient<T>(op: (client: Client) => T): Promise<T> {
  try {
    return await op(await ownerClient());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    logFailedResponse(e);
    if (e?.response?.status === 401) {
      localStorage.removeItem("owner");
      return await op(await ownerClient());
    }
    // FIXME: remove this workaround as soon as VZD responds with the correct status when JWS token is expired
    if (
      e?.response?.status === 500 &&
      e?.response?.data?.issue[0]?.code === "security"
    ) {
      localStorage.removeItem("owner");
      return await op(await ownerClient());
    }
    throw e;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logFailedResponse(e: any) {
  const issues = e.response?.data?.issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.map((i: any) => i.severity?.toUpperCase() + ": " + i.diagnostics)
    ?.join("\n   ");
  console.warn(
    "FHIR request failed. Status: " +
      e.response?.status +
      "\n Issues: \n[" +
      issues +
      "]"
  );
}
