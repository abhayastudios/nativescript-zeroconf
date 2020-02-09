import * as utils from 'tns-core-modules/utils/utils';
import { ZeroconfService, Common } from './zeroconf.common';

/*
   Overwrite p3 so it will accept not only a string but anything (string buffer in our case)
   Should not be necessary anymore after this PR: https://github.com/NativeScript/ios-runtime/pull/1250
*/
declare function inet_ntop(p1: number, p2: interop.Pointer | interop.Reference<any>, p3: any, p4: number): string;


/**
 * This is weird and is only here to fix an issue I kept seeing. Basically,
 * after the first call to any of the below delegates, 'this' would be {}
 * instead of the actual constructed object. When I added this to capture the
 * initial value for this so I could compare, things started working. Very
 * mysterious. I'd love for somebody more experience with NS to get to the
 * bottom of things.
 */
let delegate = null;

export class Zeroconf extends Common {
  private netServiceBrowser:NSNetServiceBrowser;

  constructor(serviceType:string) {
    super(serviceType);

    this.netServiceBrowser = NSNetServiceBrowser.new();
  }

  // public startDomainDiscovery() {
  //   /* add delegate - see MyNSNetServiceBrowserDelegate class definition below in file */

  //   this.netServiceBrowser.delegate = MyNSNetServiceBrowserDelegate.new().initWithCallback((result) => {
  //     if (result.type==='domain') { this.onDomainFound(result.data); }
  //   });

  //   this.netServiceBrowser.searchForRegistrationDomains(); // search for Bonjour domains
  // }

  // public stopDomainDiscovery() {
  //   this.stopDiscovery();
  // }

  public startServiceDiscovery() {

    /* add delegate - see MyNSNetServiceBrowserDelegate class definition below in file */

    this.netServiceBrowser.delegate = MyNSNetServiceBrowserDelegate.new().initWithCallback((result) => {
      if (result.type === 'service') {
        if (result.removed) {
          let service:ZeroconfService = {
              'name' : result.name,
              'type' : result.type,
          }

          this.onServiceLost(service);
        }
        else {
          this.resolveBonjourService(result.data);
        }
      }
    });

    this.netServiceBrowser.searchForServicesOfTypeInDomain(this.serviceType, 'local.');
  }

  public stopServiceDiscovery() {
    this.stopDiscovery();
  }

  /*
     Stop any Bonjour discovery
  */
  private stopDiscovery() {
    this.netServiceBrowser.stop();
  }

  /*
     Internal method that resolves a Bonjour service that was found
  */
  private resolveBonjourService(result:NSNetService) : void {

    /* add delegate - see MyNSNetServiceDelegate class definition below in file */

    result.delegate = MyNSNetServiceDelegate.new().initWithCallback((result) => {
      if (result.type === 'resolve') { this.processBonjourService(result.data); }
    });

    result.resolveWithTimeout(0.0); // value of 0.0 indicates no timeout and a resolve process of indefinite duration
  }

  /*
     Internal method that processes a resolved Bonjour service and adds it to knownDevices
  */
  private processBonjourService(result:NSNetService) : void {
    let addresses:any = [];

    if (result.addresses.count<1) { console.warn(`processBonjourService: did not resolve any IP addresses for ${result.name}!`); }
    else {
      addresses = this.extractAddressesFromNSNetService(result.addresses);
    }

    let service:ZeroconfService = {
      'name' : result.name,
      'type' : result.type,
      'host' : result.hostName,
      'addr' : addresses,
      'port' : result.port,
    }

    this.onServiceFound(service);
  }

  /*
     Internal method that extracts IP addresses from a NSNetService object
     Mostly based on: https://github.com/NativeScript/ios-runtime/issues/1017#issuecomment-440823484
  */
  private extractAddressesFromNSNetService(socketsData:NSArray<NSData>) : any {
    let addresses:Array<any> = [];
    let _socketsData:Array<any> = utils.ios.collections.nsArrayToJSArray(socketsData);

    for (let socketData of _socketsData) {
      let socket_address = new interop.Reference(sockaddr_in, socketData.bytes).value;
      // console.dir(socket_address);

      if (socket_address.sin_family == 2 /*AF_INET*/) {
        const ip_version = 4;
        let ip_address = undefined;

        let sin_addr = new interop.Reference(in_addr, socket_address.sin_addr);
        const buffer_size = 80;
        const address_buffer = interop.alloc(buffer_size);
        const res = inet_ntop(socket_address.sin_family, sin_addr, address_buffer, buffer_size);
        if (!res) { console.warn(`inet_ntop failed with error: ${__error()}`); }
        else {
          ip_address=NSString.stringWithUTF8String(<string><unknown>address_buffer).toString(); // convert to JS string;
          addresses.push(ip_address);
        }
      } else if (socket_address.sin_family == 30 /*AF_INET6*/) {
        const ip_version = 6;
        let ip_address = undefined;
        // ip_address = new interop.Reference(sockaddr_in, socket.sa_data).value;
        // sin_addr = interop.handleof(addrs.ifa_addr).add(8);
        addresses.push(ip_address);
      }
    }

    return addresses;
  }
}

/* Define NSNetServiceBrowserDelegate implementation class */

class MyNSNetServiceBrowserDelegate extends NSObject implements NSNetServiceBrowserDelegate {
  public static ObjCProtocols = [NSNetServiceBrowserDelegate];

  static new(): MyNSNetServiceBrowserDelegate {
    return <MyNSNetServiceBrowserDelegate>super.new();
  }

  private _callback: (result:any) => void;

  public initWithCallback(callback: (result:any) => void): MyNSNetServiceBrowserDelegate {
    this._callback = callback;
    delegate = this;
    return this;
  }

  public netServiceBrowserDidFindDomainMoreComing(browser: NSNetServiceBrowser, domainString: string, moreComing: boolean) {
    // console.log(`netServiceBrowserDidFindDomainMoreComing: ${domainString}`);
    this._callback({
      'type': 'domain',
      'data': domainString,
      'moreComing': moreComing
    });
  }

  public netServiceBrowserWillSearch(browser:NSNetServiceBrowser) {
    // console.log(`netServiceBrowserWillSearch`);
  }

  public netServiceBrowserDidStopSearch(browser:NSNetServiceBrowser) {
    // console.log(`netServiceBrowserDidStopSearch`);
  }

  public netServiceBrowserDidFindServiceMoreComing(browser:NSNetServiceBrowser, service:NSNetService, moreComing:boolean) {
    console.log(`netServiceBrowserDidFindServiceMoreComing, found service ${service.name} ${service.type}`);
    this._callback({
      'removed': false,
      'type': 'service',
      'data': service,
      'moreComing': moreComing
    });
  }

  public netServiceBrowserDidRemoveServiceMoreComing(browser:NSNetServiceBrowser, service:NSNetService, moreComing:boolean) {
    console.log(`netServiceBrowserDidRemoveServiceMoreComing, removed service ${service.name} ${service.type}`);
    this._callback({
      'removed': true,
      'type': 'service',
      'data': service,
      'moreComing': moreComing
    });
  }
}

/* Define NSNetServiceDelegate implementation class for resolving host/port once service was discovered */

class MyNSNetServiceDelegate extends NSObject implements NSNetServiceDelegate {
  public static ObjCProtocols = [NSNetServiceDelegate];

  static new(): MyNSNetServiceDelegate {
    return <MyNSNetServiceDelegate>super.new();
  }

  private _callback: (result:any) => void;

  public initWithCallback(callback: (result:any) => void): MyNSNetServiceDelegate {
    this._callback = callback;
    return this;
  }

  public netServiceWillResolve(sender: NSNetService) {
    // console.log(`netServiceWillResolve`);
  }

  public netServiceDidNotResolve(sender: NSNetService, errorDict: NSDictionary<string, number>) {
    console.log(`netServiceDidNotResolve`);
  }

  public netServiceDidResolveAddress(sender: NSNetService) {
    // console.log('netServiceDidResolveAddress');
    this._callback({
      'type' : 'resolve',
      'data' : sender
    });
  }
}
