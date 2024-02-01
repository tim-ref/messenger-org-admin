#!/usr/bin/env bash

#
# Copyright (C) 2023 akquinet GmbH
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
# You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and limitations under the License.
#

# chang into script directory
cd "$(dirname "$0")"

echo "Cleanup existing server"
docker rm -f synapse

echo "Generating configuration"

docker run -it --rm \
    --mount type=bind,source="$(pwd)"/data,target=/data \
    -e SYNAPSE_SERVER_NAME=localhost \
    -e SYNAPSE_REPORT_STATS=no \
    matrixdotorg/synapse:latest generate


echo "Starting server"

docker run -d --name synapse \
    --mount type=bind,source="$(pwd)"/data,target=/data \
    -p 8008:8008 \
    matrixdotorg/synapse:latest

echo "Wait for server to be ready"

timeout 20 bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' localhost:8008)" != "200" ]]; do sleep 5; echo -n "."; done' || false

echo "Creating  user admin with password admin"

docker exec -it synapse register_new_matrix_user http://localhost:8008 -c /data/homeserver.yaml -a -u admin -p admin

echo ""
echo "Server running at http://localhost:8008"

read -p "Press enter to stop"

docker rm -f synapse
