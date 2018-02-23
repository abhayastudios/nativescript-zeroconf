import { ZeroconfService, Common } from './zeroconf.common';
import { Observable } from "tns-core-modules/data/observable";

import * as async from 'async';

// declare var appModule:any;

export class Zeroconf extends Common {
  private nativeApp:android.app.Application;
  private context:any; //android.content.Context;
  private mNsdManager:android.net.nsd.NsdManager;
  private NsdManager:any; // module android.net.nsd.NsdManager (see android17.d.ts typings)
  private mDiscoveryListener:android.net.nsd.NsdManager.DiscoveryListener;

  constructor(serviceType:string) {
    super(serviceType); // android does not support change of serviceDomain

    this.context = android.content.Context;
    this.mNsdManager = this.getAndroidContext().getSystemService(this.context.NSD_SERVICE);
    this.NsdManager = android.net.nsd.NsdManager;
  }

  public startServiceDiscovery() {

    /* Define async queue for processing discovered services one by one (Android NSD limitation) */

    let asyncQueue = async.queue((serviceInfo, callback) => {
      // console.log('Starting resolving discovered device ' + serviceInfo.getServiceName());
      this.resolveService(serviceInfo).then((service) => {
        this.onServiceFound(service);
        callback(); // async queue callback
      }).catch((error) => {
        console.error(`Error #${error} occured during resolving discovered device ${serviceInfo.getServiceName()}`);
      });
    }, 1);

    /* Instantiate Discovery Listener */

    this.mDiscoveryListener = new this.NsdManager.DiscoveryListener({
      onDiscoveryStarted: (serviceType) => {
        // console.log(`Starting discovery for type ${serviceType}`);
      },
      onStartDiscoveryFailed: (serviceType: string, errorCode: number) => { 
        console.error(`onStartDiscoveryFailed with error #${errorCode}`);
      },
      onStopDiscoveryFailed: (serviceType: string, errorCode: number) => {
        console.error(`onStopDiscoveryFailed with error #${errorCode}`);
      },
      onDiscoveryStopped: (serviceType: string) => { 
        // console.log(`Stopped discovery for type ${serviceType}`);
      },
      onServiceFound: (serviceInfo: android.net.nsd.NsdServiceInfo) => {
        // console.log(serviceInfo.toString());
        asyncQueue.push(serviceInfo, (err) => { // add discovered device to async queue
          // console.log(`Finished resolving for device ${serviceInfo.getServiceName()}...`);
        });
      },
      onServiceLost: (serviceInfo: android.net.nsd.NsdServiceInfo) => {}
    });

    this.mNsdManager.discoverServices(this.serviceType, this.NsdManager.PROTOCOL_DNS_SD, this.mDiscoveryListener);
  }

  /*
     Stop and automatically restart the discovery in event onDiscoveryStopped
  */
  public stopServiceDiscovery() {
    this.mNsdManager.stopServiceDiscovery(this.mDiscoveryListener);
  }

  /*
     Resolve discovered services
     Limitation: Android NSD supports resolving only one service can be resolved at a time (otherwise it crashes)
     --> therefore running in async queue processing one by one
     Parameter 1: serviceInfo as provided by service discovery
  */
  private resolveService(serviceInfo: android.net.nsd.NsdServiceInfo) : any {
    return new Promise((resolve, reject) => {
      let mResolveListener = new this.NsdManager.ResolveListener({
        onResolveFailed: (serviceInfo: android.net.nsd.NsdServiceInfo, errorCode: number) => {
          reject(errorCode);
        },
        onServiceResolved: (serviceInfo: android.net.nsd.NsdServiceInfo) => {
          resolve(<ZeroconfService>{
            'name' : serviceInfo.getServiceName(),
            'type' : serviceInfo.getServiceType(),
            'host' : serviceInfo.getHost().getHostAddress(),
            'port' : serviceInfo.getPort(),
          });
        }
      });

      this.mNsdManager.resolveService(serviceInfo, mResolveListener);
    });
  }

  private getAndroidContext() : android.content.Context {
    // if (typeof appModule != "undefined" && appModule.hasOwnProperty('android') && appModule.android.hasOwnProperty('context')) {
    //   return (appModule.android.context);
    // }

    var ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
    if (ctx) { return ctx; }

    ctx = java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
    return ctx;
  }
}