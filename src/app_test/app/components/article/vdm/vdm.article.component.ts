import {Component, Input} from '@angular/core';
import {Article} from '../../../classes/article.class';

@Component({
  moduleId: module.id,
  selector: 'hfull-vdm-article',
  templateUrl: 'vdm.article.component.html',
  styleUrls: ['vdm.article.component.css']
})
export class VDMArticleComponent {
  @Input() article: Article;

  constructor() {

  }

  ngOnChanges() {
    console.log(this.article);
  }
}


