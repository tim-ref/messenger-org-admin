/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import fs from "fs";

// Rohdaten stammen von https://simplifier.net/packages/de.gematik.fhir.directory/0.10.1/files/1998331
import practiceSettingCodes from "./practiceSettingCode.json";

// dieses npm skript extrahiert die codes aus o.g. JSON Datei und generiert daraus ein TS enum zur Verwendung im Code

const validCodes = (): string[] => {
  if (practiceSettingCodes.valueSet.length !== 1) {
    throw new Error("unexpected # of valueSet");
  }

  if (practiceSettingCodes.valueSet[0].conceptList.length !== 1) {
    throw new Error("unexpected # of conceptList");
  }

  return practiceSettingCodes.valueSet[0].conceptList[0].concept.map(
    e => e.code
  );
};

console.log("generating speciality enum");

const header = "export enum Specialty {";
const footer = "}";

const stream = fs.createWriteStream(
  "src/data_providers/fhir/generatedSpecialty.ts"
);
stream.once("open", function (fd) {
  stream.write(header);
  stream.write("\n");

  validCodes().forEach(c => {
    stream.write("  " + c + '="' + c + '",\n');
  });

  stream.write(footer);
  stream.write("\n");

  stream.end();
});

console.log("done");
