// Copyright (c) 2013 Nicolas Garcia Belmonte. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  if (~tab.url.indexOf('http://mapstack.stamen.com/edit.html')) {
      chrome.tabs.executeScript(tab.id, {
        code: "\
        var container = document.querySelector('#map'), \
            imgs = [].slice.call(container.querySelectorAll('img.leaflet-tile.leaflet-tile-loaded')); \
        [imgs.map(function(img) { return [img.src, img.style.left, img.style.top, img.offsetWidth, img.offsetHeight]; }), container.offsetWidth, container.offsetHeight]; \
        "
      }, function(ans) {
        ans = ans[0];
        var imgs = ans[0],
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            counter = imgs.length;

        canvas.width = ans[1];
        canvas.height = ans[2];

        var paint = function(img, x, y, width, height) {
          counter--;
          ctx.drawImage(img, x, y, width, height);
          if (!counter) {
            chrome.tabs.update(tab.id, {url: canvas.toDataURL()});
          }
        }

        for (var i = 0, l = imgs.length; i < l; ++i) {
          var img = new Image(),
              imgData = imgs[i],
              src = imgData[0],
              x = parseInt(imgData[1], 10),
              y = parseInt(imgData[2], 10),
              width = imgData[3],
              height = imgData[4];

          img.src = src;
          img.onload = paint.bind(img, img, x, y, width, height);
        }
      });
  }
});

