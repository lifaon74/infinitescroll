import {
  Component, OnInit, OnDestroy, Input, ElementRef, SimpleChange, TemplateRef, ContentChild, ViewChild, ViewContainerRef,
  ViewEncapsulation, Directive, ViewRef
} from '@angular/core';
import { ArticleType} from '../../classes/article.class';
import {VDMArticleComponent} from '../article/vdm/vdm.article.component';
import * as tools from '../../tools';


class InfiniteStream {
  items:any[] = [];

  scroll:number = 0;
  wheelDelta:number = 0;
  wheelInertia:number = 0;


  container:any;
  wrapper:any;

  upperLimit:number = 2;
  meanLimit:number  = 0;
  lowerLimit:number = 0;

  getItemBefore:((item:any, number:number) => Promise<any[]>) = (() => Promise.resolve([]));
  getItemAfter:((item:any, number:number) => Promise<any[]>) = (() => Promise.resolve([]));

  destroyed:boolean = false;

  cancelMouseWheelListener:any = (() => {});
  cancelDragListener:any = (() => {});

  constructor() {
    this._loopRefresh();
  }

  setOptions(options:any) {
    if(options.container) {
      this.container  = options.container;
      tools.makeEventTarget(this.container);

      this.cancelMouseWheelListener();
      this.cancelMouseWheelListener = this.container.$on('$mousewheel', (event:any) => {
        this.wheelDelta += event.delta * 100;
      });

      this.cancelDragListener();
      this.cancelDragListener = tools.makeDraggable(this.container, {
        onDragStart: (drag:any) => {
          if(drag.event.type === 'mousedown') {
            if(drag.event.button !== 1) {
              return false;
            }
          }

          drag.previousDeltaY = 0;
          drag.event.preventDefault();
          return true;
        },
        onDragMove: (drag:any) => {
          this.scroll += drag.deltaY - drag.previousDeltaY;
          drag.previousDeltaY = drag.deltaY;
        },
        onDragEnd: (drag:any) => {
          //console.log('end');
        },
      });
    }

    this.wrapper    = options.wrapper || this.wrapper || null;

    this.upperLimit = (typeof options.upperLimit === 'number') ? options.upperLimit : (this.upperLimit || 2);
    this.lowerLimit = (typeof options.lowerLimit === 'number') ? options.lowerLimit : (this.lowerLimit || 0);
    this.meanLimit  = Math.floor((this.upperLimit + this.lowerLimit) / 2); // loaded each times = (upperLimit - lowerLimit) / 2

    this.getItemBefore  = options.getItemBefore || this.getItemBefore || (() => Promise.resolve([]));
    this.getItemAfter   = options.getItemAfter || this.getItemAfter || (() => Promise.resolve([]));

    setInterval(() => {
      if(this.wheelDelta !== 0) {
        if(Math.abs(this.wheelDelta) > 1) {
          // Math.log(1/100) / Math.log(0.95) => number of steps before the of animation,  * 1000 / 60 to get time in ms
          let step = 0.8577; // 1000 => 0.92612, 500 => 0.8577
          this.scroll += this.wheelDelta * (1 - step);
          this.wheelDelta = this.wheelDelta * step;
        } else {
          this.scroll += Math.round(this.wheelDelta);
          this.wheelDelta = 0;
          this.topOffset = Math.round(this.topOffset);
        }
      }
    }, 1000 / 60);

  }

  destroy() {
    this.cancelMouseWheelListener();
    this.cancelDragListener();
    this.destroyed = true;
  }

  goto(item:any) {
    if(item) {
      this.items = [item];
      //console.log(this.items);
    }
  }

  protected _loopRefresh() {
    if(!this.destroyed) {
      setTimeout(() => {

        if((this.scroll === 0) || (!this.container) || (!this.wrapper)) {
          this._loopRefresh();
        } else {
          //let t1 = new Date().getTime();
          let scroll = this.scroll;
          this.topOffset += scroll;
          this._refresh()
            .catch((error:any) => {
              console.warn('[ERROR] : ', error);
              return Promise.resolve();
            })
            .then(() => {
              this.scroll -= scroll;
              //console.log(new Date().getTime() - t1);
              this._loopRefresh();
            });
        }
      }, 10);
    }
  }

  protected _refresh() {
    return new Promise((resolve:any, reject:any) => {
      let allItems = this.wrapper.querySelectorAll(':scope > .article');
      let allPromises:any[] = [];

      // bottom
      let numberOfBottomHiddenItems = this._getNumberOfBottomHiddenItems(this.container, allItems);

      if(numberOfBottomHiddenItems >= this.upperLimit) {
        this._removeOnBottom(numberOfBottomHiddenItems - this.meanLimit, allItems);
      }

      if(numberOfBottomHiddenItems <= this.lowerLimit) {
        allPromises.push(
          this.getItemAfter(this.items[this.items.length - 1], this.meanLimit - numberOfBottomHiddenItems)
            .then((items) => {
              return this._addOnBottom(items, allItems);
            })
        );
      }


      // top
      let numberOfTopHiddenItems = this._getNumberOfTopHiddenItems(this.container, allItems);

      if(numberOfTopHiddenItems >= this.upperLimit) {
        this._removeOnTop(numberOfTopHiddenItems - this.meanLimit, allItems);
      }

      if(numberOfTopHiddenItems <= this.lowerLimit) {
        allPromises.push(
          this.getItemBefore(this.items[0], this.meanLimit - numberOfTopHiddenItems)
            .then((items) => {
              return this._addOnTop(items, allItems);
            })
        );
      }

      resolve(Promise.all(allPromises).then((result) => {
        if(result.includes(true)) { // mutation of _item

        }
      }));
    });
  }

  protected _removeOnTop(number:number, allItems:any) {
    this.items.splice(0, number);
    this.topOffset = allItems[number].offsetTop;
  };

  protected _addOnTop(items:any[], allItems:any) {
    return new Promise((resolve:any, reject:any) => {
      if (items.length === 0) {
        if(this.topOffset > 0) {
          this.topOffset = 0;
        }
        resolve(false);
      } else {
        this.items.unshift.apply(this.items, items);

        let topItem = allItems[0];
        let topItemOffsetTop = topItem.offsetTop;

        let waitRendered = () => {
          if (topItem.offsetTop === topItemOffsetTop) {
            window.requestAnimationFrame(waitRendered);
          } else {
            this.topOffset -= topItem.offsetTop - topItemOffsetTop;
            resolve(true);
          }
        };

        window.requestAnimationFrame(waitRendered);
      }
    });
  };

  protected _removeOnBottom(number:number, allItems:any) {
    this.items.splice(this.items.length - number, number);
  }

  protected _addOnBottom(items:any[], allItems:any) {
    if(items.length === 0) {
      if(this.topOffset < (this.container.offsetHeight - this.wrapper.offsetHeight)) {
        this.topOffset = (this.container.offsetHeight - this.wrapper.offsetHeight);
      }

      return false;
    } else {
      this.items.push.apply(this.items, items);
      return true;
    }
  }




  protected _getNumberOfTopHiddenItems(container:any, allItems:any) {
    let item:any;
    let numberOfHiddenItems = 0;
    for(let i = 0; i < allItems.length; i++) {
      item = allItems[i];
      if((item.offsetTop + item.offsetHeight) > 0) { // test if item is visible
        break;
      } else {
        numberOfHiddenItems++;
      }
    }

    return numberOfHiddenItems;
  }

  protected _getNumberOfBottomHiddenItems(container:any, allItems:any) {
    let item:any;
    let numberOfHiddenItems = 0;
    for(let  i = allItems.length - 1; i >= 0; i--) {
      item = allItems[i];
      if(item.offsetTop < container.offsetHeight) { // test if item is visible
        break;
      } else {
        numberOfHiddenItems++;
      }
    }

    return numberOfHiddenItems;
  }


  protected get topOffset():number {
    let topOffset = parseFloat(this.wrapper.style.marginTop);
    return isNaN(topOffset) ? 0 : topOffset;
  }

  protected set topOffset(offset:number) {
    //console.log('set', offset);
    this.wrapper.style.marginTop = offset + 'px';
  }


}


@Directive({
  selector: '[infiniteStream]',
  exportAs: 'ngInfiniteStream'
})
export class InfiniteStreamDirective {

  options:any = {};
  private viewMap:Map<any,ViewRef> = new Map<any,ViewRef>();

  constructor(
    private template:TemplateRef,
    private viewContainer:ViewContainerRef,
  ) {

  }

  @Input() set infiniteStream(options:any) {
    if(options) {
      this.options = options;
      this.options.controller = this;

      this.options.onReady(this);
    }
  }

  add(item:any, index?:number) {
    const view = this.viewMap.get(item);
    if(view) {
      let _index = this.viewContainer.indexOf(view);
      if(index !== _index) {
        this.viewContainer.detach(_index);
        this.viewContainer.insert(view, index);
      }
    } else {
      const view = this.viewContainer.createEmbeddedView(this.template, {item: item}, index);
      this.viewMap.set(item, view);
    }

    console.log(this.viewContainer.length);
  }

  remove(item:any) {
    const view = this.viewMap.get(item);
    if(view) {
      this.viewContainer.remove(this.viewContainer.indexOf(view));
      this.viewMap.delete(item);
    }
  }


  ngOnInit() {

    (<any>window).add = this.add.bind(this);

    (<any>window).remove = this.remove.bind(this);
  }
}

@Component({
  moduleId: module.id,
  selector: 'infinite-stream',
  templateUrl: 'infinite.stream.component.html',
  styleUrls: ['infinite.stream.component.css'],
  directives: <any[]>[VDMArticleComponent, InfiniteStreamDirective]
})
export class InfiniteStreamComponent extends InfiniteStream implements OnInit, OnDestroy {
  @Input() articles:any[] = [];

  ArticleType:any = ArticleType;

  container:any;

  options:any = {};

  constructor(
    element:ElementRef
  ) {
    super();
    this.container = element.nativeElement;
    this.options.onReady = (controller) => {
      console.log(controller);
    };
  }

  ngOnInit() {

    // this.setOptions({
    //   container: this.container,
    //   wrapper: this.container.querySelector('.infinite-stream-wrapper'),
    //   upperLimit: 8,
    //   lowerLimit: 0,
    //   getItemBefore: this.askBefore,
    //   getItemAfter: this.askAfter
    // });

  }

  ngOnDestroy() {
    this.destroy();
  }

  ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
    for(let propName in changes) {
      if(propName === 'articles') {
        //this._items = this.items.slice(this.items.length - 10, this.items.length);
        //this._items = this.items.slice(0, 5);

        this.options.item = this.articles[1];
        this.options.controller.add(this.options.item);

        this.goto(this.articles[10]);
      }
    }
  }

  ngAfterViewInit() {

    console.log('rendered');

    (<any>window).apply = () => {

    };
  }

  askBefore(article:any, number:number) {
    return new Promise((resolve:any, reject:any) => {
      let i = this.articles.indexOf(article);
      if(i < 0) {
        reject(new Error('Item not present'));
      } else {
        let start = Math.max(0, i - number);
        resolve(this.articles.slice(start, i));
      }
    });
  }

  askAfter(article:any, number:number) {
    return new Promise((resolve:any, reject:any) => {
      let i = this.articles.indexOf(article);
      if(i < 0) {
        reject(new Error('Item not present'));
      } else {
        let start = Math.min(this.articles.length, i + 1);
        resolve(this.articles.slice(start, start + number));
      }
    });
  }



}


