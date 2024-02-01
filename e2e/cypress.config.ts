/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { defineConfig } from "cypress";
import cypress_terminal_report from "cypress-terminal-report/src/installLogsPrinter";

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      cypress_terminal_report(on, { printLogsToConsole: "always" });

      on("before:browser:launch", (browser, launchOptions) => {
        console.log("before:browser:launch", browser);

        if (browser.family === "chromium" && browser.name !== "electron") {
          console.log("prefs", launchOptions.preferences);

          launchOptions.preferences.default.intl = {
            accept_languages: "en-US,en",
            selected_languages: "en-US,en",
          };

          return launchOptions;
        }

        if (browser.name === "electron") {
          launchOptions.preferences.devTools = true;
          return launchOptions;
        }
      });
    },
  },

  defaultCommandTimeout: 10000,
});
