import * as gulp from 'gulp';
import { join } from 'path';
import { clean } from '../../utils';
import * as util from 'gulp-util';

import { APP_ICON, APP_SRC, APP_BASE, APP_TITLE } from '../../config';

var realFavicon = require ('gulp-real-favicon');

// http://realfavicongenerator.net/favicon_result?file_id=320e4e58219648fefff08ac00785736c1dd2d18d#.V39b_riLRaS
export = (done: any) => {

  let ICONS_SRC = APP_ICON;
  let ICONS_DEST = join(APP_SRC, 'assets/icons');
  let ICONS_PATH = join(APP_BASE, 'assets/icons');

  let FAVICON_DATA_FILE = join(ICONS_DEST, 'faviconData.json');

  clean(ICONS_DEST)(() => {
    realFavicon.generateFavicon({
      masterPicture: ICONS_SRC,
      dest: ICONS_DEST,
      iconsPath: ICONS_PATH,
      design: {
        ios: {
          pictureAspect: 'noChange',
          assets: {
            ios6AndPriorIcons: true,
            ios7AndLaterIcons: true,
            precomposedIcons: true,
            declareOnlyDefaultIcon: true
          }
        },
        desktopBrowser: {},
        windows: {
          pictureAspect: 'noChange',
          backgroundColor: '#ff0000',
          onConflict: 'override',
          assets: {
            windows80Ie10Tile: true,
            windows10Ie11EdgeTiles: {
              small: true,
              medium: true,
              big: true,
              rectangle: true
            }
          }
        },
        androidChrome: {
          pictureAspect: 'noChange',
          themeColor: '#ff0000',
          manifest: {
            name: APP_TITLE,
            display: 'standalone',
            orientation: 'notSet',
            onConflict: 'override',
            declared: true
          },
          assets: {
            legacyIcon: true,
            lowResolutionIcons: true
          }
        },
        safariPinnedTab: {
          pictureAspect: 'silhouette',
          themeColor: '#ff0000'
        }
      },
      settings: {
        scalingAlgorithm: 'Mitchell',
        errorOnImageTooSmall: false
      },
      markupFile: FAVICON_DATA_FILE
    }, () => {
      util.log('Icons created', util.colors.yellow(ICONS_DEST));
      done();
    });
  });
};
