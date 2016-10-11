import {Injectable} from '@angular/core';

@Injectable()
export class LoaderService {

  // private _stacks:any[] = [];
  //
  // constructor() {
  // }
  //
  // add(name:string, message?:string) {
  //   this._stacks.push({
  //     name: name,
  //     message: message
  //   });
  //
  //   this.refresh();
  // }
  //
  // update(name:string, message?:string) {
  //   let i = this._getIndex(name);
  //   if(i >= 0) {
  //     this._stacks[i].message = message;
  //   }
  //   this.refresh();
  // }
  //
  // free(name:string) {
  //   let i = this._getIndex(name);
  //   if(i >= 0) {
  //     this._stacks.splice(i, 1);
  //   }
  //   this.refresh();
  // }
  //
  // refresh() {
  //   if(this._stacks.length === 0) {
  //     this._hide();
  //   } else if(this._stacks.length === 1) {
  //     this._show();
  //   }
  //
  //   let message = '';
  //   if(this._stacks.length > 0) {
  //     message = this._stacks[this._stacks.length - 1].message;
  //   }
  //
  //   let loaderMessage =document.querySelector('.loader .message');
  //   if(loaderMessage) {
  //     loaderMessage.innerHTML = message;
  //   }
  //
  // }

  private _stacks:string[] = [];

  //(data:any, update:any) => any
  task(message:string, promiseFactory:any):any {
    return (data?:any) => {
      let taskIndex = this._stacks.length;

      let update = (message:string) => {
        this._stacks[taskIndex] = message;
        this.refresh();
      };

      update(message);

      return promiseFactory(data, update)
        .then((result:any) => {
          this._stacks.pop();
          this.refresh();
          return Promise.resolve(result);
        }).catch((error:any) => {
          this._stacks.pop();
          this.refresh();
          return Promise.reject(error);
        });
    };
  }

  refresh() {
    if(this._stacks.length === 0) {
      this._hide();
    } else if(this._stacks.length === 1) {
      this._show();
    }

    let message = '';
    if(this._stacks.length > 0) {
      message = this._stacks[this._stacks.length - 1];
    }

    let loaderMessage = document.querySelector('.loader .message');
    if(loaderMessage) {
      loaderMessage.innerHTML = message;
    }

  }

  // private _getIndex(name:string) {
  //   for(let i = 0; i < this._stacks.length; i++) {
  //     if(this._stacks[i].name === name) {
  //       return i;
  //     }
  //   }
  //   return -1;
  // }

  private _show() {
    document.body.classList.add('wait');
  }

  private _hide() {
    document.body.classList.remove('wait');
  }

}
