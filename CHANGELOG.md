# Basic TN3270 Display Emulator Changelog

## `3.6.0`
- Bugfix: if unknown security options is specified, fallback to `tls` ([#109](https://github.com/zowe/tn3270-ng2/pull/109))
- Bugfix: Do not log prompt value in debug mode ([#107](https://github.com/zowe/tn3270-ng2/pull/107))
- Bugfix: Default to port 992, tls ([#111](https://github.com/zowe/tn3270-ng2/pull/111))

## `3.3.0`
- Enhancement: LU name is displayed in the windows title [#101](https://github.com/zowe/tn3270-ng2/pull/101)

## `3.1.0`
- Enhancement: Parameterized behavior of the Backspace key: move cursor only (default) or delete characters. Configurable via config or GUI. [#100](https://github.com/zowe/tn3270-ng2/pull/100)

## `3.0.0`
- Enhancement: TN3270 always sent that CCSID=37 is used, when communicating with host. Following CCSIDs are now correctly identified: 037, 273, 275, 277, 278, 280, 284, 285, 297, 424, 437, 500, 870, 871, 875, 924, 1025, 1047, 1140, 1141, 1142, 1143,1144, 1145, 1146, 1147, 1148. [#95](https://github.com/zowe/tn3270-ng2/pull/95)

## `1.0.0`
 
- Breaking change: Upgrade to Angular 12, Typescript 4, and Corejs 3 to match Desktop libraries in Zowe v2. This app may no longer work in the Zowe v1 Desktop, and v2 should be used instead.

## `0.11.1`

- Bugfix: Codepage could not be set by the full strings such as "290: Japanese Katakana", but only by "290". Now, both are accepted.

## `0.11.0`

- Added ability to save connection preferences on a per-user level via the floppy disk save icon
- Removed dependency upon rxjs-compat, to clean up code and reduce package size.
- Reorganized the codepage list to make it easier to search for the right encoding
- Added codepage 284 and 1145 for Spain and Latin America
