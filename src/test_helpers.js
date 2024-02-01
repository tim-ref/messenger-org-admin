/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

// stitch together tagged template parts, e.g.
// `a{"b"}c` → xs = [["a","c"],"b"] → renderTemplate(xs) → "abc"
//
// … but the impl. should make that obvious ;-)
function renderTemplate(/* @type string[] */ xs) {
  return [xs[0][0], ...xs.slice(1).flatMap((x, i) => [x, xs[0][i + 1]])].join(
    ""
  );
}

// escape char if necessary, e.g.
// maybescape('"')`"a\\"`
// returns → \"a\"
export function maybescape(/* @type string */ char) {
  return (...xs) =>
    renderTemplate(xs).replace(
      new RegExp(`\\\\([\\s\\S])|(${char})`, "g"),
      "\\$1$2"
    );
}

export function escapeDQ(...xs) {
  return maybescape('"')(...xs);
}
