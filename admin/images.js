/* ============================================================
   ByJooy Studio - preparing photos in the browser

   A phone photo is several megabytes and far larger than the site
   ever displays. Committing those straight into the repository would
   bloat it badly, so every upload is resized and converted to WebP
   here, producing the same two sizes the existing catalogue uses:

     assets/img/<slug>/<name>.webp         810px wide, for the lightbox
     assets/img/<slug>/thumb/<name>.webp   440px wide, for the cards
   ============================================================ */
(function () {
  'use strict';

  var FULL = 810;
  var THUMB = 440;
  var Q_FULL = 0.82;
  var Q_THUMB = 0.80;

  // Phone photos carry rotation in their EXIF data. Without this a
  // portrait shot can come out on its side.
  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' })
        .catch(function () { return viaImgTag(file); });
    }
    return viaImgTag(file);
  }

  function viaImgTag(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); res(im); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Could not read that image.')); };
      im.src = url;
    });
  }

  function toCanvas(bmp, targetW) {
    var w = bmp.width, h = bmp.height;
    var scale = Math.min(1, targetW / w);
    var cw = Math.max(1, Math.round(w * scale));
    var ch = Math.max(1, Math.round(h * scale));
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, cw, ch);
    return c;
  }

  function toBase64(canvas, quality) {
    return new Promise(function (res, rej) {
      canvas.toBlob(function (blob) {
        if (!blob) { rej(new Error('Could not convert that image.')); return; }
        var fr = new FileReader();
        fr.onload = function () {
          // strip the "data:image/webp;base64," prefix
          res(String(fr.result).split(',')[1]);
        };
        fr.onerror = function () { rej(new Error('Could not read the converted image.')); };
        fr.readAsDataURL(blob);
      }, 'image/webp', quality);
    });
  }

  /* Returns { full: base64, thumb: base64, preview: objectUrl } */
  function prepare(file) {
    return decode(file).then(function (bmp) {
      var cFull = toCanvas(bmp, FULL);
      var cThumb = toCanvas(bmp, THUMB);
      return Promise.all([
        toBase64(cFull, Q_FULL),
        toBase64(cThumb, Q_THUMB)
      ]).then(function (out) {
        if (bmp.close) bmp.close();
        return {
          full: out[0],
          thumb: out[1],
          preview: 'data:image/webp;base64,' + out[1]
        };
      });
    });
  }

  function webpSupported() {
    var c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  window.ByJooyImages = { prepare: prepare, webpSupported: webpSupported };
})();
