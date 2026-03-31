console.log("auto.js");

export async function checkAndRunTask() {
  chrome.storage.local.get(['lastRunDate'], (result) => {
    const lastRunDate = result.lastRunDate;
    const today = getJapanDateYYYYMMDD();
    console.log("检查每日任务执行情况，lastRunDate:", lastRunDate, "today:", today);
    if (lastRunDate !== today) {
      setBadge(false);
      chrome.storage.local.set({ lastTryDate: today });
      auto();
    } else {
      console.log("今日任务已执行过，无需重复执行");
      setBadge(true);
    }
  });
}

export async function auto() {
  let result = await chrome.storage.local.get("dianshu_farm_login_token");
  const token = result.dianshu_farm_login_token;

  if (token == null || token === "") {
    console.warn("获取登录Token失败！");
    chrome.tabs.create({
      url: "https://dianshu.jp/farm",
      active: true,     // 是否切换到新标签
    });
    return;
  }
  // 发送post请求到点数农场的接口，执行每日任务
  result = await postRequest("https://farm-api.dianshu.jp/v1/farm/self", { token: token });
  if (result == null) {
    console.warn("请求self失败！");
    return;
  }
  let history_id = result.result.last_history_id;
  console.log("self:", result);

  if (result.result.allow_draw) {
    console.log("可以抽奖，正在抽奖...");
    result = await postRequest("https://farm-api.dianshu.jp/v1/farm/draw", { token: token });
    if (result == null) {
      console.warn("请求draw失败！");
      return;
    }
    if (result.result.result !== "ok") {
      console.warn("抽奖失败，结果:", result);
      return;
    }
    history_id = result.result.id;
    console.log("draw:", result);
  }

  result = await postRequest("https://farm-api.dianshu.jp/v1/farm/history", { token: token, history_id: history_id });
  if (result == null) {
    console.warn("请求history失败！");
    return;
  }
  console.log("history:", result);
  await chrome.storage.local.set({ code_type: result.result.code_type });

  const today = getJapanDateYYYYMMDD();
  await chrome.storage.local.set({ lastRunDate: today });

  setBadge(true);
  // 通知popup页面任务已完成
  chrome.runtime.sendMessage({ action: "finished" });
}


async function postRequest(url, data) {
  let result = null;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "origin": "https://dianshu.jp",
      "referer": "https://dianshu.jp/"
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(json => {
      result = json;
      console.log("请求结果：", result);
    })
    .catch(error => {
      console.error("请求失败：", error);
    });
  return result;
}

function setBadge(flag) {
  if (flag) {
    chrome.action.setBadgeText({ text: "√" });
    chrome.action.setBadgeTextColor({ color: "#00ab00" });
  } else {
    chrome.action.setBadgeText({ text: "x" });
    chrome.action.setBadgeTextColor({ color: "#e00000" });
  }
}

function getJapanDateYYYYMMDD() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// https://farm-api.dianshu.jp/v1/farm/history
//     {
//     "success": true,
//     "result": {
//         "code_type": "DL0001", 抽到1点数
//         "status": "finished"
//     },
//     "message": null,
//     "error": null
// }

// https://farm-api.dianshu.jp/v1/farm/draw
// { token: token }
//     {
//     "success": true,
//     "result": {
//         "result": "ok",
//         "message": null,
//         "id": "dh_kuGHXnzA4nUkQNRG",
//         "code_type": "DL0001" 抽到1点数
//     },
//     "message": null,
//     "error": null
// }