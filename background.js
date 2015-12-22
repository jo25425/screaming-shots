'use strict';

// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function activateTab(tabId, callback) {
    chrome.tabs.update(tabId, { active: true }, callback);
}

function recursiveTabCapture(windowId, tabArray, originalTabId, callbackWithDataUrlArray) {
    var dataUrlArray = [];

    var tabCapture = i => {
        activateTab(tabArray[i].id, () => {
            chrome.tabs.captureVisibleTab(windowId, dataUrl => {

                if (!chrome.runtime.lastError) {
                    dataUrlArray.push({ tabTitle: tabArray[i].title, dataUrl: dataUrl });
                }

                // switch to the next tab if there is one
                if(tabArray[i+1] != undefined) {
                    tabCapture(i+1);
                } else {
                    // if no more tabs, return to the original tab and fire callback
                    activateTab(originalTabId, () => callbackWithDataUrlArray(dataUrlArray));
                }
            });
        });
    }
    return tabCapture;
}

function captureWindowTabs(windowId, callbackWithDataUrlArray) {

    chrome.windows.get(windowId, {populate:true}, windowObj => {
        var tabArray = windowObj.tabs;
        var originalTab = tabArray.find(tab => tab.active);

        recursiveTabCapture(windowId, tabArray, originalTab.id, callbackWithDataUrlArray)(0);
    });
}

function captureActiveTabs(callback) {
    const getInfo = { windowTypes: ['normal', 'popup'] };
    const screenshotUrls = [];
    chrome.windows.getAll(getInfo, windowArray => {
        let countdown = windowArray.length;

        windowArray.forEach(window => {
            chrome.tabs.captureVisibleTab(window.id, screenshotUrl => {
                screenshotUrls.push(screenshotUrl);

               if (!--countdown) {
                   callback();
               }

           });
        })
    });
};

////////////////////////////////////////////////////////////////////////////////

function logArray(dataArray) {
    dataArray.forEach(url => console.log(url.tabTitle, url.dataUrl));
}

function showScreenshotsInNewTab(urls) {
    const viewTabUrl = chrome.extension.getURL('screenshot.html?id=' + id++);

    chrome.tabs.create({url: viewTabUrl}, tab => {
       setTimeout(() => {
           var views = chrome.extension.getViews();
           var viewTab = views.find(v => v.location.href === viewTabUrl);
           viewTab.setScreenshotUrl(urls);
       }, 1000);
   });
}

// To make sure we can uniquely identify each screenshot tab, add an id as a
// query param to the url that displays the screenshot.
// Note: It's OK that this is a global variable (and not in localStorage),
// because the event page will stay open as long as any screenshot tabs are
// open.
var id = 100;

// Listen for a click on the camera icon. On that click, take a screenshot.
chrome.browserAction.onClicked.addListener(() => {

    // get all tabs in the current window
    // captureWindowTabs(chrome.windows.WINDOW_ID_CURRENT, data => {
    //     showScreenshotsInNewTab(data.map(d => d.dataUrl));
    //     logArray('captureWindowTabs =>', data);
    // });

   //  var windowId = null;
   //  chrome.tabs.captureVisibleTab(windowId, screenshotUrl => {
   //     console.log('captureVisibleTab =>', screenshotUrl);
   //     showScreenshotsInNewTab([screenshotUrl]);
   // });

   captureActiveTabs(urls => {
       showScreenshotsInNewTab(urls);
      console.log('captureActiveTabs =>', urls);
  });

});
