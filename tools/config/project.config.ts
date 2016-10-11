import { join } from 'path';

import {SeedConfig, ENVIRONMENTS} from './seed.config';

/**
 * This class extends the basic seed configuration, allowing for project specific overrides. A few examples can be found
 * below.
 */
export class ProjectConfig extends SeedConfig {

  PROJECT_TASKS_DIR = join(process.cwd(), this.TOOLS_DIR, 'tasks', 'project');

  APP_ICON:string = `${this.ASSETS_SRC}/logo.png`;
  NO_CACHE: boolean;

  constructor() {
    super();
    this.APP_TITLE = '8Ful';
    this.NO_CACHE = this.ENV === ENVIRONMENTS.DEVELOPMENT;

    // Add `NPM` third-party libraries to be injected/bundled.
    this.NPM_DEPENDENCIES = [
      ...this.NPM_DEPENDENCIES,
      {src: 'pouchdb/dist/pouchdb.min.js', inject: 'libs'},
      {src: 'pouchdb-authentication/dist/pouchdb.authentication.min.js', inject: 'libs'},
    ];

    // Add `local` third-party libraries to be injected/bundled.
    this.APP_ASSETS = [
      ...this.APP_ASSETS,
      {src: `${this.APP_SRC}/polyfill.js`, inject: true, vendor: false}
      // {src: `${this.CSS_SRC}/path-to-lib/test-lib.css`, inject: true, vendor: false},
    ];

    /* Add to or override NPM module configurations: */
    //this.mergeObject(this.PLUGIN_CONFIGS['browser-sync'], { ghostMode: false });
  }

}
