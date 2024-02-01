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

import React from "react";
import { Admin, resolveBrowserLocale, Resource } from "react-admin";
import polyglotI18nProvider from "ra-i18n-polyglot";
import authProvider from "./synapse/authProvider";
import dataProvider from "./synapse/dataProvider";
import { UserCreate, UserEdit, UserList } from "./components/users";
import { RoomList, RoomShow } from "./components/rooms";
import { ReportList, ReportShow } from "./components/EventReports";
import LoginPage from "./components/LoginPage";
import UserIcon from "@material-ui/icons/Group";
import ConfirmationNumberIcon from "@material-ui/icons/ConfirmationNumber";
import EqualizerIcon from "@material-ui/icons/Equalizer";
import { UserMediaStatsList } from "./components/statistics";
import RoomIcon from "@material-ui/icons/ViewList";
import ReportIcon from "@material-ui/icons/Warning";
import FolderSharedIcon from "@material-ui/icons/FolderShared";
import { ImportFeature } from "./components/ImportFeature";
import {
  RegistrationTokenCreate,
  RegistrationTokenEdit,
  RegistrationTokenList,
} from "./components/RegistrationTokens";
import { RoomDirectoryList } from "./components/RoomDirectory";
import { Route } from "react-router-dom";
import germanMessages from "./i18n/de";
import englishMessages from "./i18n/en";
import chineseMessages from "./i18n/zh";
import { combineDataProviders } from "./combine_data_providers";
import { hcsDataProvider } from "./data_providers/healthcareservice_dataprovider";
import { HcsCreate, HcsEdit, HcsList } from "./components/Hcs";

// TODO: Can we use lazy loading together with browser locale?
const messages = {
  de: germanMessages,
  en: englishMessages,
  zh: chineseMessages,
};
const i18nProvider = polyglotI18nProvider(
  locale => (messages[locale] ? messages[locale] : messages.en),
  resolveBrowserLocale()
);

const App = () => (
  <Admin
    disableTelemetry
    loginPage={LoginPage}
    authProvider={authProvider}
    dataProvider={combineDataProviders({
      default: dataProvider,
      healthcare_services: hcsDataProvider,
    })}
    i18nProvider={i18nProvider}
    customRoutes={[
      <Route key="userImport" path="/import_users" component={ImportFeature} />,
    ]}
  >
    <Resource
      name="users"
      list={UserList}
      create={UserCreate}
      edit={UserEdit}
      icon={UserIcon}
    />
    <Resource name="rooms" list={RoomList} show={RoomShow} icon={RoomIcon} />
    <Resource
      name="user_media_statistics"
      list={UserMediaStatsList}
      icon={EqualizerIcon}
    />
    <Resource
      name="reports"
      list={ReportList}
      show={ReportShow}
      icon={ReportIcon}
    />
    <Resource
      name="room_directory"
      list={RoomDirectoryList}
      icon={FolderSharedIcon}
    />
    <Resource
      name="registration_tokens"
      list={RegistrationTokenList}
      create={RegistrationTokenCreate}
      edit={RegistrationTokenEdit}
      icon={ConfirmationNumberIcon}
    />
    <Resource name="connections" />
    <Resource name="devices" />
    <Resource name="room_members" />
    <Resource name="users_media" />
    <Resource name="joined_rooms" />
    <Resource name="pushers" />
    <Resource name="servernotices" />
    <Resource name="forward_extremities" />
    <Resource name="room_state" />

    <Resource
      name="healthcare_services"
      list={HcsList}
      create={HcsCreate}
      edit={HcsEdit}
    />
  </Admin>
);

export default App;
