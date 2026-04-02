console.log("background.js");

import { checkAndRunTask, performTask } from './scripts/auto.js';

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
  } else if (message.action === "performTask") {
    performTask();
    sendResponse({ status: "performTask已执行" });
  } else {
    sendResponse({ status: "未知的action" });
  }
});

const DAILY_TASK_ALARM = "dailyTaskAlarm";
const PERIOD_MINUTES = 360; // 每6小时一次

async function createAlarm() {
  console.log("创建定时器");
  const alarm = await chrome.alarms.get(DAILY_TASK_ALARM);
  if (typeof alarm === 'undefined') {
    chrome.alarms.create(DAILY_TASK_ALARM, {
      delayInMinutes: PERIOD_MINUTES,
      periodInMinutes: PERIOD_MINUTES
    });
  }
}

createAlarm();

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === DAILY_TASK_ALARM) {
    console.log("收到定时器触发，执行checkAndRunTask");
    checkAndRunTask();
  }
});