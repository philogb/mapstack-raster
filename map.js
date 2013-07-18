// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {

  //based on https://github.com/mrcoles/full-page-screen-capture-chrome-extension/blob/master/popup.js
  //MIT license https://raw.github.com/mrcoles/full-page-screen-capture-chrome-extension/master/LICENSE
  function openPage(url, canvas) {
    // standard dataURI can be too big, let's blob instead
    // http://code.google.com/p/chromium/issues/detail?id=69227#c27

    var dataURI = canvas.toDataURL();

    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // create a blob for writing to a file
    var blob = new Blob([ab], {type: mimeString});

    // come up with a filename
    var name = url.split('?')[0].split('#')[0];
    if (name) {
      name = name
      .replace(/^https?:\/\//, '')
      .replace(/[^A-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[_\-]+/, '')
      .replace(/[_\-]+$/, '');
      name = '-' + name;
    } else {
      name = '';
    }
    name = 'screencapture' + name + '.png';

    function onwriteend() {
      // open the file that now contains the blob
      window.open('filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/temporary/' + name);
    }

    function errorHandler() {
      console.log('something wrong happened');
    }

    // create a blob for writing to a file
    window.webkitRequestFileSystem(TEMPORARY, 1024*1024, function(fs){
      fs.root.getFile(name, {create:true}, function(fileEntry) {
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.onwriteend = onwriteend;
          fileWriter.write(blob);
        }, errorHandler);
      }, errorHandler);
    }, errorHandler);
  }

  if (~tab.url.indexOf('http://mapstack.stamen.com/edit.html')) {
      chrome.tabs.executeScript(tab.id, {
        code: "\
        var container = document.querySelector('#map'), \
            imgs = [].slice.call(container.querySelectorAll('img.leaflet-tile.leaflet-tile-loaded')); \
        [imgs.map(function(img) { return [img.src, img.style.left, img.style.top, img.offsetWidth, img.offsetHeight]; }), container.offsetWidth, container.offsetHeight]; \
        "
      }, function(ans) {
        console.log('executed');
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
            console.log('open page');
            openPage(tab.url, canvas);
          }
        };

        var handleError = function() {
          counter--;
          console.log('error ' + this.src);
        };

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
          img.onerror = handleError.bind(img);
        }
      });
  }
});


