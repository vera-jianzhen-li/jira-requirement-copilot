const extensionApi = globalThis.browser || globalThis.chrome;
const analysisClient = globalThis.JiraCopilotAnalysis;
const isExtension = Boolean(extensionApi?.runtime?.id);
const element = (id) => document.getElementById(id);
const providerInput = element("provider");
const modelInput = element("model");
const baseUrlInput = element("baseUrl");
const apiModeInput = element("apiMode");
const apiKeyInput = element("apiKey");
const rememberKeyInput = element("rememberKey");
const keyStatus = element("keyStatus");
const status = element("status");
const saveButton = element("saveButton");
const testButton = element("testButton");
const clearKeyButton = element("clearKeyButton");
const toggleKeyButton = element("toggleKeyButton");
let hasSavedKey = false;

async function loadSettings() {
  applyProfile("deepseek");
  if (!isExtension) {
    showStatus("warning", "请把文件夹加载为浏览器扩展后，再保存或测试设置。");
    setBusy(true);
    return;
  }
  try {
    const saved = await sendRuntimeMessage({ type: "GET_AI_SETTINGS" });
    const preferences = saved.preferences || {};
    providerInput.value = preferences.provider || "deepseek";
    modelInput.value = preferences.model || analysisClient.getProfile(providerInput.value).model;
    baseUrlInput.value = preferences.baseUrl || analysisClient.getProfile(providerInput.value).baseUrl;
    apiModeInput.value = preferences.apiMode || analysisClient.getProfile(providerInput.value).apiMode;
    hasSavedKey = Boolean(saved.hasKey);
    rememberKeyInput.checked = saved.keyStorage === "local";
    updateKeyStatus(saved.keyStorage);
  } catch (error) {
    showStatus("error", error.message || String(error));
  }
}

providerInput.addEventListener("change", () => {
  applyProfile(providerInput.value);
  hasSavedKey = false;
  apiKeyInput.value = "";
  rememberKeyInput.checked = false;
  updateKeyStatus(null);
});

toggleKeyButton.addEventListener("click", () => {
  const showing = apiKeyInput.type === "text";
  apiKeyInput.type = showing ? "password" : "text";
  toggleKeyButton.textContent = showing ? "显示" : "隐藏";
});

saveButton.addEventListener("click", async () => {
  if (!isExtension) return;
  setBusy(true);
  try {
    const settings = readForm();
    await ensureOriginPermission(settings.baseUrl);
    const saved = await sendRuntimeMessage({ type: "SAVE_AI_SETTINGS", payload: settings });
    apiKeyInput.value = "";
    hasSavedKey = Boolean(saved.hasKey);
    updateKeyStatus(saved.keyStorage);
    showStatus("success", saved.keyStorage === "local"
      ? "设置已保存。API Key 会保留在这台浏览器中。"
      : "设置已保存。API Key 会在关闭浏览器后清除。");
  } catch (error) {
    showStatus("error", error.message || String(error));
  } finally {
    setBusy(false);
  }
});

testButton.addEventListener("click", async () => {
  if (!isExtension) return;
  setBusy(true);
  try {
    const settings = readForm();
    if (!settings.apiKey && !hasSavedKey) throw new Error("请先填写你的 API Key。");
    await ensureOriginPermission(settings.baseUrl);
    const result = await sendRuntimeMessage({ type: "TEST_AI_PROVIDER", payload: settings });
    showStatus(result.verified ? "success" : "warning", result.verified
      ? `已连接 ${result.providerName}，当前模型：${result.model}。`
      : `已连接 ${result.providerName}，但该供应商不支持无消耗的 Key 校验；请保存后用一条需求验证模型。`);
  } catch (error) {
    showStatus("error", error.message || String(error));
  } finally {
    setBusy(false);
  }
});

clearKeyButton.addEventListener("click", async () => {
  if (!isExtension || !globalThis.confirm("确定清除当前保存的 API Key 吗？")) return;
  setBusy(true);
  try {
    await sendRuntimeMessage({ type: "CLEAR_API_KEY" });
    apiKeyInput.value = "";
    rememberKeyInput.checked = false;
    hasSavedKey = false;
    updateKeyStatus(null);
    showStatus("success", "API Key 已从本次会话和本机存储中清除。");
  } catch (error) {
    showStatus("error", error.message || String(error));
  } finally {
    setBusy(false);
  }
});

function applyProfile(provider) {
  const profile = analysisClient.getProfile(provider);
  modelInput.value = profile.model;
  baseUrlInput.value = profile.baseUrl;
  apiModeInput.value = profile.apiMode;
}

function readForm() {
  const settings = analysisClient.resolveSettings({
    provider: providerInput.value,
    model: modelInput.value,
    baseUrl: baseUrlInput.value,
    apiMode: apiModeInput.value,
    apiKey: apiKeyInput.value
  });
  return { ...settings, rememberKey: rememberKeyInput.checked };
}

async function ensureOriginPermission(baseUrl) {
  const originPattern = `${new URL(baseUrl).origin}/*`;
  const alreadyAllowed = await extensionApi.permissions.contains({ origins: [originPattern] });
  if (alreadyAllowed) return;
  const granted = await extensionApi.permissions.request({ origins: [originPattern] });
  if (!granted) throw new Error("未获得连接该 API 地址的权限。");
}

function sendRuntimeMessage(message) {
  return extensionApi.runtime.sendMessage(message).then((response) => {
    if (!response?.ok) throw new Error(response?.error || "扩展请求失败。");
    return response.data;
  });
}

function updateKeyStatus(keyStorage) {
  keyStatus.className = keyStorage ? "key-saved" : "";
  keyStatus.textContent = keyStorage === "local"
    ? "已保存：本机浏览器存储"
    : keyStorage === "session"
      ? "已保存：仅本次浏览器会话"
      : "尚未保存 API Key";
}

function showStatus(kind, message) {
  status.className = `status ${kind}`;
  status.textContent = message;
}

function setBusy(busy) {
  for (const button of [saveButton, testButton, clearKeyButton]) button.disabled = busy;
}

void loadSettings();
