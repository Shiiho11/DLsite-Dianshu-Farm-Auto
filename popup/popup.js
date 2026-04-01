console.log("popup.js");

const $ = (id) => document.getElementById(id);

function getCodeTypeText(code_type) {
  if (code_type == null || code_type === "") {
    return "没有得到点数";
  } 
  
  try {
    // 解析后4位数字
    const match = code_type.match(/DL(\d{4})/);
    if (match) {
      const points = parseInt(match[1], 10);
      return `获得${points}点数`;
    } else {
      return "未知结果";
    }
  } catch (e) {
    console.error("解析code_type失败:", e);
    return "未知结果";
  }
}

function showError(message, linkUrl, linkText = "查看详情") {
  const el = $("error");
  if (!el) {
    console.error('Missing element: #error');
    return;
  }

  // 清空旧内容，避免累积
  el.textContent = "";

  // 错误文字（纯文本）
  const msgNode = document.createElement("div");
  msgNode.textContent = message || "发生未知错误";
  el.appendChild(msgNode);

  // 可选链接（安全创建，不拼 innerHTML）
  if (linkUrl) {
    const a = document.createElement("a");
    a.href = linkUrl;
    a.textContent = linkText;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    el.appendChild(a);
  }

  el.hidden = false;
}

async function loadState() {
  // 隐藏错误
  $("error").hidden = true;
  $("error").textContent = "";

  // 你可以按需要给默认值
  const data = await chrome.storage.local.get([
    "dianshu_farm_login_token",
    "lastTryDate",
    "lastRunDate",
    "code_type"
  ]);

  $("lastTryDate").textContent = data.lastTryDate;
  $("lastRunDate").textContent = data.lastRunDate;
  $("drawResult").textContent = getCodeTypeText(data.code_type);

  const token = data.dianshu_farm_login_token;
  if (token == null || token === "") {
    showError("获取登录Token失败，请先登录点数农场！", "https://dianshu.jp/farm", "点击此处登录");
  }
}

async function init() {
  try {
    await loadState();
  } catch (e) {
    showError(`初始化失败：${e?.message || String(e)}`);
  }

  $("runBtn").onclick = async () => {
    $("runBtn").disabled = true;
    try {
      await auto();
    } catch (e) {
      showError(`执行失败：${e?.message || String(e)}`);
      $("runBtn").disabled = false;
    }
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("popup.js收到消息:", message);
    if (message.action === "finished") {
      // 任务完成，刷新页面显示最新状态
      location.reload();
    } else {
      console.log("未知的action");
    }
  });
}

async function auto() {
  const response = await chrome.runtime.sendMessage({ action: "auto" });
  console.log("收到background.js的响应:", response);
}

window.addEventListener("DOMContentLoaded", init);