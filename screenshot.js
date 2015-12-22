'use strict';

function setScreenshotUrl(urls) {
    urls.forEach(src => document.body.appendChild(Object.assign(document.createElement("img"), { src })));
}
