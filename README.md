# TIM Referenzimplementierung - OrgAdmin Client
This project contains the TIM reference implementation of a OrgAdmin Client instance.

* Forked from [https://github.com/Awesome-Technologies/synapse-admin](https://github.com/Awesome-Technologies/synapse-admin), version: 0.8.5
* Original readme: [README_ORIGINAL.md](README_ORIGINAL.md)

## Requirements

* [Node.js](https://nodejs.org/) v18+
* [Yarn](https://yarnpkg.com/)

## Usage

* Create a `.env`-file (**do not check into git!**) with the following content.
    ```text
    REACT_APP_VERSION=$npm_package_version
    REGSERVICE_OPENID_TOKEN=REDACTED
    REACT_APP_REGSERVICE_TOKEN=REDACTED
    REACT_APP_VZD=REDACTED
    ```
  > You can find the _REDACTED_ values in gitlab: Settings->CI/CD->Variables.

* Use `./local-server/run-synapse-server.sh` to start a local synapse server with user `admin` and password `admin` and port [8008](http://localhost:8008).

* Use `yarn install` to install all dependencies

* Use `yarn start` to start the UI at [http://localhost:3000/](http://localhost:3000/)

  > To use all features of the orgAdmin, you also need an owner token. How to get this is described in the [README-vzdauth.md](README-vzdauth.md)

* Use `yarn test --watchAll=false` to run tests (`yarn test` for watch mode).

* Use `yarn run fix` to autofix codestyle violations 🤞.


## Deployment to RU
The deployment to stage RU is configured to be triggered manually.
Before triggering the deployment, make sure you increased the app version in package.json
following these guidelines: https://legacy.reactjs.org/docs/faq-versioning.html
For deployment to RU: Select the pipeline of the last commit on develop branch and run the step 'deploy-ru'.


## End to end tests with Cypress

> A local chrome browser is required for a local setup!

* Create the file `e2e/cypress.env.json` (**do not check into git!**) with the following content:

  ```json
  {
    "HOME_SERVER_URL": "https://your-homeserver.dev",
    "ORG_ADMIN_USERNAME": "REDACTED",
    "ORG_ADMIN_PASSWORD": "REDACTED"
  }
  ```
  > You can find the _REDACTED_ values in gitlab: Settings->CI/CD->Variables.

* To run cypress tests locally pass in the required environment variables like this

  ```shell
  REACT_APP_VZD=https://org-admin-client.eu.timref.akquinet.nx2.dev/vzd 
  REACT_APP_REGSERVICE=https://registrierungs-dienst.ru.timref.akquinet.nx2.dev/backend/regservice 
  CYPRESS_ORG_ADMIN_PASSWORD=REDACTED 
  REACT_APP_REGSERVICE_TOKEN=REDACTED 
  yarn e2e
  ```

  > You can find the _REDACTED_ values in gitlab: Settings->CI/CD->Variables.


### Cypress ui
Required react app to be running: `yarn start`

```bash
cd e2e
yarn cypress open
```

### Tips for e2e tests
Videos and Screenshots of your latest testrun are saved in `e2e/cypress/videos` and `e2e/cypress/snapshot`.

#### Problems with click events
Sometimes click events fail, because the clickable element is not visible on the screen.
You can solve this, by setting a reasonable viewport if the problem is, that the default window is smaller than expected:
```ts
  beforeEach("before all tests login", () => {
    cy.viewport('macbook-16');
  });
```
It can also happen, that the dom just does not correctly scroll to the element or even that the click event scrolls away.
An example solution would be to scroll the clickable element into view and disable the scroll behaviour of the click:
```ts
cy.contains("Delete").scrollIntoView().click({scrollBehavior:false});
```
