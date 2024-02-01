#!/bin/bash -e
#Copyright (C) 2023 akquinet GmbH
 #
 #Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 #You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 #software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 #See the License for the specific language governing permissions and limitations under the License.

goal_dockerbuild() {
  docker build -t org-admin-client:latest --build-arg REACT_APP_VERSION=localbuild .
}

goal_dockerbash() {
  docker run --rm -ti --name org-admin-client org-admin-client:latest /bin/sh
}

goal_test() {
  goal_dockerbuild
  docker-compose up -d --wait
  set +e
  curl --fail http://localhost:8280 | grep "Synapse-Admin"
  result=$?
  set -e
  docker-compose down --remove-orphans

  if [ $result != 0 ]; then
    echo "unexpected status $result"
    exit 1
  fi
}

goal_help() {
  echo "usage: $0 <goal>
    available goals

    help - display this

    "
  exit 1
}

main() {
  local TARGET=${1:-}
  if [ -n "${TARGET}" ] && type -t "goal_$TARGET" &>/dev/null; then
    "goal_$TARGET" "${@:2}"
  else
    goal_help
  fi
}

main "$@"
