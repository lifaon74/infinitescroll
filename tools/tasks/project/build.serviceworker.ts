import * as gulp from 'gulp';
import { join } from 'path';
import {inject} from '../../utils';

import { APP_DEST, APP_SRC } from '../../config';


export = (done:any) => {
  var swPrecache = require('sw-precache');

  swPrecache.write(join(APP_DEST, 'service-worker.js'), {
    staticFileGlobs: [APP_DEST + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
    stripPrefix: APP_DEST
  }, () => {

    let code = `
      <script type="text/javascript">
        if('serviceWorker' in navigator) {
          navigator.serviceWorker
          .register('./service-worker.js')
          .then(function() { console.log('Service Worker Registered'); });
        }
      </script>
    `;



    gulp.src(join(APP_DEST, 'index.html'))
      .pipe(inject('sw', code))
      .pipe(gulp.dest(APP_DEST))
      .on('finish', () => {
        done();
      });
  });




};
