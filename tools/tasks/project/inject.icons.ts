import * as gulp from 'gulp';
import { join } from 'path';
import {inject} from '../../utils';
import { APP_DEST, APP_SRC, APP_BASE } from '../../config';

var fs = require('fs');

export = (done: any) => {

  let ICONS_SRC = join(APP_SRC, 'assets/main-logo.png');
  let ICONS_DEST = join(APP_SRC, 'assets/icons');
  let ICONS_PATH = join(APP_BASE, 'assets/icons');

  let FAVICON_DATA_FILE = join(ICONS_DEST, 'faviconData.json');

  let faviconData = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE));

  return gulp.src(join(APP_DEST, 'index.html'))
    .pipe(inject('icons', faviconData.favicon.html_code.replace(/\\/g, '/')))
    .pipe(gulp.dest(APP_DEST));
};
