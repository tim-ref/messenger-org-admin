/*
 * Modified by akquinet GmbH on 16.10.2023
 *
 * Originally forked https://github.com/Awesome-Technologies/synapse-admin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import withMessage from "../node_modules/jest-expect-message/dist/withMessage.js";
import * as matchers from "jest-extended";

expect.extend(matchers);
global.expect = withMessage(global.expect);

// https://github.com/jsdom/jsdom/issues/2524
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
