/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

type Endpoint = {
  name: string;
  address: string;
};

declare namespace Cypress {
  interface Chainable {
    browserLogin(): Chainable<Element>;
    apiLogin(): Chainable<Element>;
    endGroup(): Chainable<Element>;
    createHcs(
      name: string,
      endpoints: Endpoint[],
      optional?: { serviceProvisionCode?: string[] }
    ): Chainable<Element>;
    hcsListOne(name: string): Chainable<Element>;
    editHcs(name: string, endpoints: Endpoint[]): Chainable<Element>;
  }
}
