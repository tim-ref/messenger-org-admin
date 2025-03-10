/*
 * Copyright (C) 2023 - 2025 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import React from "react";
import { CSSTransitionProps } from "react-transition-group/CSSTransition";

import {
  ArrayField,
  ArrayInput,
  BooleanField,
  BooleanInput,
  Create,
  CreateProps,
  Datagrid,
  Edit,
  EditProps,
  FormDataConsumer,
  FormDataConsumerRenderParams,
  List,
  ReferenceInput,
  SelectArrayInput,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  useGetList,
  useGetOne,
} from "react-admin";
import { serviceProvisionCodeChoices } from "../data_providers/healthcare_service_mapper";
import {
  connectionRefersToUser,
  maybeAppendChatbot,
  mxIdToUri,
  uriToMxId,
} from "../data_providers/healthcare_service_data_provider";

const listFilters = [
  <TextInput placeholder="Name" source="name:contains" alwaysOn />,
];
const TransitionProps: CSSTransitionProps = {
  classNames: "",
  addEndListener: () => undefined,
};

export const HcsList = props => (
  <List {...props} sort={{ field: "name", order: "ASC" }} filters={listFilters}>
    <Datagrid rowClick="edit" className="HealthcareService">
      <TextField source="id" sortable={false} />
      <TextField source="name" />
      <ArrayField source="endpoints">
        <Datagrid>
          <TextField label="ID" source="endpoint_id" />
          <TextField label="Name" source="endpoint_name" />
          <TextField label="Adresse" source="endpoint_address" />
          <TextField source="connectionType" />
          <BooleanField
            label="Versteckt vor Versicherten?"
            source="endpoint_hide_from_insurees"
          />
        </Datagrid>
      </ArrayField>
      <TextField source="organization_name" sortable={false} />
      <TextField
        source="organization_id"
        label="Organization Id"
        sortable={false}
      />
    </Datagrid>
  </List>
);

const connectionTypeChoices = [
  { id: "tim", name: "TI-Messenger Endpoint" },
  { id: "tim-fa", name: "TI-Messenger Funktionsaccount" },
  { id: "tim-bot", name: "TI-Messenger Chatbot" },
];

// Show the associated User.displayname in disabled TextInput when tim-fa is on.
// This preserves the old value in the form when the user toggles tim-fa and back
// without saving in-between.
const EndpointNameInput = ({
  getSource,
  scopedFormData,
}: FormDataConsumerRenderParams) => {
  const referingUser = connectionRefersToUser(scopedFormData?.connectionType);
  const userId = uriToMxId(scopedFormData?.endpoint_address);
  const { data, loading } = useGetOne("users", userId, {
    enabled: !!userId && referingUser,
  });
  const displayname = loading ? "" : data?.displayname ?? "";
  return (
    <TextInput
      label="Endpoint Name"
      source={getSource("endpoint_name")}
      disabled={referingUser}
      format={(value: string | null) => {
        return referingUser
          ? maybeAppendChatbot(scopedFormData?.connectionType, displayname)
          : value ?? "";
      }}
      autoComplete="off"
      fullWidth
    />
  );
};

// Show endpoint address as ReferenceInput when connectionType requires user reference,
// as TextInput otherwise (for backward-compatibility).
const EndpointAddressInput = ({
  scopedFormData,
  getSource,
}: FormDataConsumerRenderParams) => {
  const referingUser = connectionRefersToUser(scopedFormData?.connectionType);

  const sort = { field: "name", order: "ASC" };
  const filter = { deactivated: false };
  const { data, loading } = useGetList(
    "users",
    { page: 1, perPage: 1000000 },
    sort,
    filter,
    { enabled: referingUser }
  );

  let users: string[];
  if (!referingUser || loading) {
    users = [];
  } else {
    users = Object.keys(data);
  }

  // Return "" when the ReferenceInput is hidden or has a value that doesn't correspond
  // to a valid user (this can happen when the state was just toggled).
  // Otherwise, ra-final-form would console.warn about it many times per typed
  // character, which ultimately overfills the cypress console buffer and makes e2e
  // tests fail.
  const format = (value: string | null) => {
    const mxId = uriToMxId(value);
    return !referingUser || !users.includes(mxId) ? "" : mxId;
  };
  return (
    <>
      <ReferenceInput
        label="Endpoint Address"
        source={getSource("endpoint_address")}
        reference="users"
        sort={sort}
        // Needs to format value to reference users id
        format={format}
        // Needs to parse input to be valid
        parse={mxIdToUri}
        fullWidth
        filter={filter}
        style={{ display: referingUser ? "inherit" : "none" }}
      >
        <SelectInput
          id={`${getSource("endpoint_address")}_ref`}
          // Makes input more consistent and easier for test driver
          optionText={record => (record ? mxIdToUri(record.id) : "")}
          fullWidth
        />
      </ReferenceInput>
      <TextInput
        id={`${getSource("endpoint_address")}_txt`}
        label="Endpoint Address"
        source={getSource("endpoint_address")}
        autoComplete="off"
        fullWidth
        style={{ display: referingUser ? "none" : "inherit" }}
      />
    </>
  );
};

export const HcsCreate = (props: CreateProps) => (
  <Create {...props}>
    <SimpleForm
      submitOnEnter={false}
      redirect="edit"
      validate={validateHcsForm}
    >
      <TextInput
        label="Healthcareservice name"
        source="name"
        autoComplete="off"
        fullWidth
      />
      <ArrayInput source="endpoints">
        <SimpleFormIterator TransitionProps={TransitionProps}>
          <FormDataConsumer children={EndpointNameInput} />
          <FormDataConsumer children={EndpointAddressInput} />

          <SelectInput
            label="Endpoint Connection Type"
            source="connectionType"
            choices={connectionTypeChoices}
            fullWidth
          />
          <BooleanInput
            label="Verstecken vor Versicherten?"
            source="endpoint_hide_from_insurees"
          />
        </SimpleFormIterator>
      </ArrayInput>

      <SelectArrayInput
        source="serviceProvisionCode"
        choices={serviceProvisionCodeChoices()}
      />

      <BooleanInput source="appointmentRequired" label="Appointment required" />
    </SimpleForm>
  </Create>
);

export const HcsEdit = (props: EditProps) => (
  <Edit {...props} mutationMode="pessimistic">
    <SimpleForm validate={validateHcsForm}>
      <TextInput source="id" disabled />
      <TextInput source="name" autoComplete="off" />
      <TextInput source="organization_id" disabled />
      <TextInput source="organization_name" disabled />
      <ArrayInput source="endpoints">
        <SimpleFormIterator TransitionProps={TransitionProps}>
          <TextInput label="Endpoint ID" source="endpoint_id" disabled />
          <FormDataConsumer children={EndpointNameInput} />
          <FormDataConsumer children={EndpointAddressInput} />
          <SelectInput
            label="Endpoint Connection Type"
            source="connectionType"
            choices={connectionTypeChoices}
            defaultValue="tim"
            fullWidth
          />
          <BooleanInput
            label="Verstecken vor Versicherten?"
            source="endpoint_hide_from_insurees"
          />
        </SimpleFormIterator>
      </ArrayInput>

      <ArrayInput source="telecom">
        <SimpleFormIterator>
          <TextInput label="System" source="system" autoComplete="off" />
          <TextInput label="Value" source="value" autoComplete="off" />
          <TextInput label="Use" source="use" autoComplete="off" />
        </SimpleFormIterator>
      </ArrayInput>

      <ArrayInput source="communication">
        <SimpleFormIterator>
          <TextInput label="Language" source="language" autoComplete="off" />
        </SimpleFormIterator>
      </ArrayInput>

      <SelectArrayInput
        source="serviceProvisionCode"
        choices={serviceProvisionCodeChoices()}
      />

      <BooleanInput source="appointmentRequired" label="Appointment required" />
      <ArrayInput source="availableTime" label="Available time">
        <SimpleFormIterator>
          <TextInput
            label="Days of week"
            source="daysOfWeek"
            autoComplete="off"
          />
          <TextInput
            label="Available start time"
            source="availableStartTime"
            autoComplete="off"
          />
          <TextInput
            label="Available end time"
            source="availableEndTime"
            autoComplete="off"
          />
        </SimpleFormIterator>
      </ArrayInput>
      <TextInput
        source="availabilityExceptions"
        label="Availability exceptions"
        autoComplete="off"
      />

      <TextInput source="locationId" label="Location ID" autoComplete="off" />
    </SimpleForm>
  </Edit>
);

// both form content and validation result use the same shape
export type EndpointForm = {
  endpoint_name?: string;
  endpoint_address?: string;
  connectionType?: "tim" | "tim-fa" | "tim-bot";
  endpoint_hide_from_insurees?: boolean;
};

export type HcsForm = {
  name?: string;
  endpoints?: EndpointForm[];
  availableTime?: string;
};

const validateHcsForm = (form: HcsForm): HcsForm => {
  const errors: HcsForm = {};

  if (!form.name) {
    errors.name = "name is empty";
  }

  const validateEndpoint = (form: EndpointForm): EndpointForm | null => {
    if (!isObject(form)) {
      return {
        endpoint_name: "Name must not be empty!",
        endpoint_address: "Address must not be empty!",
        connectionType: null,
      };
    }
    const epError: EndpointForm = {};
    // Skip endpoint_name validation for connectionTypes refering a user, it will be
    // filled with User.displayname later.
    if (
      !form.endpoint_name &&
      !["tim-fa", "tim-bot"].includes(form.connectionType)
    ) {
      epError.endpoint_name = "Name must not be empty!";
    }

    if (!form.endpoint_address) {
      epError.endpoint_address = "Address must not be empty!";
    } else {
      if (!form.endpoint_address.match(/matrix:u\/.*:.*/)) {
        epError.endpoint_address =
          "Address must match matrix:u/name:homeserver!";
      }
    }
    return epError;
  };

  errors.endpoints = (form.endpoints ?? []).map(validateEndpoint);

  return errors;
};

const isObject = variable => typeof variable === "object" && variable !== null;
