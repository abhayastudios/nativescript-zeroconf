import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { ZeroconfComponent } from "./zeroconf/zeroconf.component";
import { ZeroconfProvider } from "./zeroconf/zeroconf.provider";

const routes: Routes = [
    { path: "", redirectTo: "/zeroconf", pathMatch: "full" },
    { path: "zeroconf", component: ZeroconfComponent },
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }