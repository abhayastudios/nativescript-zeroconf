import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ZeroconfProvider } from "./zeroconf.provider";

@Component({
  template: `
    <StackLayout id="body">
      <Label text="Service Discovery" class="center heading"></Label>
      <GridLayout columns="*,auto,auto,*" rows="auto">
        <Button col="1" row="0" class="btn btn-primary" text="Start" (tap)="zeroconf.startServiceDiscovery()"></Button>
        <Button col="2" row="0" class="btn btn-primary" text="Stop" (tap)="zeroconf.stopServiceDiscovery()"></Button>
      </GridLayout>

      <StackLayout *ngIf="services.length<1">
        <Label text="No services found!" class="center"></Label>
      </StackLayout>

      <StackLayout *ngIf="services.length>0">
        <ListView [items]="services">
          <ng-template let-item="item">
            <Label [text]="item.type + ': ' + item.name"></Label>
          </ng-template>
        </ListView>
      </StackLayout>
    </StackLayout>
  `,
  styles: [`
    #body { padding:10; font-size:16; color:black; }
    .center { text-align:center; }
    .heading { font-size:20; font-weight:bold; }
  `]

})
export class ZeroconfComponent implements OnInit {
  public services:Array<any> = [];

  constructor(private cdr:ChangeDetectorRef, private zeroconf:ZeroconfProvider) {}

  public ngOnInit() {
    this.zeroconf.servicesUpdated.subscribe((services) => {
      this.services = services;
      this.cdr.detectChanges(); // ensure angular picks up on the changes  
    });
  }
}