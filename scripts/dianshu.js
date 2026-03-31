console.log("dianshu.js");

function get_token() {
  const token = localStorage.getItem("dianshu_farm_login_token");
  if (token == null || token === "") {
    window.alert("来自DLsite Point Farm Auto\n获取登录Token失败，请先登录点数农场！");
    if (window.location.href !== "https://dianshu.jp/farm") {
      window.location.href = "https://dianshu.jp/farm";
    }
    return null;
  }
  chrome.storage.local.set({ "dianshu_farm_login_token": token });
  return token;
}

async function checkAndRunTask() {
  const response = await chrome.runtime.sendMessage({ action: "checkAndRunTask" });
  console.log("收到background.js的响应:", response);
}

get_token();
checkAndRunTask();