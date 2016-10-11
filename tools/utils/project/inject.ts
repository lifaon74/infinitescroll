import * as gutil from 'gulp-util';
var through = require('through2');

export function inject(tagName:string, code:string) {
  let stream = through.obj((file:any, enc:any, cb:any) => {
    if(file.isBuffer()) {
      let html = file.contents.toString();

      let injectRegExp = new RegExp('<!--\\s+inject:' + tagName + '\\s+-->[^]*?<!--\\s+endinject\\s+-->', 'g');


      let htmlToInject = '';
      htmlToInject += '<!-- inject:' + tagName + ' -->\n';
      htmlToInject += code + '\n';
      htmlToInject += '<!-- endinject -->';

      html = html.replace(injectRegExp, htmlToInject);

      file.contents = new Buffer(html);
      stream.push(file);
      cb();
    }

    if(file.isStream()) {
      this.emit('error', new gutil.PluginError('Stream not supported'));
    }
  });
  return stream;
}
