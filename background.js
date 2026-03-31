console.log("background.js");

import { checkAndRunTask, auto } from './scripts/auto.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  checkAndRunTask();
});

chrome.runtime.onStartup.addListener(() => {
  checkAndRunTask();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background.js收到消息:", message);
  if (message.action === "checkAndRunTask") {
    checkAndRunTask();
    sendResponse({ status: "checkAndRunTask已执行" });
  } else if (message.action === "auto") {
    auto();
    sendResponse({ status: "auto已执行" });
  } else {
    sendResponse({ status: "未知的action" });
  }
});