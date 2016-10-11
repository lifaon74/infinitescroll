import { Component } from '@angular/core';
import {BroadcastService} from '../../services/index';

@Component({
  moduleId: module.id,
  selector: 'hfull-header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css']
})
export class HeaderComponent {

  constructor(
    private broadcaster:BroadcastService
  ) {

  }

  onClickMenu() {
    console.log('click menu');
  }

  onClickOptions() {
    this.broadcaster.broadcast('clickOptionsHeader');
  }
}
