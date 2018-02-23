import { Observable, EventData } from 'tns-core-modules/data/observable';

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
}

export interface ZeroconfService {
  'name' : string;
  'type' : string;
  'host' : string;
  'port' : number;
}
