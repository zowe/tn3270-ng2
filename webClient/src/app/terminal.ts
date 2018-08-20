

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
import { Subject } from 'rxjs/Subject';

declare var start3270: any;

import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptionsArgs} from '@angular/http';
import {Observable} from 'rxjs/Rx';

export class TerminalStateHelper {
  private static url:string = `${window.location.protocol}//${window.location.host}/ZLUX/plugins/com.rs.zossystem.subsystems/services/data/zosDiscovery/system/tn3270`;
  
  constructor(public http: Http, 
              public log: ZLUX.ComponentLogger){
  }

  getAll(luname?:string): Observable<any> {
    let result = this.http
      .get(luname ? TerminalStateHelper.url+'?luname='+luname : TerminalStateHelper.url, this.getHeaders()).map((res:Response)=>res.json());
    result.catch(this.handleError);

    return result;
  }

  getHeaders(): RequestOptionsArgs {
    let headers = new Headers();
    let result: RequestOptionsArgs = {headers: headers};

    headers.append('Accept', 'application/json');

    return result;
  }
  
  handleError(error: any): Observable<void> {
    let errorMsg = error.message || 'Failure to retrieve TN3270/VTAM/TSO data';

    return Observable.throw(errorMsg);
  }
}

export class Terminal {
  virtualScreen: any;
  contextMenuEmitter: Subject<any>;
  constructor(
    private terminalElement: HTMLElement,
    private terminalParentElement: HTMLElement,
    public http: Http,
    public pluginDefinition: ZLUX.ContainerPluginDefinition,
    private log: ZLUX.ComponentLogger
  ) {
    this.contextMenuEmitter = new Subject();
  }

  connectToHost(connectionSettings: any) {
    const computedStyle = getComputedStyle(this.terminalElement, null);
    const width = parseInt(computedStyle.getPropertyValue('width'));
    const height = parseInt(computedStyle.getPropertyValue('height'));
    const helper:TerminalStateHelper = new TerminalStateHelper(this.http,this.log);


    const myHost = window.location.host;
    const protocol = window.location.protocol;
    const wsProtocol = (protocol === 'https:') ? 'wss:' : 'ws:';
    connectionSettings.url = `${wsProtocol}//${myHost}${RocketMVD.uriBroker.serverRootUri('ZLUX/plugins/com.rs.terminalproxy/services/tn3270data')}`;
    connectionSettings.connect = true;
    // logic for using dispatcher goes here
    // should be in Tn3270Service.js eventually
    let latestContext = {};
    const screenLoadedCallback = () => {
      helper.getAll(this.virtualScreen.getLUName()).subscribe(data=> {
        if (data.rows && data.rows.length === 1) {
          latestContext = data.rows[0];
          this.log.debug("screenContext from discovery="+JSON.stringify(latestContext, null, 2));
        }
      });
    };
    const contextCallback = (mouseEvent, screenContext) => {
      var x = mouseEvent.offsetX;
      var y = mouseEvent.offsetY;
      mouseEvent.preventDefault();
      this.log.debug("screenContext scraped=" + JSON.stringify(screenContext, null, 2));
      let dataKeys = Object.keys(latestContext);
      for (let i = 0; i < dataKeys.length; i++) {
        if (!screenContext[dataKeys[i]]) {
          screenContext[dataKeys[i]] = latestContext[dataKeys[i]];
        }
      }
      this.log.debug("Context callback. screenID="+screenContext.screenID+" x="+x+" y="+y);
      this.log.debug("screenContext combined=" + JSON.stringify(screenContext, null, 2));
      this.contextMenuEmitter.next({ x: x, y: y, screenContext: screenContext});
      
    }


    this.virtualScreen = start3270({parentDiv:this.terminalElement,
                                    width: width, height: height},
                                   connectionSettings,
                                   null,{contextCallback:contextCallback,
                                         screenLoadedCallback: screenLoadedCallback});
  }

  isConnected(): boolean {
    return this.virtualScreen && this.virtualScreen.isConnected();
  }

  close() {
    if (this.virtualScreen) {
      this.virtualScreen.closeConnection(4000, "Closed by user");
    }
    this.virtualScreen = null;
  }

  performResize() {
    this.virtualScreen.handleContainerResizeFromUI(this.terminalElement, this.virtualScreen);
  }
}



/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

