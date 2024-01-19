This program and the accompanying materials are
made available under the terms of the Eclipse Public License v2.0 which accompanies
this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

SPDX-License-Identifier: EPL-2.0

Copyright Contributors to the Zowe Project.
# 3270 Terminal App
This an application that presents a basic IBM 3270 terminal emulator within the Zowe UI environment.

**To request features or report bugs, please use the issues page at the [zlux repo](https://github.com/zowe/zlux/issues) with the terminal, app, or tn3270-ng2 tags**

## Usage
See the zowe documentation: https://docs.zowe.org/stable/user-guide/mvd-3270/

## Building
See the zowe documentation: https://docs.zowe.org/stable/extend/extend-desktop/mvd-buildingplugins/

## Customizing the default connection parameters

When this application is opened in the Zowe UI by the user, the application and its zLUX server try to establish a corresponding back end connection to the default host using the standard TN3270E protocol.
This default can be changed, and is controlled by https://github.com/zowe/tn3270-ng2/blob/v2.x/master/config/storageDefaults/sessions/_defaultTN3270.json which is stored within the [configuration dataservice](https://docs.zowe.org/stable/extend/extend-desktop/mvd-configdataservice/) at runtime.

If you are running Zowe entirely on the mainframe, then the default host value of `localhost` is fine, but if you are running the zLUX server off the mainframe, then you will want to change this default when building the application by editing `/config/storageDefaults/_defaultTN3270.json`.

