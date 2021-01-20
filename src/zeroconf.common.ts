import { Observable, EventData } from '@nativescript/core';

@NativeClass()
export class Common extends Observable {
  protected serviceType:string;

  constructor(serviceType:string) {
    super();

    this.serviceType = serviceType;
  }

  public startServiceDiscovery() : void {};
  public stopServiceDiscovery() : void {};

  protected onServiceFound(service:any) : void {
    this.notifyPropertyChange('serviceFound', service);
  }

  protected onServiceLost(service:any) : void {
    this.notifyPropertyChange('serviceLost', service);
  }
}

export interface ZeroconfService {
  'name' : string;
  'type' : string;
  'host'? : string;        // hostname if we have it or IP address
  'addr'? : Array<string>; // arrays of IP address strings
  'port'? : number;
}
