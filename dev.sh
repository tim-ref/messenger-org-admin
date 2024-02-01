#!/usr/bin/env bash

set -e
set -u
set -o pipefail

cleanup() {
	docker rm -f synapse &>/dev/null || :
	docker rm -f postgres &>/dev/null || :
	pkill -P $$ || :
	wait
}

trap cleanup EXIT
cleanup

printf "Preparing synapse configuration\n"

docker run --rm \
	--mount type=bind,source="$(pwd)"/local-server/data,target=/data \
	-e SYNAPSE_SERVER_NAME=localhost \
	-e SYNAPSE_REPORT_STATS=no \
	matrixdotorg/synapse:latest generate

printf "Starting synapse\n"
docker run -d --name synapse \
	--mount type=bind,source="$(pwd)"/local-server/data,target=/data \
	-p 8008:8008 \
	matrixdotorg/synapse:latest >/dev/null

printf "Starting postgres\n"

docker run -d --name postgres -p5432:5432 \
	-ePOSTGRES_DB=registration-service-db -ePOSTGRES_USER=registration-service -ePOSTGRES_PASSWORD=password postgres:15 >/dev/null

printf "Starting registration-service\n"
(
	cd ../registration-service/backend
	REGSERVICE_MATRIX_CLIENT_SCHEME=http \
		REGSERVICE_MATRIX_CLIENT_PORT=8008 \
		REGSERVICE_MATRIX_SERVER_SCHEME=http \
		REGSERVICE_MATRIX_SERVER_PORT=8008 \
		SPRING_PROFILES_ACTIVE=local \
		mvn spring-boot:run &>/dev/null
) &

printf "Starting vzd-mock\n"
(
	cd ../vzd-mock
	SERVER_PORT=8090 mvn spring-boot:run &>/dev/null
) &

(
	await_synapse() {
		while ! docker exec synapse curl -fs --head http://localhost:8008 >/dev/null; do
			printf "S"
			sleep 0.5
		done
	}

	await_postgres() {
		while ! nc -z localhost 5432 </dev/null &>/dev/null; do
			printf "P"
			sleep 0.5
		done
	}

	await_regservice() {
		while ! nc -z localhost 8080 </dev/null &>/dev/null; do
			printf "R"
			sleep 0.5
		done
	}

	await_vzd() {
		while ! nc -z localhost 8090 </dev/null &>/dev/null; do
			printf "V"
			sleep 0.5
		done
	}

	await_synapse &
	await_postgres &
	await_regservice &
	await_vzd &
	wait
	printf "\nServices started\n"
)

printf "Ensuring admin account\n"
docker exec -it synapse register_new_matrix_user http://localhost:8008 -c /data/homeserver.yaml -a -u admin -p admin &>/dev/null || :

REACT_APP_SERVER=http://localhost:8008 \
	REACT_APP_VZD=http://localhost:8090 \
	REACT_APP_REGSERVICE=http://localhost:8080/backend/regservice \
	yarn start
