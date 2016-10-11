import {Component, OnInit, OnDestroy, Input, Output, EventEmitter} from '@angular/core';
import {Article, ArticleType} from '../../classes/article.class';
import {VDMArticleComponent} from '../article/vdm/vdm.article.component';

// export class InfiniteScroll {
//   container: any;
//   options: any;
//
//   constructor(container:any, options?:any) {
//     super();
//     this.container = container;
//     this.options = options || {};
//     this.options.distance = this.options.distance || 0;
//   }
//
//   init() {
//     this.container.addEventListener('scroll', this._onScroll.bind(this));
//     this._onScroll();
//   }
//
//   destroy() {
//     this.container.removeEventListener('scroll', this._onScroll.bind(this));
//   }
//
//   private _onScroll() {
//     if((this.container.scrollTop + this.container.offsetHeight) + this.options.distance >= this.container.scrollHeight) {
//       this.broadcast('reachBottom');
//     }
//   }
// }


@Component({
  moduleId: module.id,
  selector: 'hfull-article-list',
  templateUrl: 'article-list.component.html',
  styleUrls: ['article-list.component.css'],
  directives: <any[]>[VDMArticleComponent]
})
export class ArticleListComponent implements OnInit, OnDestroy {
  @Input() articles:Article[] = [];
  @Output() onReachBottom = new EventEmitter();

  ArticleType:any = ArticleType;

  timer:any;
  container:any;
  options:any = {
    distance: 1000
  };

  constructor() {
    //this.sync();
  }

  ngOnInit() {
    this.container = document.querySelector('.body-container > .content');
    this.timer = setInterval(this._onScroll.bind(this), 100);
    //this.container.addEventListener('scroll', this._onScroll.bind(this));
  }

  ngOnDestroy() {
    clearInterval(this.timer);
    //this.container.removeEventListener('scroll', this._onScroll.bind(this));
  }

  private _onScroll() {

    let DOMArticles = document.querySelectorAll('.article');

    let currentTime = new Date().getTime();
    let visibleTime = 5000;

    this.articles.forEach((article:Article, index:number) => {
      if(!article.read) {
        let DOMArticle:any = DOMArticles[index];
        if(
          (DOMArticle.offsetTop >= this.container.scrollTop) &&
          ((DOMArticle.offsetTop + DOMArticle.offsetHeight) <= (this.container.scrollTop + this.container.offsetHeight))
        ) {
          if(article.visibleTimer === null) {
            article.visibleTimer = currentTime;
          } else {
            if((currentTime - article.visibleTimer) > visibleTime) {
              article.read = true;
            }
          }
        } else {
          article.visibleTimer = null;
        }
      }
    });

    if((this.container.scrollTop + this.container.offsetHeight) + this.options.distance >= this.container.scrollHeight) {
      this.onReachBottom.emit(null);
    }
  }

}


