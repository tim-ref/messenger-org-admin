#Modified by akquinet GmbH on 16.10.2023
 #
 #Originally forked https://github.com/Awesome-Technologies/synapse-admin
 #
 #Licensed under the Apache License, Version 2.0 (the "License");
 #you may not use this file except in compliance with the License.
 #You may obtain a copy of the License at
 #
 #     http://www.apache.org/licenses/LICENSE-2.0
 #
 #Unless required by applicable law or agreed to in writing, software
 #distributed under the License is distributed on an "AS IS" BASIS,
 #WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 #
 #See the License for the specific language governing permissions and
 #limitations under the License.

# Builder
FROM node:18-alpine as base

ARG PUBLIC_URL=/
ARG REACT_APP_SERVER
ARG REACT_APP_VERSION
ARG REACT_APP_COMMIT_SHA

WORKDIR /src

COPY package.json yarn.lock /src/
RUN yarn --network-timeout=100000 install
COPY tsconfig.json /src/

COPY src/ /src/src
COPY public/ /src/public
ENV DISABLE_ESLINT_PLUGIN true
RUN PUBLIC_URL=$PUBLIC_URL yarn build

# App
FROM nginx:alpine as final
LABEL maintainer="TIMREF Maintainers"
ENV VZD_SCHEME=http
ENV REGSERVICE_SCHEME=http

COPY default.conf.template /etc/nginx/templates/
COPY --from=base /src/build /usr/share/nginx/html

