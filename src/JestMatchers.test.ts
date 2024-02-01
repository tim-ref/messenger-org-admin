/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

// https://jest-extended.jestcommunity.dev/docs/matchers
describe("JestMatchers", () => {
  test("array", () => {
    expect([]).toBeArray();
    expect([1]).toBeArray();
    expect(true).not.toBeArray();
  });

  test("passes when a string has a given substring", () => {
    expect(
      [{ foo: "bar", baz: "qux", bax: "zax" }],
      "custom msg"
    ).toPartiallyContain({
      foo: "bar",
    });
    expect([{ foo: "bar", baz: "qux", bax: "zax" }]).toPartiallyContain({
      baz: "qux",
    });
    expect([{ foo: "bar", baz: "qux", bax: "zax" }]).not.toPartiallyContain({
      foo: "qux",
    });
  });
});
