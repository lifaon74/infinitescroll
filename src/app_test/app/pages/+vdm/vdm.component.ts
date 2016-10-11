import {Component, OnInit} from '@angular/core';
import {ArticleListComponent} from '../../components/article-list/article-list.component';
import {Article, ArticleType} from '../../classes/article.class';
import {VDMPouchDBService} from '../../services/pouchdb/pouchdb.service';
import {BroadcastService} from '../../services/broadcaster.service';
import {InfiniteStreamComponent} from '../../components/infinite.stream/infinite.stream.component';
import {DynamicHTMLOutlet} from '../../directives/dynamic-html-outlet';


@Component({
  moduleId: module.id,
  selector: 'vdm',
  templateUrl: 'vdm.component.html',
  styleUrls: ['vdm.component.css'],
  directives: <any[]>[ArticleListComponent, InfiniteStreamComponent, DynamicHTMLOutlet],
  providers: [VDMPouchDBService]
})
export class VDMComponent implements OnInit {
  articles:Article[] = [];
  // title:string = 'title';

  // html:string = `
  //   hello {{title}}<hfull-vdm-article [article]="item"></hfull-vdm-article>
  // `;

  optionsPanelVisible:boolean = false;
  syncMessage:string;

  articleIdsImported:any;

  private bulk:number;
  private bulkSize:number = 200;
  private loading:boolean = false;

  constructor(
    public VDMPouchDBService:VDMPouchDBService,
    private broadcaster:BroadcastService
  ) {
    console.log('vdm');

    this.broadcaster.on('clickOptionsHeader').subscribe(() => {
      this.optionsPanelVisible = !this.optionsPanelVisible;
    });

    //this.sync();
  }

  ngOnInit() {
    //window.goto = this.goto.bind(this);
    this.init().then(() => {
      this.loadMore();
    });
  }

  init() {
    return this.VDMPouchDBService.init()
      .then(() => {
        return this.reset();
      });
  }

  goto(index:number) {
    let bulk = Math.floor(index / this.bulkSize);
    console.log(bulk, this.bulk);
    if(bulk > this.bulk) {
      let end = Math.max(0, this.articleIdsImported.ordered.length - (this.bulk  + 1) * this.bulkSize);
      let start = Math.max(0, this.articleIdsImported.ordered.length - (bulk + 1) * this.bulkSize);
      console.log(start, end);
    }

    // let end = Math.max(0, this.articleIdsImported.ordered.length - bulk * this.bulkSize);
    // let start = Math.max(0, end - this.bulkSize);

    //console.log('load more', start, end, nextBulk);

    // this.loadArticles(start, end)
    //   .then((importedMore:boolean) => {
    //     if(importedMore) {
    //       this.bulk = nextBulk;
    //     }
    //   });
  }

  reset() {
    this.bulk = -1;
    this.articles = [];
    this.articleIdsImported = null;
    (<any>document.querySelector('.body-container > .content')).scrollTop = 0;

    return this.VDMPouchDBService.getArticleIdsImported()
      .then((articleIdsImported:any) => {
        this.articleIdsImported = articleIdsImported;
        console.log(this.articleIdsImported.ordered.length);
      });
  }

  loadMore() {
    let bulk = this.bulk + 1;
    let end = Math.max(0, this.articleIdsImported.ordered.length - bulk * this.bulkSize);
    let start = Math.max(0, end - this.bulkSize);

    //console.log('load more', start, end, nextBulk);

    this.loadArticles(start, end)
      .then((importedMore:boolean) => {
        if(importedMore) {
          this.bulk = bulk;
        }
      });
  }

  private loadArticles(start:number, end:number) {
    if(!this.loading && this.articleIdsImported && (start < end)) {
      this.loading = true;

      return this.VDMPouchDBService.getArticles(
        this.articleIdsImported.ordered.slice(start, end)
          .reverse()
          .map((article:any) => {
            return article.id;
          })
      ).then((allDocs:any) => {
        this.articles = [];
        allDocs.rows
          .map((doc:any) => {
            return doc.doc;
          })
          .forEach((doc:any) => {
            this.articles.push(new Article(ArticleType.VDM, doc));
          });

        this.loading = false;

        return Promise.resolve(true);
      });

    } else {
      return Promise.resolve(false);
    }
  }



  sync() {
    return this.VDMPouchDBService.sync((infos:any) => {
      console.log(infos);
    })
    .then(() => {
      return this.reset();
    });

    // this.loaderService.task('Loading list of articles...', () => {
    //
    //   return this.pouchDBService.login('http://8ful.club:5984/vdm_2', 'public', 'password')
    //     .then((db:any) => {
    //       this.sourceDB = db;
    //       this.targetDB = new PouchDB('vdm');
    //
    //       return this.loaderService.task('Synchronizing data...', (data:any, update:any) => {
    //         return this.sourceDB.info()
    //         .then((dbInfos:any) => {
    //           return PouchDB.replicate(this.sourceDB, this.targetDB, {
    //             batch_size: 1000
    //           })
    //           .on('change', (syncInfos:any) => {
    //             update('Synchronizing data : ' + syncInfos.last_seq + '/' + dbInfos.doc_count);
    //             console.log(syncInfos);
    //           });
    //         });
    //       })()
    //       .then(() => {
    //         return this.pouchDBService.syncAllIds(this.sourceDB, this.targetDB)
    //           .then(() => {
    //             return this.targetDB.get('articleIds');
    //           }).then((articleIds) => {
    //             this.articleIds = articleIds.ordered.sort((a:any, b:any) => {
    //               return b.date - a.date;
    //             })/*.slice(0, 200)*/;
    //             this.loadMore();
    //           });
    //       });
    //     });
    //
    // })();

  }

  destroy() {
    //if(confirm('Are you sure you want to destroy all data ?')) {
      return this.VDMPouchDBService.destroy()
        .then(() => {
          return this.init();
        });
    //}
  }
}




