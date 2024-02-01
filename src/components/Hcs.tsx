/*
 * Copyright (C) 2023 akquinet GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import React from "react";

import {
  ArrayField,
  ArrayInput,
  BooleanInput,
  Create,
  Datagrid,
  Edit,
  List,
  SelectArrayInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
} from "react-admin";
import { serviceProvisionCodeChoices } from "../data_providers/hcs_mapper";

const listFilters = [
  <TextInput placeholder="Name" source="name:contains" alwaysOn />,
];

export const HcsList = props => (
  <List {...props} sort={{ field: "name", order: "ASC" }} filters={listFilters}>
    <Datagrid rowClick="edit" className="HealthcareService">
      <TextField source="id" sortable={false} />
      <TextField source="name" />
      <ArrayField source="endpoints">
        <Datagrid>
          <TextField source="endpoint_id" />
          <TextField source="endpoint_name" />
          <TextField source="endpoint_address" />
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

export const HcsCreate = props => (
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
      />
      <ArrayInput source="endpoints">
        <SimpleFormIterator>
          <TextInput
            label="Endpoint Name"
            source="endpoint_name"
            autoComplete="off"
          />
          <TextInput
            label="Endpoint Address"
            source="endpoint_address"
            autoComplete="off"
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

export const HcsEdit = props => (
  <Edit {...props} mutationMode="pessimistic">
    <SimpleForm validate={validateHcsForm}>
      <TextInput source="id" disabled />
      <TextInput source="name" autoComplete="off" />
      <TextInput source="organization_id" disabled />
      <TextInput source="organization_name" disabled />
      <ArrayInput source="endpoints">
        <SimpleFormIterator>
          <TextInput label="Endpoint ID" source="endpoint_id" disabled />
          <TextInput
            label="Endpoint Name"
            source="endpoint_name"
            autoComplete="off"
          />
          <TextInput
            label="Endpoint Address"
            source="endpoint_address"
            autoComplete="off"
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
      };
    }

    const epError: EndpointForm = {};
    if (!form.endpoint_name) {
      epError.endpoint_name = "Name must not be empty!";
    }

    if (!form.endpoint_address) {
      epError.endpoint_address = "Address must not be empty!";
    } else {
      if (!form.endpoint_address.match(/@.*:.*/)) {
        epError.endpoint_address = "Address must match @name:homeserver!";
      }
    }
    return epError;
  };

  errors.endpoints = (form.endpoints ?? []).map(validateEndpoint);

  return errors;
};

const isObject = variable => typeof variable === "object" && variable !== null;
