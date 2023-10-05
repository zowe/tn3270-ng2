# Basic TN3270 Display Emulator Changelog

## `1.0.0`
 
- Breaking change: Upgrade to Angular 12, Typescript 4, and Corejs 3 to match Desktop libraries in Zowe v2. This app may no longer work in the Zowe v1 Desktop, and v2 should be used instead.

## `0.11.1`

- Bugfix: Codepage could not be set by the full strings such as "290: Japanese Katakana", but only by "290". Now, both are accepted.

## `0.11.0`

- Added ability to save connection preferences on a per-user level via the floppy disk save icon
- Removed dependency upon rxjs-compat, to clean up code and reduce package size.
- Reorganized the codepage list to make it easier to search for the right encoding
- Added codepage 284 and 1145 for Spain and Latin America
