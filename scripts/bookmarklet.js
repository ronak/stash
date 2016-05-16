/*
 * TODO
 *  - Minify bookmarklet code
 *  - Something better then an alert box to acknowledge success
 *  - Box for tagging
 *  - Chrome extension instead of bookmarklet
 */

'use strict';

let config = require('../config');

const host = process.argv[2];

const bookmarklet = (reqUrl, auth) => {
  let code = `javascript:(function() {
    var title = document.title;
    var url = window.location.href;
    var http = new XMLHttpRequest();
    var body = JSON.stringify({ title: title, urls: [url]});
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200)
        alert('added');
    };
    http.open('POST', '${reqUrl}', true);
    http.setRequestHeader('Content-Type', 'application/json');`;

  if (auth) {
    code += `http.setRequestHeader('Authorization', '${auth}');`;
  }

  code += 'http.send(body);})();';

  return code;
};

(function() {
  const reqUrl = `${host}:${config.PORT}/items`;

  if (process.env.NODE_ENV === 'production') {
    const auth = `${config.USER}:${config.PASS}`;
    const buffer = new Buffer(auth);
    const encodedAuth = buffer.toString('base64');
    console.log(bookmarklet(reqUrl, 'basic ' + encodedAuth));
  } else {
    console.log(bookmarklet(reqUrl));
  }
})();
