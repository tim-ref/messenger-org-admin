/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

function getEnv(): string {
  const envFromHostname = /.*\.(..)\.timref\.akquinet\.nx2\.dev$/.exec(
    window.location.hostname
  );

  if (envFromHostname) {
    return envFromHostname[1];
  } else {
    return "eu";
  }
}

const eu = {
  mxDomain: "test1.eu.timref.akquinet.nx2.dev",
};
const tu = {
  mxDomain: "test1.tu.timref.akquinet.nx2.dev",
};
const ru = {
  mxDomain: "test1.ru.timref.akquinet.nx2.dev",
};

export function currentConfig() {
  const env = getEnv();

  switch (env) {
    case "eu":
      return eu;
    case "tu":
      return tu;
    case "ru":
      return ru;
    default:
      console.warn("no environment configured. Using eu configuration");
      return eu;
  }
}
