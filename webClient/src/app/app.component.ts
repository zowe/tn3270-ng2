/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

import 'script-loader!./../lib/js/tn3270.js';
import { AfterViewInit, OnDestroy, Component, ElementRef, Input, ViewChild, Inject, Optional } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
declare var org_zowe_terminal_tn3270: any;

import { Angular2InjectionTokens, Angular2PluginWindowActions, Angular2PluginViewportEvents, ContextMenuItem } from 'pluginlib/inject-resources';

import { Terminal, TerminalWebsocketError} from './terminal';
import { ConfigServiceTerminalConfig, ZssConfig, KeySequencesConfig, KeySequence, Keys } from './terminal.config';

import './app.component.css';

const TOGGLE_MENU_BUTTON_PX = 16; //with padding
const CONFIG_MENU_ROW_PX = 40;
const CONFIG_MENU_PAD_PX = 4;
const CONFIG_MENU_SIZE_PX = (CONFIG_MENU_ROW_PX*2)+CONFIG_MENU_PAD_PX; //40 per row, plus 2 px padding

enum ErrorType {
  host,
  port,
  config,
  dimension,
  websocket
}

class ErrorState {
  private stateArray: Array<string|null> = new Array<string|null>();

  set(type: ErrorType, message: string|null) {
    this.stateArray[type] = message;
  }

  get(type:ErrorType): string|null {
    return this.stateArray[type];
  }

  clear(): void {
    this.stateArray.fill(null);
  }

  //should it block connection
  isStateBlocking(): boolean {
    if (this.stateArray[ErrorType.host] || this.stateArray[ErrorType.port] || this.stateArray[ErrorType.dimension] ){
      return true;
    }
    return false;
  }

  getFirstError(): string|null {
    for (let i = 0; i < this.stateArray.length; i++) {
      if (this.stateArray[i]) {
        return this.stateArray[i];
      }
    }
    return null;
  }
}

@Component({
  selector: 'com-rs-mvd-tn3270',
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit {
  @ViewChild('terminal')
  terminalElementRef: ElementRef;
  @ViewChild('terminalParent')
  terminalParentElementRef: ElementRef;
  terminal: Terminal;
  host:string;
  port:number;
  securityType:string;
  modType: string;
  connectionSettings: any;
  errorMessage: string = '';
  isDynamic: boolean;
  row: number;
  column: number;
  charsets: Array<any> = org_zowe_terminal_tn3270.TERMINAL_DEFAULT_CHARSETS;
  selectedCodepage: string = "1047: International";
  terminalDivStyle: any;
  showConnectionMenu: boolean;
  showKeySequencesMenu: boolean;
  keySequences: KeySequence[];
  keySequencesLoaded = false;
  private terminalHeightOffset: number = 0;
  private currentErrors: ErrorState = new ErrorState();
  disableButton: boolean;

  constructor(
    private http: HttpClient,
    @Inject(Angular2InjectionTokens.LOGGER) private log: ZLUX.ComponentLogger,
    @Inject(Angular2InjectionTokens.PLUGIN_DEFINITION) private pluginDefinition: ZLUX.ContainerPluginDefinition,
    @Inject(Angular2InjectionTokens.VIEWPORT_EVENTS) private viewportEvents: Angular2PluginViewportEvents,
    @Optional() @Inject(Angular2InjectionTokens.WINDOW_ACTIONS) private windowActions: Angular2PluginWindowActions,
    @Inject(Angular2InjectionTokens.LAUNCH_METADATA) private launchMetadata: any,
  ) {
    this.log.info('Recvd launch metadata='+JSON.stringify(launchMetadata));
    if (launchMetadata != null && launchMetadata.data) {
      switch (launchMetadata.data.type) {
      case "connect":
        if (launchMetadata.data.connectionSettings) {
          let cs = launchMetadata.data.connectionSettings;
          this.host = cs.host;
          this.port = cs.port;
          this.modType = ""+cs.deviceType;
          if (cs.security && cs.security.type){
            this.securityType = ""+cs.security.type;
          }
          if (this.modType === "5") {
            this.isDynamic = true;
            this.row = cs.alternateHeight ? cs.alternateHeight : 24;
            this.column = cs.alternateWidth ? cs.alternateWidth : 80;
          }
          this.connectionSettings = cs;
        }
        break;
      default:
        
      }
    }
    this.adjustTerminal(TOGGLE_MENU_BUTTON_PX);

    //defaulting initializations
    if (!this.host) this.host = "localhost";
    if (!this.port) this.port = 23;
    if (!this.modType) this.modType = "1";
    if (!this.securityType) this.securityType = "telnet";
    if (!this.row) this.row = 24;
    if (!this.column) this.column = 80;
  }

  ngOnInit(): void {
    this.viewportEvents.registerCloseHandler(():Promise<void>=> {
      return new Promise((resolve,reject)=> {
        this.ngOnDestroy();
        resolve();
      });
    });
  }
  
  modTypeChange(value:string): void {
    this.isDynamic = (value === "5");
  }

  ngAfterViewInit(): void {
    let log:ZLUX.ComponentLogger = this.log;
    log.debug('START: Tn3270 ngAfterViewInit');
    let dispatcher: ZLUX.Dispatcher = ZoweZLUX.dispatcher; 
    const terminalElement = this.terminalElementRef.nativeElement;
    const terminalParentElement = this.terminalParentElementRef.nativeElement;
    this.terminal = new Terminal(terminalElement, terminalParentElement, this.http, this.pluginDefinition, this.log);
    this.viewportEvents.resized.subscribe(() => this.terminal.performResize());
    if (this.windowActions) {
      this.terminal.contextMenuEmitter.subscribe( (info) => {
        let screenContext:any = info.screenContext;
        screenContext["sourcePluginID"] = this.pluginDefinition.getBasePlugin().getIdentifier();
        let recognizers:any[] = dispatcher.getRecognizers(screenContext);
        let menuItems:ContextMenuItem[] = [];
        for (let recognizer of recognizers){
          let action = dispatcher.getAction(recognizer);
          log.debug("Recognizer="+JSON.stringify(recognizer)+" action="+action);
          if (action){
            let menuCallback = () => {
              dispatcher.invokeAction(action,info.screenContext);
            }
            // menu items can also have children
            menuItems.push({text: action.getDefaultName(), action: menuCallback});
          }
        }
        this.windowActions.spawnContextMenu(info.x, info.y, menuItems);
      });
    }
    this.keySequencesReload();
    this.terminal.wsErrorEmitter.subscribe((error: TerminalWebsocketError)=> this.onWSError(error));
    if (!this.connectionSettings) {
      this.loadConfig().subscribe((config: ConfigServiceTerminalConfig) => {

        const contents = config.contents;
        this.host = contents.host;
        this.port = contents.port;
        this.securityType = contents.security.type;
        if (contents.deviceType) { this.modType = ''+contents.deviceType; }
        if (this.modType === "5") {
          this.isDynamic = true;
        }
        if (contents.alternateHeight) { this.row = contents.alternateHeight; }
        if (contents.alternateWidth) { this.column = contents.alternateWidth; }
        if (contents.charsetName) { this.selectedCodepage = contents.charsetName; }
        this.checkZssProxy().then(() => {
          this.connectionSettings = {
            host: this.host,
            port: this.port,
            security: {
              type: this.securityType
            },
            deviceType: Number(this.modType),
            alternateHeight: this.row,
            alternateWidth: this.column,
            charsetName: this.selectedCodepage
          }
          this.connectAndSetTitle(this.connectionSettings);
        })
      }, (error) => {
        if (error.status && error.statusText) {
          this.setError(ErrorType.config, `Config load status=${error.status}, text=${error.statusText}`);
        } else {
          this.log.warn(`Config load error=${error}`);
          this.setError(ErrorType.config, `Unknown config load error. Check browser log`);
        }
      });
    } else {
      this.connectAndSetTitle(Object.assign({
        host: this.host,
        port: this.port,
        security: {
          type: this.securityType
        },
        deviceType: Number(this.modType),
        alternateHeight: this.row,
        alternateWidth: this.column,
        charsetName: this.selectedCodepage
      }, this.connectionSettings));
    }
    log.debug('END: Tn3270 ngAfterViewInit');
  }

  ngOnDestroy(): void {
    this.terminal.close();
  }

  private onWSError(error: TerminalWebsocketError): void {
    let message = "Terminal closed due to websocket error. Code="+error.code;
    this.log.warn(message+", Reason="+error.reason);
    this.setError(ErrorType.websocket, message);
    this.disconnectAndUnsetTitle();
  }

  private setError(type: ErrorType, message: string):void {
    this.currentErrors.set(type, message);
    this.refreshErrorBar();
  }

  private clearError(type: ErrorType):void {
    let hadError = this.currentErrors.get(type);
    this.currentErrors.set(type, null);
    if (hadError) {
      this.refreshErrorBar();
    }
  }

  private clearAllErrors():void {
    this.currentErrors.clear();
    if (this.errorMessage.length > 0) {
      this.refreshErrorBar();
    }
  }

  private refreshErrorBar(): void {
    let error = this.currentErrors.getFirstError();

    let hadError = this.errorMessage.length > 0;
    if (error) {
      this.errorMessage = error;
      this.disableButton = this.currentErrors.isStateBlocking() ? true : false;
    } else {
      this.errorMessage = '';
      this.disableButton = false;
    }

    if ((error && !hadError) || (!error && hadError)) {
      let offset: number = error ? CONFIG_MENU_ROW_PX : -CONFIG_MENU_ROW_PX;
      this.adjustTerminal(offset);
    }    
  }  

  toggleMenu(state: boolean, menuID: string): void {
    let rows: number;
    let menuPadding: number;

    if (menuID === 'connectionMenu') {
      this.showConnectionMenu = state;
      rows = 2;
      menuPadding = this.showKeySequencesMenu ? 0 : 1;
    }
    if (menuID === 'keySequencesMenu') {
      this.showKeySequencesMenu = state;
      rows = 1;
      menuPadding = this.showConnectionMenu ? 0 : 1;
    }
    this.adjustTerminal(state ?
      (rows * CONFIG_MENU_ROW_PX + menuPadding * CONFIG_MENU_PAD_PX) : -(rows * CONFIG_MENU_ROW_PX + menuPadding * CONFIG_MENU_PAD_PX)
    );
  }

  private adjustTerminal(heightOffsetPx: number): void {
    this.terminalHeightOffset += heightOffsetPx;    
    this.terminalDivStyle = {
      top: `${this.terminalHeightOffset}px`,
      height: `calc(100% - ${this.terminalHeightOffset}px)`
    };
    if (this.terminal) {
      setTimeout(()=> {
        this.terminal.performResize();
      },100);
    }
  }

  /* I expect a JSON here*/
  zluxOnMessage(eventContext: any): Promise<any> {
    return new Promise((resolve,reject)=> {
      if (!eventContext || !eventContext.data) {
        return reject('Event context missing or malformed');
      }
      switch (eventContext.data.type) {
      case 'disconnect':
        resolve(this.disconnectAndUnsetTitle());
        break;
      case 'connectionInfo':
        let hostInfo = this.terminal.virtualScreen.hostInfo;
        this.log.debug('Hostinfo='+JSON.stringify(hostInfo));
        resolve(hostInfo);
        break;
      default:
        reject('Event context missing or unknown data.type');
      };
    });    
  }


  provideZLUXDispatcherCallbacks(): ZLUX.ApplicationCallbacks {
    return {
      onMessage: (eventContext: any): Promise<any> => {
        return this.zluxOnMessage(eventContext);
      }      
    }
  }

  checkZssProxy(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.host === "") {
        this.loadZssSettings().subscribe((zssSettings: ZssConfig) => {
          this.host = zssSettings.zssServerHostName;
          resolve(this.host);
        }, () => {
          this.setError(ErrorType.host, "Invalid Hostname: \"" + this.host + "\".")
          reject(this.host)
        });
      } else {
        resolve(this.host);
      }
    });
  }

  loadKeySequencesConfig(): Observable<KeySequencesConfig> {
    return this.http.get<KeySequencesConfig>(
      ZoweZLUX.uriBroker.pluginConfigForScopeUri(this.pluginDefinition.getBasePlugin(), 'user', 'sessions', '_keySequences.json')
    )
  }

  keySequncesLogDebug(keys: Keys): void {
    const debugPrexix = keys.normal ? `Normal: ${keys.normal}` :
      keys.special ? `Special : ${keys.special}` :
      keys.prompt ? `Prompt : ${keys.prompt}` : null;
    if (debugPrexix) {
      this.log.debug(`${debugPrexix} Ctrl(${keys.ctrl}) Alt(${keys.alt}) Shift(${keys.shift})`);
    }
  }

  async emulateKeyBoardEvent(keys: Keys): Promise<void> {

    const textAreaElement = this.terminalElementRef.nativeElement.querySelector('textArea#Input');
    if (textAreaElement === null) {
      this.log.warn('textArea#Input not found.');
      return;
    }

    if ([keys.normal, keys.special, keys.prompt].filter(Boolean).length > 1) {
      this.log.warn('Combination of \'normal\', \'special\' and \'propmt\' found. \
        Only one action will be processed in order \'normal\', \'special\' and \'prompt\'.'
      );
    }

    if (keys.normal) {
      this.keySequncesLogDebug(keys);
      for (let char = 0; char < keys.normal.length; char++) {
        textAreaElement.dispatchEvent(
          new KeyboardEvent('keydown', {'key': keys.normal[char], shiftKey: keys.shift, ctrlKey: keys.ctrl, altKey: keys.alt})
        );
      }
      return;
    }

    if (keys.special) {
      this.keySequncesLogDebug(keys);
      textAreaElement.dispatchEvent(
        new KeyboardEvent('keydown', {'key': keys.special, shiftKey: keys.shift, ctrlKey: keys.ctrl, altKey: keys.alt})
      );
      if (keys.special === 'Enter') {
        await new Promise(f => setTimeout(f, 1000));
      }
      return;
    }

    if (keys.prompt) {
      this.keySequncesLogDebug(keys);
      const promptValue = prompt(keys.prompt, '');
      this.log.debug(`Value: ${promptValue}`);
      for (let char = 0; char < promptValue.length; char++) {
        textAreaElement.dispatchEvent(new KeyboardEvent('keydown', {'key': promptValue[char]}));
      }
    }
    return;
  }

  async keySequenceAction(keySequenceIndex: number): Promise<void> {
    for (const k in this.keySequences[keySequenceIndex].keys) {
      if (this.keySequences[keySequenceIndex].keys.hasOwnProperty(k)) {
        await this.emulateKeyBoardEvent(this.keySequences[keySequenceIndex].keys[k]);
      }
    }
  }

  keySequencesReload(): void {
    this.loadKeySequencesConfig().subscribe((config: KeySequencesConfig) => {
      if (config) {
        this.keySequences = config.contents['keySequences'];
        if (this.keySequences) {
          this.keySequencesLoaded = true;
        }
        for (const k in this.keySequences) {
          if (this.keySequences.hasOwnProperty(k)) {
            this.log.debug(`${k} => ${this.keySequences[k].title}`);
          }
        }
      } else {
        this.keySequencesLoaded = false;
      }
    });
  }

  toggleConnection(): void {
    if (this.terminal.isConnected()) {
      this.disconnectAndUnsetTitle();
    } else {
      this.clearAllErrors(); //reset due to user interaction
      this.connectAndSetTitle({
        host: this.host,
        port: this.port,
        security: {
          type: this.securityType
        },
        deviceType: Number(this.modType),
        alternateHeight: this.row,
        alternateWidth: this.column,
        charsetName: this.selectedCodepage
      });
    }
  }

  private disconnectAndUnsetTitle() {
    this.terminal.close();
    if (this.windowActions) {this.windowActions.setTitle(`TN3270 - Disconnected`);}
  }

  private connectAndSetTitle(connectionSettings:any) {
    if (this.windowActions) {
      this.windowActions.setTitle(`TN3270 - ${connectionSettings.host}:${connectionSettings.port}`);
    }
    connectionSettings.charsetName = this.nameToCodepage(connectionSettings.charsetName);
    this.terminal.connectToHost(connectionSettings);
  }

  private nameToCodepage(name) {
    const stringName = isNaN(Number(name)) ? name : ''+name;
    for (let i = 0; i < this.charsets.length; i++) {
      if ((this.charsets[i].name == stringName) || (this.charsets[i].name.startsWith(stringName+':'))) {
        this.selectedCodepage = this.charsets[i].name;
        return this.selectedCodepage;
      }
    }
    return undefined;
  }

  //identical to isConnected for now, unless there's another reason to disable input
  get isInputDisabled(): boolean {
    return this.terminal.isConnected();
  }

  get isConnected(): boolean {
    return this.terminal.isConnected();
  }

  get powerButtonColor(): string {
    if (this.disableButton) {
      return "#bf3030";
    } else if (this.isConnected) {
      return "#17da38";
    } else {
      return "#b9b9b9";
    }
  }

  validateScreenDimension(): void {
    if (this.row < 0 || !Number.isInteger(this.row)) {
      this.setError(ErrorType.dimension, 'Row number missing or invalid');
    } else if (this.column < 0 || !Number.isInteger(this.column)) {
      this.setError(ErrorType.dimension, 'Column number missing or invalid');
    } else if ((this.row * this.column) > 16383) {
      let rowMax = Math.ceil(16383/this.column);
      let colMax = Math.ceil(16383/this.row);
      this.setError(ErrorType.dimension, `Screen dimension above 16383, decrease row to below ${rowMax} or column to below ${colMax}`);
    } else if (this.errorMessage.length > 0) {
      this.clearError(ErrorType.dimension);
    }
  }

  validatePort(): void {
    if (this.port < 0 || this.port > 65535 || !Number.isInteger(this.port)) {
      this.setError(ErrorType.port, `Port missing or invalid`);
    } else {
      this.clearError(ErrorType.port);
    }
  }

  validateHost(): void {
    if (!this.host) {
      this.setError(ErrorType.host, `Host missing or invalid`);
    } else {
      this.clearError(ErrorType.host);
    }
  } 


  loadConfig(): Observable<ConfigServiceTerminalConfig> {
    this.log.warn("Config load is wrong and not abstracted");
    return this.http.get<ConfigServiceTerminalConfig>(ZoweZLUX.uriBroker.pluginConfigForScopeUri(this.pluginDefinition.getBasePlugin(),'user','sessions','_defaultTN3270.json'))
  }

  loadZssSettings(): Observable<ZssConfig> {
    return this.http.get<ZssConfig>(ZoweZLUX.uriBroker.serverRootUri("server/proxies"))
  }

  saveSettings() {
    this.http.put(ZoweZLUX.uriBroker.pluginConfigForScopeUri(this.pluginDefinition.getBasePlugin(), 'user', 'sessions', '_defaultTN3270.json'),
      {
        deviceType: Number(this.modType),
        alternateHeight: this.modType === "5" ? this.row : 24,
        alternateWidth: this.modType === "5" ? this.column : 80,
        security: {
          type: this.securityType
        },
        port: this.port,
        host: this.host,
        charsetName: this.selectedCodepage
      }).subscribe((result: any)=> {
        this.log.debug('Save return');
    });
  }
}



/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

