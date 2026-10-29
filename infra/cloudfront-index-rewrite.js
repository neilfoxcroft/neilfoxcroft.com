// CloudFront Function (viewer request, cloudfront-js-2.0) on distribution EAQFNSEB53K0Y: neilfoxcroft-index-rewrite.
// S3 behind CloudFront doesn't serve a folder's index.html by itself, so folder URLs are rewritten here:
//   /trail-stats/  -> /trail-stats/index.html
//   /trail-stats   -> /trail-stats/index.html   (no file extension, so it's a page)
// Files (anything with an extension in the last segment) pass through unchanged.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.split('/').pop().indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }
  return request;
}
