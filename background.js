if (!globalThis.JiraCopilotAnalysis && typeof importScripts === "function") {
  importScripts("analysis-client.js");
}

const extensionApi = globalThis.browser || globalThis.chrome;
const analysisClient = globalThis.JiraCopilotAnalysis;
const PREFERENCES_KEY = "aiPreferences";
const API_KEY = "aiApiKey";
let fallbackSourceTabId = null;

extensionApi.runtime.onInstalled.addListener(() => {
  void initializeExtensionStorage();
  void configureSidePanel();
});

extensionApi.runtime.onStartup.addListener(() => {
  void initializeExtensionStorage();
  void configureSidePanel();
});

async function initializeExtensionStorage() {
  for (const area of [extensionApi.storage.local, extensionApi.storage.session]) {
    if (!area?.setAccessLevel) continue;
    try { await area.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }); }
    catch (error) { console.warn("Unable to restrict storage access", error); }
  }
}

async function configureSidePanel() {
  if (!extensionApi.sidePanel?.setPanelBehavior) return;
  try {
    await extensionApi.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.warn("Unable to configure side panel behavior", error);
  }
}

if (!extensionApi.sidePanel?.setPanelBehavior && extensionApi.action?.onClicked) {
  extensionApi.action.onClicked.addListener(async (tab) => {
    fallbackSourceTabId = tab?.id || null;
    try {
      if (extensionApi.sidebarAction?.open) {
        await extensionApi.sidebarAction.open();
      } else if (extensionApi.windows?.create) {
        await extensionApi.windows.create({
          url: extensionApi.runtime.getURL("sidepanel.html"),
          type: "popup",
          width: 480,
          height: 860
        });
      }
    } catch (error) {
      console.warn("Unable to open the extension panel", error);
    }
  });
}

extensionApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  routeMessage(message)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => {
      console.error(error);
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unexpected extension error" });
    });
  return true;
});

async function routeMessage(message) {
  switch (message?.type) {
    case "EXTRACT_ACTIVE_JIRA": return extractActiveJira();
    case "ANALYZE_REQUIREMENT": return analyzeRequirement(message.payload);
    case "GET_AI_SETTINGS": return getPublicAISettings();
    case "SAVE_AI_SETTINGS": return saveAISettings(message.payload);
    case "CLEAR_API_KEY": return clearApiKey();
    case "TEST_AI_PROVIDER": return testAIProvider(message.payload);
    default: throw new Error("Unsupported extension request");
  }
}

async function extractActiveJira() {
  let tab = fallbackSourceTabId ? await getTab(fallbackSourceTabId) : null;
  if (!tab) [tab] = await extensionApi.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active browser tab was found.");

  try {
    const results = await extensionApi.scripting.executeScript({ target: { tabId: tab.id }, files: ["content-script.js"] });
    return results?.[0]?.result || { detected: false, reason: "The Jira page could not be read. Paste the requirement manually." };
  } catch (error) {
    return {
      detected: false,
      reason: readableInjectionError(error),
      detail: error instanceof Error ? error.message : String(error),
      url: tab.url || ""
    };
  }
}

function readableInjectionError(error) {
  const detail = error instanceof Error ? error.message : String(error || "");
  if (/cannot access|missing host permission|extensions gallery|chrome:\/\//i.test(detail)) {
    return "Chrome has not granted access to this Jira tab. Reload the Jira page and try Refresh, or continue with manual input.";
  }
  return "The current Jira page could not be read. Paste the requirement manually.";
}

async function analyzeRequirement(payload) {
  const settings = await getPrivateAISettings();
  if (!settings.apiKey) throw new Error("请先打开设置，填写你自己的模型 API Key。");
  return analysisClient.analyzeRequirement(payload, settings);
}

async function getPublicAISettings() {
  const { preferences, apiKey, keyStorage } = await getStoredValues();
  return { preferences, hasKey: Boolean(apiKey), keyStorage };
}

async function getPrivateAISettings() {
  const { preferences, apiKey } = await getStoredValues();
  return { ...preferences, apiKey };
}

async function getStoredValues() {
  const localValues = await extensionApi.storage.local.get([PREFERENCES_KEY, API_KEY]);
  const sessionValues = await extensionApi.storage.session.get(API_KEY);
  const preferences = normalizePreferences(localValues[PREFERENCES_KEY] || {});
  const sessionCredential = normalizeCredential(sessionValues[API_KEY], preferences.provider);
  const localCredential = normalizeCredential(localValues[API_KEY], preferences.provider);
  if (sessionCredential?.provider === preferences.provider) {
    return { preferences, apiKey: sessionCredential.value, keyStorage: "session" };
  }
  if (localCredential?.provider === preferences.provider) {
    return { preferences, apiKey: localCredential.value, keyStorage: "local" };
  }
  return { preferences, apiKey: "", keyStorage: null };
}

async function saveAISettings(input = {}) {
  const preferences = normalizePreferences(input);
  const existing = await getStoredValues();
  await extensionApi.storage.local.set({ [PREFERENCES_KEY]: preferences });

  const existingKeyForSameProvider = existing.preferences.provider === preferences.provider ? existing.apiKey : "";
  const apiKey = String(input.apiKey || existingKeyForSameProvider || "").trim();
  const rememberKey = Boolean(input.rememberKey);
  const credential = { provider: preferences.provider, value: apiKey };
  if (apiKey && rememberKey) {
    await extensionApi.storage.local.set({ [API_KEY]: credential });
    await extensionApi.storage.session.remove(API_KEY);
  } else if (apiKey) {
    await extensionApi.storage.session.set({ [API_KEY]: credential });
    await extensionApi.storage.local.remove(API_KEY);
  } else {
    await Promise.all([extensionApi.storage.local.remove(API_KEY), extensionApi.storage.session.remove(API_KEY)]);
  }
  return { preferences, hasKey: Boolean(apiKey), keyStorage: apiKey ? (rememberKey ? "local" : "session") : null };
}

async function clearApiKey() {
  await Promise.all([extensionApi.storage.local.remove(API_KEY), extensionApi.storage.session.remove(API_KEY)]);
  return { cleared: true };
}

async function testAIProvider(input = {}) {
  const stored = await getStoredValues();
  const preferences = normalizePreferences(input);
  const storedKeyForSameProvider = preferences.provider === stored.preferences.provider ? stored.apiKey : "";
  const settings = {
    ...preferences,
    apiKey: String(input.apiKey || storedKeyForSameProvider || "").trim()
  };
  return analysisClient.testConnection(settings);
}

function normalizeCredential(value, legacyProvider) {
  if (typeof value === "string" && value.trim()) return { provider: legacyProvider, value: value.trim() };
  if (!value || typeof value !== "object") return null;
  const provider = String(value.provider || "").trim().toLowerCase();
  const credentialValue = String(value.value || "").trim();
  return provider && credentialValue ? { provider, value: credentialValue } : null;
}

function normalizePreferences(input) {
  const resolved = analysisClient.resolveSettings({
    provider: input.provider || "deepseek",
    baseUrl: input.baseUrl,
    model: input.model,
    apiMode: input.apiMode
  });
  return {
    provider: resolved.provider,
    baseUrl: resolved.baseUrl,
    model: resolved.model,
    apiMode: resolved.apiMode
  };
}

async function getTab(tabId) {
  try { return await extensionApi.tabs.get(tabId); }
  catch { fallbackSourceTabId = null; return null; }
}

void initializeExtensionStorage();
void configureSidePanel();
