# Changelog

All notable changes to this project will be documented in this file.

**Related change logs**:

- [messenger-client](https://github.com/tim-ref/messenger-client/blob/main/CHANGELOG.md)
- [messenger-org-admin](https://github.com/tim-ref/messenger-org-admin/blob/main/CHANGELOG.md)
- [messenger-proxy](https://github.com/tim-ref/messenger-proxy/blob/main/CHANGELOG.md)
- [messenger-push](https://github.com/tim-ref/messenger-push/blob/main/CHANGELOG.md)
- [messenger-rawdata-master](https://github.com/tim-ref/messenger-rawdata-master/blob/main/CHANGELOG.md)
- [messenger-registration-service](https://github.com/tim-ref/messenger-registration-service/blob/main/CHANGELOG.md)

<!--
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
-->

## [Unreleased]

## [0.13.1] (published on 2025-08-05)

### Fixed

- Endpoints not belonging to the admin's organization could be added to healthcare services.
- Location changes were ignored during healthcare service update.
- Validation during healthcare service creation does not fail due to missing location.

## [0.13.0] (published on 2025-03-25)

### Added

- This Changelog.

### Changed

- Updated project information in `package.json`.

## [0.12.0] (published on 2025-03-17)

## [0.11.0] (published on 2025-03-11)

### Added

- Practitioner's FHIR Endpoints can be hidden from insurees (AF_10377).
- Support for functional accounts (A_26525, A_25546, A_25547).

### Changed

- Allow '+' in Matrix identifiers.
- Improved validation of FHIR Endpoint addresses.

## [0.10.1] (published on 2025-02-18)

## [0.10.0] (published on 2024-07-04)

### Changed

- Adjusted `User-Agent ` header (A_23104-02).

## [0.9.0] (published on 2024-03-13)

### Changed

- FHIR Endpoint address validation allows Matrix URLs.
- Removed animation that interfered with automated testing.

## [0.8.8] (published on 2024-02-21)

### Added

- Added commit hash to website footer.

### Changed

- Added links to website footer.

