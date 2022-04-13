

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

export class TerminalConfig {
  constructor(
    public host: string,
    public port: number,
    public security: SecurityConfig,
    public deviceType?: number,
    public alternateHeight?: number,
    public alternateWidth?: number,
    public charsetName?: string
  ) {

  }
}

export class SecurityConfig {
  constructor(
    public type: string
  ) {

  }
}

export class ConfigServiceTerminalConfig {
  constructor(
    public _objectType: string,
    public _metadataVersion: string,
    public resource: string,
    public contents: TerminalConfig
  ) {

  }
}

export class ZssConfig {
  constructor(
    public zssServerHostName: string,
    public zssPort: string
  ) {
  }
}

export class Keys {
  constructor(
    public normal?: string,
    public special?: string,
    public prompt?: string,
    public ctrl?: boolean,
    public alt?: boolean,
    public shift?: boolean,
  ) {

  }
}

export class KeySequence {
  constructor(
    public title: string,
    public description?: string,
    public keys?: Keys[]
  ) {

  }
}

export class KeySequencesConfig {
  constructor(
    public _objectType: string,
    public _metadataVersion: string,
    public resource: string,
    public contents: KeySequence[]
  ) {

  }
}

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

