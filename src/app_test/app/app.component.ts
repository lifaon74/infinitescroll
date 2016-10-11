import {Component} from '@angular/core';
import { ROUTER_DIRECTIVES } from '@angular/router';
import { HTTP_PROVIDERS } from '@angular/http';
import {HeaderComponent} from './components/header/header.component';
import {BroadcastService} from './services/broadcaster.service';
import {LoaderService} from './services/loader.service';

@Component({
  moduleId: module.id,
  selector: 'hfull-app',
  viewProviders: [HTTP_PROVIDERS],
  templateUrl: 'app.component.html',
  directives: <any[]>[ROUTER_DIRECTIVES, HeaderComponent],
  providers: [BroadcastService, LoaderService]
})
export class AppComponent  {

}
