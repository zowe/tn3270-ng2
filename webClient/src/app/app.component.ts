/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

import 'script-loader!./../lib/js/tn3270.js';
import { AfterViewInit, OnDestroy, Component, ElementRef, Input, ViewChild, Inject } from '@angular/core';
import {Http, Response} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
declare var TERMINAL_DEFAULT_CHARSETS: any;

import { Angular2InjectionTokens, Angular2PluginWindowActions, Angular2PluginViewportEvents, ContextMenuItem } from 'pluginlib/inject-resources';

import {Terminal} from './terminal';
import {ConfigServiceTerminalConfig, TerminalConfig} from './terminal.config';

@Component({
  selector: 'com-rs-mvd-tn3270',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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
  hasError: boolean;
  isDynamic: boolean;
  private lastRow: number;
  row: number;
  private lastColumn: number;
  column: number;
  charsets: Array<any>;
  selectedCodepage: string;
  terminalDivStyle: any;
  showMenu: boolean;

  constructor(
    private http: Http,
    @Inject(Angular2InjectionTokens.LOGGER) private log: ZLUX.ComponentLogger,
    @Inject(Angular2InjectionTokens.PLUGIN_DEFINITION) private pluginDefinition: ZLUX.ContainerPluginDefinition,
    @Inject(Angular2InjectionTokens.VIEWPORT_EVENTS) private viewportEvents: Angular2PluginViewportEvents,
    @Inject(Angular2InjectionTokens.WINDOW_ACTIONS) private windowActions: Angular2PluginWindowActions,
    @Inject(Angular2InjectionTokens.LAUNCH_METADATA) private launchMetadata: any,
  ) {   
    this.log.debug("Component Constructor");
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
    //initializations
    this.terminalDivStyle = {
      top: `14px`,
      height: `calc(100% - 14px)`
    }    
    this.charsets = TERMINAL_DEFAULT_CHARSETS;
    if (!this.host) this.host = "localhost";
    if (!this.port) this.port = 23;
    if (!this.modType) this.modType = "1";
    if (!this.securityType) this.securityType = "0";
    if (!this.row) this.row = 24;
    if (!this.column) this.column = 80;
    this.lastRow = this.row;
    this.lastColumn = this.column;
    this.selectedCodepage = "International EBCDIC 1047";
  }

  ngOnInit(): void {
    this.windowActions.registerCloseHandler(():Promise<void>=> {
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
    log.info('START: Tn3270 ngAfterViewInit');
    let dispatcher: ZLUX.Dispatcher = ZoweZLUX.dispatcher; 
    log.info("JOE.Tn3270 app comp, dispatcher="+dispatcher);
    const terminalElement = this.terminalElementRef.nativeElement;
    const terminalParentElement = this.terminalParentElementRef.nativeElement;
    this.terminal = new Terminal(terminalElement, terminalParentElement, this.http, this.pluginDefinition, this.log);
    this.viewportEvents.resized.subscribe(() => this.terminal.performResize());
    this.terminal.contextMenuEmitter.subscribe( (info) => {
      let screenContext:any = info.screenContext;
      screenContext["sourcePluginID"] = this.pluginDefinition.getBasePlugin().getIdentifier();
      log.info("app.comp subcribe lambda, dispatcher="+dispatcher);
      let recognizers:any[] = dispatcher.getRecognizers(screenContext);
      log.info("recoginzers "+recognizers);
      let menuItems:ContextMenuItem[] = [];
      for (let recognizer of recognizers){
        let action = dispatcher.getAction(recognizer);
        log.debug("JOE:recognizer="+JSON.stringify(recognizer)+" action="+action);
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
    if (!this.connectionSettings) {
      this.loadConfig().subscribe((config: ConfigServiceTerminalConfig) => {
        this.host = config.contents.host;
        this.port = config.contents.port;
        this.connectionSettings = {
          host: this.host,
          port: this.port
        }
        this.terminal.connectToHost(this.connectionSettings);
      });
    } else {
      this.terminal.connectToHost(this.connectionSettings);
    }
    log.info('END: Tn3270 ngAfterViewInit');
  }

  ngOnDestroy(): void {
    this.terminal.close();
  }

  toggleMenu(state:boolean): void {
    this.showMenu = state;
    let offset = state ? 94 : 14;
    this.terminalDivStyle = {
      top: `${offset}px`,
      height: `calc(100% - ${offset}px)`
    };
    setTimeout(()=> {
      this.terminal.performResize();
    },100);
  }

  /* I expect a JSON here*/
  zluxOnMessage(eventContext: any): Promise<any> {
    return new Promise((resolve,reject)=> {
      if (!eventContext || !eventContext.data) {
        return reject('Event context missing or malformed');
      }
      switch (eventContext.data.type) {
      case 'disconnect':
        resolve(this.terminal.close());
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

  toggleConnection(): void {
    if (this.terminal.isConnected()) {
      this.terminal.close();
    } else {
      this.terminal.connectToHost({
        host: this.host,
        port: this.port,
        security: {
          type: Number(this.securityType)
        },
        deviceType: Number(this.modType),
        alternateHeight: this.row,
        alternateWidth: this.column,
        charsetName: this.selectedCodepage
      });
    }
  }

  validateScreenDimension(): void {
    if ((this.row * this.column) > 16383) {
      this.row = this.lastRow;
      this.column = this.lastColumn;
    } else {
      this.lastRow = this.row;
      this.lastColumn = this.column;
    }
  }


  loadConfig(): Observable<ConfigServiceTerminalConfig> {
    this.log.warn("Config load is wrong and not abstracted");
    return this.http.get(ZoweZLUX.uriBroker.pluginConfigForScopeUri(this.pluginDefinition.getBasePlugin(),'instance','sessions','_defaultTN3270.json'))
      .map((res: Response) => res.json());
  }
}



/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

