
import {
  Component, ReflectiveInjector, ComponentResolver, ViewContainerRef, ViewChild, Directive,
  ViewRef, ChangeDetectorRef, IterableDiffers, TemplateRef, Input, IterableDiffer
} from "@angular/core";


// http://teropa.info/blog/2016/03/06/writing-an-angular-2-template-directive.html
@Directive({
  selector: '[forAnyOrder]'
})
export class ForAnyOrder {

  private collection:any;
  private differ:IterableDiffer;
  private viewMap:Map<any,ViewRef> = new Map<any,ViewRef>();

  constructor(
    private changeDetector:ChangeDetectorRef,
    private differs:IterableDiffers,
    private template:TemplateRef,
    private viewContainer:ViewContainerRef
  ) {
    ///debugger;
  }

  @Input() set forAnyOrderOf(collection:any) {
    this.collection = collection;
    console.log(this.collection);

    if(collection && !this.differ) {
      this.differ = this.differs.find(collection).create(this.changeDetector);
    }
  }



  ngDoCheck() {
    if(this.differ) {
      const changes = this.differ.diff(this.collection);
      if(changes) {
        let lastChange = null;
        changes.forEachAddedItem((change) => {
          //console.log(change.item);
          const view = this.viewContainer.createEmbeddedView(this.template, {'$implicit': change.item});
          //console.log(this.viewContainer);
          lastChange = view;
          this.viewMap.set(change.item, view);
        });

        (<any>window).move = () => {
          if(lastChange) {
            this.viewContainer.detach(this.viewContainer.indexOf(lastChange));
            this.viewContainer.insert(lastChange, 1);
          }
        };

        (<any>window).remove = () => {
          this.viewContainer.remove(this.viewContainer.indexOf(lastChange));
          lastChange = null;
        };

        // changes.forEachRemovedItem((change) => {
        //   const view = this.viewMap.get(change.item);
        //   const viewIndex = this.viewContainer.indexOf(view);
        //   this.viewContainer.remove(viewIndex);
        //   this.viewMap.delete(change.item);
        // });
      }
    }
  }
}

//http://www.michaelbromley.co.uk/blog/513/components-with-custom-templates-in-angular-2
//http://teropa.info/blog/2016/03/06/writing-an-angular-2-template-directive.html

@Directive({
  selector: '[infiniteStream]',
  exportAs: 'ngInfiniteStream'
})
export class InfiniteStreamDirective {

  options:any = {};
  private viewMap:Map<any,ViewRef> = new Map<any,ViewRef>();

  constructor(
    private changeDetector:ChangeDetectorRef,
    private differs:IterableDiffers,
    private template:TemplateRef,
    private viewContainer:ViewContainerRef,
  ) {

  }

  @Input() set infiniteStream(options:any) {
    this.options = options;
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
  directives: <any[]>[]
})
export class MyComponent {

  // <template #childContainer></template>
  @ViewChild("itemsContainer", { read: ViewContainerRef }) itemsContainerViewRef: ViewContainerRef;

  constructor(private resolver: ComponentResolver) {

  }

  //http://stackoverflow.com/questions/37487977/passing-input-while-creating-angular-2-component-dynamically-using-componentreso

  inject() {
    this.resolver.resolveComponent(MyComponent) // AnotherComponent
      .then(factory => {
        const injector = ReflectiveInjector.fromResolvedProviders([], this.itemsContainerViewRef.parentInjector);
        const componentRef = this.itemsContainerViewRef.createComponent(factory, 0, injector, []);
        //componentRef.instance.article = this.options.item;
        componentRef.instance.ngOnChanges();
      });
  }
}
