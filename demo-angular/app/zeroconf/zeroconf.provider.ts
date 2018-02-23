import { EventEmitter, Injectable } from '@angular/core';
import { Observable, PropertyChangeData } from 'tns-core-modules/data/observable';

import { Zeroconf } from 'nativescript-zeroconf';

@Injectable()
export class ZeroconfProvider {
  public servicesUpdated = new EventEmitter();

  private zeroconf:Zeroconf;
  private serviceType:string = '_ljn._tcp.';
  private services:Array<any> = [];

  constructor() {

    this.zeroconf = new Zeroconf(this.serviceType);

    /* define event listeners */

    this.zeroconf.on(Observable.propertyChangeEvent, (data: PropertyChangeData) => {
      switch(data.propertyName.toString()) {
        case 'serviceFound': {
          this.services.push(data.value);
          this.servicesUpdated.emit(this.services); // notify component of new data
          break;
        }
        default: {
          console.log(data.propertyName.toString() + " " + data.value.toString());
          break;
        }
      }
    });
  }

  public startServiceDiscovery() {
    this.zeroconf.startServiceDiscovery();
  }

  public stopServiceDiscovery() {
    this.zeroconf.stopServiceDiscovery();
    this.services=[];
    this.servicesUpdated.emit(this.services); // notify component of new data
  }
}