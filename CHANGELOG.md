# Basic TN3270 Display Emulator Changelog

## `3.0.1`
- Parameterized the behavior of the Backspace key. Now its behavior can be changed both in the config file and on the GUI. (A new checkbox is added to the connection settings tool bar.)

## `3.0.0`
- Enhancement: TN3270 always sent that CCSID=37 is used, when communicating with host. Following CCSIDs are now correctly identified: 037, 273, 275, 277, 278, 280, 284, 285, 297, 424, 437, 500, 870, 871, 875, 924, 1025, 1047, 1140, 1141, 1142, 1143,1144, 1145, 1146, 1147, 1148.

## `1.0.0`
 
- Breaking change: Upgrade to Angular 12, Typescript 4, and Corejs 3 to match Desktop libraries in Zowe v2. This app may no longer work in the Zowe v1 Desktop, and v2 should be used instead.

## `0.11.1`

- Bugfix: Codepage could not be set by the full strings such as "290: Japanese Katakana", but only by "290". Now, both are accepted.

## `0.11.0`

- Added ability to save connection preferences on a per-user level via the floppy disk save icon
- Removed dependency upon rxjs-compat, to clean up code and reduce package size.
- Reorganized the codepage list to make it easier to search for the right encoding
- Added codepage 284 and 1145 for Spain and Latin America
