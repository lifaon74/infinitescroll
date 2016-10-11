import {Injectable} from '@angular/core';
declare let PouchDB:any;


export class PouchDBHelper {

  static timeout(timeout:number) {
    return new Promise((resolve:any, reject:any) => {
      setTimeout(resolve, timeout);
    });
  }

  static tryMany(promiseFactory:any, options?:any) {
    options = options || {};
    options.times = options.times || 10;
    options.delay = options.delay || 200;

    let execute = (errorCount:number) => {
      return promiseFactory()
        .catch((error:any) => {
          console.warn('Error #' + errorCount + ' into tryMany', error);

          return this.timeout(options.delay)
            .then(() => {
              if(errorCount < options.times) {
                return execute(errorCount + 1);
              } else {
                throw error;
              }
            });
        });
    };

    return execute(0);
  }

  static login(url:string, username:string, password:string) {
    let db = new PouchDB(url, { skipSetup: true });

    return this.tryMany(() => {
      return db.login(username, password, {
        ajax: {
          headers: {
            Authorization: 'Basic ' + window.btoa(username + ':' + password)
          }
        }
      }).then(() => {
        return Promise.resolve(db);
      });
    });
  }

  static getOrDefault(db:any, doc:any) {
    return db.get(doc._id)
      .catch((error:any) => {
        if(error.name === 'not_found') {
          return db.put(doc);
        } else {
          throw error;
        }
      });
  }

  static init(db:any) {
    return this.getOrDefault(db, {
      _id: 'articleIdsImported',
      ordered: [],
      totalArticles: 0,
      lastSync: new Date().getTime()
    })
    .then(() => {
      return this.getOrDefault(db, {
        _id: 'config',
        numberOfArticlesToSync: 1000,
        bulkSize: 1000
      });
    });
  }

  static sync(sourceDB:any, targetDB:any, config:any) {
    return sourceDB.info()
      .then((sourceDBInfos:any) => {
        return this.tryMany(() => {
            return PouchDB.replicate(sourceDB, targetDB, { // 1) get last articleIds (remote)
              doc_ids:['articleIds']
            });
          })
          .then(() => { // 2) get articleIds
            return targetDB.allDocs({
              include_docs: true,
              keys: ['articleIds', 'articleIdsImported']
            });
          })
          .then((result:any) => { // 3) sync last articles
            let [articleIds, articleIdsImported] = result.rows.map((article:any) => {
              return article.doc;
            });

            let end = articleIds.ordered.length;
            let start = Math.max(0, end - config.numberOfArticlesToSync);

            if(config.numberOfArticlesToSync === 0) {
              start = 0;
            }

            let articleIdsSliced = articleIds.ordered.slice(start, end);
            let articleIdsBulk = articleIdsSliced.map((article:any) => {
              return article.id;
            });

            interface ISyncProgress {
              start:number;
              end:number;
              sourceDBInfos:any;
              syncInfos:any;
            }

            let infos:ISyncProgress = {
              start: start,
              end: end,
              sourceDBInfos: sourceDBInfos,
              syncInfos: null
            };


            let replicatePromiseOptions:any;
            if(start === 0) {
              replicatePromiseOptions = {
                  batch_size: config.bulkSize
              };
            } else {
              replicatePromiseOptions = {
                doc_ids: articleIdsBulk,
                batch_size: Math.min(config.bulkSize, articleIdsBulk.length)
              };
            }

            return PouchDB.replicate(sourceDB, targetDB, replicatePromiseOptions)
            .on('change', (syncInfos:any) => { // 3.1) sync articles
              if(typeof config.onLoop === 'function') {
                infos.syncInfos = syncInfos;
                config.onLoop(infos);
              }
            }).then(() => { // 3.2) update articleIdsImported

              let articleIdsImportedMap:any = {};
              articleIdsImported.ordered.forEach((doc:any, index:number) => {
                articleIdsImportedMap[doc.id] = index;
              });

              articleIdsSliced.forEach((doc:any, index:number) => {
                if(typeof articleIdsImportedMap[doc.id] === 'undefined') { // doc has been imported
                  articleIdsImported.ordered.push({
                    id: doc.id,
                    date: doc.date,
                    read: false
                  });
                }
              });

              articleIdsImported.ordered = articleIdsImported.ordered.sort((a:any, b:any) => {
                return a.date - b.date;
              });

              articleIdsImported.lastSync       = new Date().getTime();
              articleIdsImported.totalArticles  = articleIds.ordered.length;

              return targetDB.put(articleIdsImported).then(() => {
                return Promise.resolve(articleIdsImported);
              });
            });
          });
      });
  };


  static testAutoSave() {
    // let deepInspect = (value:any, callback:any, parent?:any = null, key?:any = null) => {
    //   let copy = value;
    //
    //   if(value instanceof Array) {
    //     copy = [];
    //     for(let i = 0; i < value.length; i++) {
    //       copy[i] = deepInspect(value[i], callback, value, i);
    //     }
    //   } else if(typeof value === 'object') {
    //     copy = {};
    //     for(let prop in value) {
    //       if(value.hasOwnProperty(prop)) {
    //         copy = deepInspect(value[prop], callback, value, prop);
    //       }
    //     }
    //   }
    //
    //   callback(value, parent, key, copy);
    //
    //   return copy;
    // };
    //
    //
    //
    // doc.obj = {
    //   a: 'ok'
    // };
    //
    //
    // let _doc = JSON.parse(JSON.stringify(doc));
    //
    // deepInspect(_doc, (value:any, parent:any, key:any) => {
    //   if(parent && (typeof parent === 'object') && !(/^_/g).test(key)) {
    //     parent['_' + key] = parent[key];
    //     Object.defineProperty(parent, key, {
    //       set: (value) => { parent['_' + key] = value; console.log('set'); },
    //       get: () => { console.log('get'); return parent['_' + key]; }
    //     });
    //   }
    // });
    //
    //
    // let entangleValues = (value:any) => {
    //   let entangled = value;
    //
    //   if(typeof value === 'object') {
    //     entangled = {};
    //     for(let prop in value) {
    //       if(value.hasOwnProperty(prop)) {
    //         entangleValues(value[prop]);
    //
    //         Object.defineProperty(entangled, prop, {
    //           set: (_value:any) => { value[prop] = _value; console.log('set'); },
    //           get: ():any => { console.log('get'); return value[prop]; }
    //         });
    //
    //       }
    //     }
    //   }
    //
    //   return entangled;
    // };

  }

  static listenChange(object:any, onChange:any) {
    let objectString = JSON.stringify(object);

    let timer:any = null;

    let stop = () => {
      if(timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    timer = setInterval(() => {
      if(timer !== null) {
        if(objectString !== JSON.stringify(object)) {
          onChange(objectString, object);
          stop();
        }
      }
    }, 500);

    return stop;
  }

  static autoSaveDoc(db:any, document:any, onUpdate:any):any {

    let _stop:any = () => {};

    let stop = () => {
      _stop();
      _stop = null;
    };


    let autoSaveDoc = (db:any, document:any, onUpdate:any):any => {
      onUpdate(document);
      if(_stop !== null) {
        _stop = this.listenChange(document, () => {
          return db.put(document)
            .then(() => {
              return db.get(document._id);
            })
            .then((doc:any) => {
              autoSaveDoc(db, doc, onUpdate);
            });
        });
      }
    };


    autoSaveDoc(db, document, onUpdate);

    return stop;
  }
}

@Injectable()
export class VDMPouchDBService {
  config:any = null;

  configAutoSave:any = null;

  localDB:any = null;

  pouchDBHelper:any = PouchDBHelper;

  constructor() {
  }

  init() {
    if(this.localDB) {
      return Promise.resolve();
    } else {
      this.localDB = new PouchDB('vdm');
      return this.pouchDBHelper.init(this.localDB)
        .then(() => {
          this.localDB.get('config')
            .then((config:any) => {
              if(this.config !== null) { // restore previous config if exists
                this.config._rev = config._rev;
                return this.localDB.put(this.config)
                  .then(() => {
                    return this.localDB.get('config');
                  });
              } else {
                return Promise.resolve(config);
              }
            })
            .then((config:any) => {
              if(this.configAutoSave) {
                this.configAutoSave();
                this.configAutoSave = null;
              }

              this.configAutoSave = this.pouchDBHelper.autoSaveDoc(this.localDB, config, (config:any) => {
                console.log(config);
                this.config = config;
              });
            });
        });
    }
  }

  sync(onLoop:(infos:any) => void) {
    if(this.localDB) {
      return this.pouchDBHelper.login('http://8ful.club:5984/vdm', 'public', 'password')
        .then((remoteDB:any) => {
          this.config.onLoop = onLoop;
          return this.pouchDBHelper.sync(remoteDB, this.localDB, this.config)
            .then(() => {
              delete this.config.onLoop;
              return remoteDB.logout();
            });
        });
    } else {
      return Promise.reject(new Error('You must initialize databases first'));
    }
  }

  getArticleIdsImported() {
    if(this.localDB) {
      return this.localDB.get('articleIdsImported');
    } else {
      return Promise.reject(new Error('You must initialize databases first'));
    }
  }

  getArticles(articleIds:any[]) {
    if(this.localDB) {
      return this.localDB.allDocs({
        include_docs: true,
        keys: articleIds
      });
    } else {
      return Promise.reject(new Error('You must initialize databases first'));
    }
  }

  destroy() {
    if(this.localDB) {
      return this.localDB.destroy()
        .then(() => {
          this.localDB = null;
          return this.init();
        });
    } else {
      return Promise.reject(new Error('You must initialize databases first'));
    }
  }

}
