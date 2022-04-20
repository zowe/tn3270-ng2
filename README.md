This program and the accompanying materials are
made available under the terms of the Eclipse Public License v2.0 which accompanies
this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

SPDX-License-Identifier: EPL-2.0

Copyright Contributors to the Zowe Project.
# TN3270 App
This an App that presents a TN3270 emulator within the Zowe UI environment.

**To request features or report bugs, please use the issues page at the [zlux repo](https://github.com/zowe/zlux/issues) with the terminal, app, or tn3270-ng2 tags**

## Building
See the zowe documentation: https://docs.zowe.org/stable/extend/extend-desktop/mvd-buildingplugins/

## Customizing the default connection parameters

When this App is opened in the Zowe UI by the user, it tries to connect to the default host.
This default can be changed, and is controlled by https://github.com/zowe/tn3270-ng2/blob/v2.x/master/config/storageDefaults/_defaultTN3270.json which is stored within the [configuration dataservice](https://docs.zowe.org/stable/extend/extend-desktop/mvd-configdataservice/) at runtime.

If you are running Zowe entirely on-mainframe, then the default host value of "localhost" is fine, but if you are running the zLUX server off-mainframe, then you will want to change this default when building the App, by editing /config/storageDefaults/_defaultTN3270.json.

## Customizing the key sequences 
The key sequences feature allows users to define own key sequences. Each key sequence is basically a clipboard with possibility of using the modifiers keys (Ctrl, Alt, Shift), function keys (F1, F2, ...) and the combinations (such as Ctrl+E or Shift+F1). The definition is stored in the https://github.com/zowe/tn3270-ng2/blob/v2.x/staging/config/storageDefaults/sessions/_keySequences.json file.

## Syntax of the key sequences
* ```keySequences``` is an array of individual key sequences
* ```title``` will be displayed in the key sequences menu
* ```description``` is used as hover help for each item in the key sequences menu
* ```keys``` is an array of the key strokes
  * ```normal``` for the typewriter keys
  * ```special``` for the function, modifiers and other special keys
    * The value corresponds to the javascript key code
  * ```prompt``` is used for user input and this input is pasted on the current cursor position
 * ```ctrl```, ```alt``` and ```shift``` are boolean values for setting modifiers keys
* If you combine ```normal```, ```special``` or ```prompt``` in one array item, only one action will be made in the order of ```normal```, ```special``` and ```prompt```

## Example
Let's show this on the 2 defined key sequences: 
* Hello, world
  * Types ```Hello, world``` only
* ISPF command SWAP NEXT
  * Presses ```Home``` to get on the command line/input field
  * ```Ctrl+E``` will delete whatever might be in the input field
    * ```Ctrl+E``` is predefined in the TN3270 as "EOF - Erase end of field"
  * Types ```SWAP NEXT```
  * Hits ```Enter```
```
{ "keySequences":
  [
    { "title": "Hello, world",
      "description": "Types Hello, world",
       "keys": [ { "normal":  "Hello, world" } ]
    },
    { "title": "SWAP NEXT",
      "description": "ISPF: Swap next command",
       "keys": [ { "special": "Home" },
                 { "normal":  "E", "ctrl": "true" },
                 { "normal":  "SWAP NEXT" },
                 { "special": "Enter" } 
               ]
    }
  ]
}
```
