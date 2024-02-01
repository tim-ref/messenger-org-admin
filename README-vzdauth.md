# VZD Auth
As an organization administrator I want to manage healthcare services.
An `owner_token`is required to interact with the VZD.

Only the _admin_ user who was automatically created during homeserver instance creation, can manage healthcare services in VZD.

## Quick access
Execute the getOwnerToken-test in the [get_owner_token.test.ts](src/data_providers/get_owner_token.test.ts)-file.
In the console you will receive a JavaScript command which you then just need to execute in your browser.

## Request an owner_token

```mermaid
    sequenceDiagram
    participant oac as OrgAdmin-Client
    participant mhome as Matrix-Homerserver
    participant reg as Registrierungsdienst
    participant vzd as VZD

    oac ->>+ mhome: Login via /_matrix/client/v3/login
    mhome -->>- oac: Access Token
    oac ->>+ mhome: Token exchange via /_matrix/client/v3/user/<domain>/openid/request_token
    mhome -->>- oac: Bearer Token
    oac ->>+ reg: POST multipart/formdata request_token: Bearer Token via /regservice/backend/regservice/openid/user/{userId}/requesttoken
    reg ->>+ mhome: Verify auth request via GET /_matrix/federation/v1/openid/userinfo
    mhome -->>- reg: Response: Matrix User ID
    reg -->>- oac: Response: Auth Token
    oac ->>+ vzd: Login with Header Authorization: AuthToken via GET /vzd/owner-authenticate
    vzd ->> vzd: Verifies token using the certificate chain
    vzd -->>- oac: Response: Access Token
    oac ->>+ vzd: GET /vzd/owner/HealthcareService
    vzd -->>- oac: Response: application/json Healthcare Services
```

## Cache the owner_token in the browser storage

```mermaid
sequenceDiagram
    participant Browser
    participant LocalStorage
    participant VZD

    alt owner_token not cached
        Browser ->> VZD: owner_authenticate(): owner_token
        Browser ->> LocalStorage: cache owner_token
    else owner_token in cache
        Browser ->> LocalStorage: retrieve owner_token from cache
    end
    Browser ->>+ VZD: interact with VZD: request(owner_token)
    VZD -->>- Browser: response

    alt response is HTTP error (e.g. JWS token expired)
        Browser ->> LocalStorage: remove owner token from storage
    end
```
