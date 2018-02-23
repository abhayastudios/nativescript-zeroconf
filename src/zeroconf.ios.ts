import { ZeroconfService, Common } from './zeroconf.common';

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
      if (result.type==='service') { this.resolveBonjourService(result.data); }
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
      if (result.type==='resolve') { this.processBonjourService(result.data); }
    });

    result.resolveWithTimeout(0.0); // value of 0.0 indicates no timeout and a resolve process of indefinite duration
  }

  /*
     Internal method that processes a resolved Bonjour service and adds it to knownDevices
  */
  private processBonjourService(result:NSNetService) : void {
    if (result.addresses.count<1) { console.warn(`processBonjourService: did not resolve any IP addresses for ${result.name}!`); }

    let service:ZeroconfService = {
      'name' : result.name,
      'type' : result.type,
      'host' : result.hostName,
      'port' : result.port,
    }

    this.onServiceFound(service);
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
    // console.log(`netServiceBrowserDidFindServiceMoreComing, found service ${service.name}`);
    this._callback({
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