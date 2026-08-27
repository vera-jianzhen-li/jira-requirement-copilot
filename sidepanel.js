const MODULES = {
  General: ["General", "Process", "Reporting"],
  Insurance: [
    "General",
    "Product Factory",
    "Party",
    "Agreement",
    "Quotation",
    "Underwriting",
    "Policy",
    "Endorsement",
    "Renewal",
    "Cancellation / Reinstatement",
    "Billing / Payment / Commission",
    "Documents",
    "Claims",
    "Integration / Data",
    "Security / Audit / Compliance"
  ],
  Banking: ["General", "Onboarding", "Lending", "Payments", "Risk", "Compliance"]
};

const SAMPLE_JIRA = {
  detected: true,
  issueKey: "GCIP-105",
  summary: "Recalculate premium following pre-inception risk changes after quote acceptance",
  description: `A broker must be able to amend risk information after quote acceptance but before policy inception. The current process requires the quote to be voided and recreated.

Where rating-related changes are made, the system should recalculate the premium. If the premium changes, the revised quote must be re-accepted by the broker before the policy can be issued. If the change triggers underwriting rules, the existing referral process should apply and must be resolved before issuance. Renewal is outside scope.`,
  url: "https://example.atlassian.net/browse/GCIP-105"
};

const SAMPLE_ANALYSIS = {
  understand: {
    businessExplanation: "业务方希望 Broker 在报价已接受、但保单尚未生效之前仍可修改风险信息。系统需要根据修改内容决定是否重算保费、要求 Broker 重新接受报价，或重新进入人工核保流程。",
    chineseTranslation: "Broker 必须能够在报价接受之后、保单生效之前修改风险信息。当前流程要求将报价作废并重新创建。\n\n如果修改内容与费率相关，系统应重新计算保费。如果保费发生变化，修订后的报价必须由 Broker 重新接受，之后才能签发保单。如果修改触发核保规则，则应沿用现有 referral 流程，并在签发前完成处理。续保不在本次范围内。"
  },
  domainTerms: [
    { term: "Quote Acceptance", chineseName: "报价接受", explanation: "Broker 或客户正式接受当前报价的业务节点。" },
    { term: "Policy Inception", chineseName: "保单生效", explanation: "保单承保责任正式开始的时间点。" },
    { term: "Underwriting Referral", chineseName: "人工核保转介", explanation: "风险规则触发后，需要 Underwriter 人工审核的流程。" }
  ],
  breakdown: {
    businessGoal: "允许在保单生效前修正风险信息，同时保证保费与核保结论保持正确。",
    actors: ["Broker（发起修改）", "Underwriter（referral 场景下参与）"],
    currentBehaviour: "报价被接受后风险信息锁定；如需修改必须作废报价并重新创建。",
    expectedBehaviour: "报价接受后、保单生效前允许修改；费率相关修改触发保费重算，保费变化需重新接受，核保 referral 需在签发前解决。",
    preconditions: { status: "not_specified", detail: "Not specified in the Jira" },
    businessRules: [
      { rule: "Changes are only allowed before policy inception.", sourceEvidence: "before policy inception" },
      { rule: "Rating-related changes require premium recalculation.", sourceEvidence: "Where rating-related changes are made" },
      { rule: "Premium changes require broker re-acceptance.", sourceEvidence: "must be re-accepted by the broker" },
      { rule: "Renewal is outside scope.", sourceEvidence: "Renewal is outside scope" }
    ],
    scopeIn: ["New Business", "Pre-Inception"],
    scopeOut: ["Renewal"]
  },
  gaps: {
    missingBusinessRules: [
      { title: "Recalculation trigger fields", detail: "The requirement does not specify which risk fields should trigger premium recalculation.", why: "开发无法将 rating-related changes 对应到具体字段。", sourceEvidence: "rating-related changes" },
      { title: "Payment adjustment", detail: "The requirement does not define what happens when payment has already been collected and the revised premium is different.", why: "未说明退费、补费或阻止修改中的哪一种处理方式。", sourceEvidence: "Not specified in the Jira" }
    ],
    ambiguities: [
      { title: "Meaning of issued", detail: "Does ‘before the policy can be issued’ mean before policy number generation, document generation, or final release?", why: "不同解释会改变系统校验节点。", sourceEvidence: "before the policy can be issued" }
    ],
    contextDependencies: [
      { title: "Existing referral process", detail: "The referenced referral process is not defined in the current Jira.", why: "需要确认触发规则、状态流转和关闭条件。", sourceEvidence: "the existing referral process should apply" }
    ],
    potentialImpacts: [
      { area: "Premium Calculation", level: "high", reason: "风险字段修改可能触发重新计价。" },
      { area: "Underwriting Rules", level: "high", reason: "修改后可能需要重新执行核保规则。" },
      { area: "Referral Workflow", level: "high", reason: "需求引用了现有 referral 流程。" },
      { area: "Policy Issuance", level: "medium", reason: "重新接受与 referral 会形成签发前置条件。" },
      { area: "Payment Adjustment", level: "medium", reason: "保费变化可能影响已收付款。" }
    ]
  },
  questions: [
    { priority: "high", question: "Which risk information changes should trigger premium recalculation?", reason: "对应缺失的保费重算字段规则。" },
    { priority: "high", question: "Should underwriting rules be re-evaluated after every risk-related amendment?", reason: "对应现有 referral 流程依赖。" },
    { priority: "high", question: "What should happen if payment has already been collected and the revised premium is lower than the amount paid?", reason: "对应缺失的 payment adjustment 规则。" },
    { priority: "medium", question: "Should new policy documents be generated after the revised premium is accepted?", reason: "对应潜在的保单文件影响。" }
  ],
  disclaimer: "Potential impacts are inferred from the current requirement and should be validated against the existing system."
};

const extensionApi = globalThis.browser || globalThis.chrome;
const localAnalysisClient = globalThis.JiraCopilotLocal;
const isExtension = Boolean(extensionApi?.runtime?.id);
const element = (id) => document.getElementById(id);
const dom = {
  panelBody: document.querySelector(".panel-body"),
  initialView: element("initialView"),
  manualView: element("manualView"),
  analyzingView: element("analyzingView"),
  resultView: element("resultView"),
  resultFooter: element("resultFooter"),
  resultContent: element("resultContent"),
  resultNav: element("resultNav"),
  resultMeta: element("resultMeta"),
  issueKey: element("issueKey"),
  issueSummary: element("issueSummary"),
  contextStatus: element("contextStatus"),
  contextStatusText: element("contextStatusText"),
  analyzeButton: element("analyzeButton"),
  aiAnalyzeButton: element("aiAnalyzeButton"),
  manualSummary: element("manualSummary"),
  manualDescription: element("manualDescription"),
  progressBar: element("progressBar"),
  analyzingContext: element("analyzingContext"),
  analysisSteps: [...document.querySelectorAll("#analysisSteps li")],
  alert: element("globalAlert"),
  alertText: element("globalAlertText"),
  toast: element("toast"),
  toastText: element("toastText")
};

const state = {
  view: "initial",
  sourceView: "initial",
  jira: null,
  analysis: null,
  analysisMode: "local",
  localBaseline: null,
  checklist: null,
  resultMeta: null,
  moduleScopes: {
    jira: { mode: "auto", detected: [], selected: [] },
    manual: { mode: "auto", detected: [], selected: [] }
  },
  analysisReturnView: "initial",
  activeRequest: 0,
  progressTimer: null,
  toastTimer: null
};

function init() {
  bindControls();
  bindReviewScope("jira", element("industrySelect"));
  bindReviewScope("manual", element("manualIndustrySelect"));
  updateManualCounts();
  void loadLocalChecklist();
  void detectJira();
}

function bindControls() {
  element("settingsButton").addEventListener("click", () => {
    if (isExtension) extensionApi.runtime.openOptionsPage();
    else showAlert("Settings are available when the folder is loaded as a browser extension.");
  });
  element("closeButton").addEventListener("click", () => window.close());
  element("refreshButton").addEventListener("click", () => void detectJira());
  element("dismissAlert").addEventListener("click", hideAlert);
  element("manualButton").addEventListener("click", openManualView);
  element("manualBackButton").addEventListener("click", () => setView("initial"));
  element("manualCancelButton").addEventListener("click", () => setView("initial"));
  dom.analyzeButton.addEventListener("click", () => void startLocalCheck("jira"));
  dom.aiAnalyzeButton.addEventListener("click", () => void startAIAnalysis("jira"));
  element("manualAnalyzeButton").addEventListener("click", () => void startLocalCheck("manual"));
  element("manualAiAnalyzeButton").addEventListener("click", () => void startAIAnalysis("manual"));
  element("cancelAnalysisButton").addEventListener("click", cancelAnalysis);
  element("analysisOptionsButton").addEventListener("click", returnToAnalysisOptions);
  element("aiEnhanceButton").addEventListener("click", () => void startAIAnalysis(state.sourceView === "manual" ? "manual" : "jira"));
  element("copyAnalysisButton").addEventListener("click", () => void copyText(formatAnalysis(state.analysis), "Full analysis copied"));
  const updateManualInput = () => {
    updateManualCounts();
    updateAutoDetectedModules("manual");
  };
  dom.manualSummary.addEventListener("input", updateManualInput);
  dom.manualDescription.addEventListener("input", updateManualInput);
  dom.resultNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-target]");
    if (!button) return;
    const target = element(button.dataset.target);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(button.dataset.target);
  });
  dom.panelBody.addEventListener("scroll", updateNavFromScroll, { passive: true });
}

function bindReviewScope(source, industrySelect) {
  const prefix = source === "manual" ? "manual" : "jira";
  const picker = element(`${prefix}ModulePicker`);
  const adjustButton = element(`${prefix}AdjustModulesButton`);
  const autoButton = element(`${prefix}AutoScopeButton`);
  const options = element(`${prefix}ModuleOptions`);

  adjustButton.addEventListener("click", () => {
    const isOpening = picker.classList.contains("hidden");
    setModulePickerOpen(source, isOpening);
  });
  autoButton.addEventListener("click", () => {
    const scope = state.moduleScopes[source];
    scope.mode = "auto";
    scope.selected = [];
    renderReviewScope(source, industrySelect);
    setModulePickerOpen(source, false);
    showToast("Automatic module detection restored");
  });
  options.addEventListener("change", (event) => {
    const checkbox = event.target.closest('input[type="checkbox"][data-module]');
    if (!checkbox) return;
    const scope = state.moduleScopes[source];
    const selected = new Set(scope.mode === "manual" ? scope.selected : scope.detected);
    if (checkbox.checked && selected.size >= 5) {
      checkbox.checked = false;
      showAlert("Select up to 5 modules, or use automatic detection.");
      return;
    }
    if (checkbox.checked) selected.add(checkbox.dataset.module);
    else selected.delete(checkbox.dataset.module);
    scope.mode = "manual";
    scope.selected = [...selected];
    renderReviewScope(source, industrySelect);
  });
  industrySelect.addEventListener("change", () => {
    const available = new Set(reviewScopeChoices(industrySelect.value));
    const scope = state.moduleScopes[source];
    scope.selected = scope.selected.filter((name) => available.has(name));
    scope.detected = scope.detected.filter((name) => available.has(name));
    updateAutoDetectedModules(source);
    renderReviewScope(source, industrySelect);
  });
  renderReviewScope(source, industrySelect);
}

function renderReviewScope(source, industrySelect) {
  const prefix = source === "manual" ? "manual" : "jira";
  const scope = state.moduleScopes[source];
  const selected = new Set(scope.mode === "manual" ? scope.selected : scope.detected);
  const options = reviewScopeChoices(industrySelect.value).map((name) => {
    const label = document.createElement("label");
    label.className = "module-option";
    label.classList.toggle("auto-detected", scope.mode === "auto" && selected.has(name));
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.module = name;
    checkbox.checked = selected.has(name);
    const text = document.createElement("span");
    text.textContent = name;
    label.append(checkbox, text);
    if (scope.mode === "auto" && selected.has(name)) {
      const badge = document.createElement("small");
      badge.textContent = "Auto";
      label.append(badge);
    }
    return label;
  });
  element(`${prefix}ModuleOptions`).replaceChildren(...options);
  element(`${prefix}AutoScopeButton`).classList.toggle("hidden", scope.mode === "auto");
  element(`${prefix}ModulePickerHint`).textContent = scope.mode === "manual"
    ? "Manual scope · select up to 5 modules"
    : scope.detected.length ? "Automatically detected · edit any checkbox to override" : "No related modules detected yet";
  updateReviewScopeSummary(source);
}

function setModulePickerOpen(source, isOpen) {
  const prefix = source === "manual" ? "manual" : "jira";
  element(`${prefix}ModulePicker`).classList.toggle("hidden", !isOpen);
  const button = element(`${prefix}AdjustModulesButton`);
  button.setAttribute("aria-expanded", String(isOpen));
  button.textContent = isOpen ? "Done" : "Choose manually";
}

function reviewScopeChoices(industry) {
  return (MODULES[industry] || MODULES.General).filter((name) => name !== "General");
}

function updateReviewScopeSummary(source) {
  const prefix = source === "manual" ? "manual" : "jira";
  const scope = state.moduleScopes[source];
  element(`${prefix}ScopeSummary`).textContent = scope.mode === "manual"
    ? `Manual: ${scope.selected.join(" + ") || "General checks only"}`
    : scope.detected.length
      ? `Auto-detected: ${scope.detected.join(" + ")}`
      : source === "manual" ? "Auto-detect from pasted requirement" : "Auto-detect from Jira";
  element(`${prefix}ReviewScope`).classList.toggle("manual-scope", scope.mode === "manual");
}

function updateAutoDetectedModules(source) {
  const scope = state.moduleScopes[source];
  const industry = element(source === "manual" ? "manualIndustrySelect" : "industrySelect").value;
  const requirement = source === "manual"
    ? { summary: dom.manualSummary.value.trim(), description: dom.manualDescription.value.trim() }
    : { summary: state.jira?.summary || "", description: state.jira?.description || "" };
  if (!state.checklist || !requirement.summary || !requirement.description || industry !== "Insurance") {
    scope.detected = [];
    renderReviewScope(source, element(source === "manual" ? "manualIndustrySelect" : "industrySelect"));
    return;
  }
  try {
    const context = localAnalysisClient.selectChecklistContext({
      issueKey: source === "manual" ? state.jira?.issueKey || "" : state.jira?.issueKey || "",
      summary: requirement.summary,
      description: requirement.description,
      industry,
      module: "Auto-detect",
      modules: []
    }, state.checklist, 30);
    const available = new Set(reviewScopeChoices(industry));
    scope.detected = context.matchedModules
      .map(moduleNameFromId)
      .filter((name) => name && name !== "General" && available.has(name));
  } catch {
    scope.detected = [];
  }
  renderReviewScope(source, element(source === "manual" ? "manualIndustrySelect" : "industrySelect"));
}

function moduleNameFromId(moduleId) {
  return Object.entries(localAnalysisClient.MODULE_ALIASES)
    .find(([name, id]) => id === moduleId && MODULES.Insurance.includes(name))?.[0] || "";
}

function selectedScopeModules(source) {
  const scope = state.moduleScopes[source];
  return scope.mode === "manual" ? [...scope.selected] : [];
}

async function detectJira() {
  hideAlert();
  setContextStatus("", "Detecting Jira content");
  dom.issueKey.textContent = "Checking Jira…";
  dom.issueSummary.textContent = "Reading the active browser tab.";
  dom.analyzeButton.disabled = true;
  dom.aiAnalyzeButton.disabled = true;

  try {
    const jira = isExtension
      ? await sendRuntimeMessage({ type: "EXTRACT_ACTIVE_JIRA" })
      : SAMPLE_JIRA;
    state.jira = jira;

    dom.issueKey.textContent = jira.issueKey || "Jira content not detected";
    dom.issueSummary.textContent = jira.summary || jira.reason || "Paste the requirement manually.";
    if (jira.detected) {
      setContextStatus("success", "Jira content detected ✓");
      dom.analyzeButton.disabled = !state.checklist;
      dom.aiAnalyzeButton.disabled = false;
      prefillManual(jira);
      updateAnalysisEntryHints(true);
      updateAutoDetectedModules("jira");
    } else {
      setContextStatus(jira.partial ? "warning" : "error", jira.reason || "Jira content not detected");
      prefillManual(jira);
      dom.analyzeButton.disabled = !state.checklist;
      dom.aiAnalyzeButton.disabled = false;
      updateAnalysisEntryHints(false);
      updateAutoDetectedModules("jira");
    }
  } catch (error) {
    state.jira = null;
    dom.issueKey.textContent = "Jira content not detected";
    dom.issueSummary.textContent = "Paste the requirement manually to continue.";
    setContextStatus("error", "Could not read the active tab");
    dom.analyzeButton.disabled = !state.checklist;
    dom.aiAnalyzeButton.disabled = false;
    updateAnalysisEntryHints(false);
    updateAutoDetectedModules("jira");
    showAlert(error.message || String(error));
  }
}

function updateAnalysisEntryHints(hasJiraContent) {
  dom.analyzeButton.querySelector("small").textContent = hasJiraContent ? "No API cost" : "Manual input available";
  dom.aiAnalyzeButton.querySelector("small").textContent = hasJiraContent ? "Optional · Uses your API" : "Manual input available";
}

function openManualView() {
  if (state.jira) prefillManual(state.jira);
  setView("manual");
  dom.manualSummary.focus();
}

function prefillManual(jira) {
  if (jira?.summary && !dom.manualSummary.value) dom.manualSummary.value = jira.summary;
  if (jira?.description && !dom.manualDescription.value) dom.manualDescription.value = jira.description;
  updateManualCounts();
  updateAutoDetectedModules("manual");
}

async function loadLocalChecklist() {
  if (state.checklist) return state.checklist;
  try {
    const checklistUrl = isExtension
      ? extensionApi.runtime.getURL("knowledge/insurance-checklist.v1.json")
      : "knowledge/insurance-checklist.v1.json";
    const response = await fetch(checklistUrl);
    if (!response.ok) throw new Error(`Checklist could not be loaded (${response.status}).`);
    state.checklist = await response.json();
    if (state.jira !== null) dom.analyzeButton.disabled = false;
    updateAutoDetectedModules("jira");
    updateAutoDetectedModules("manual");
    return state.checklist;
  } catch (error) {
    dom.analyzeButton.disabled = true;
    element("manualAnalyzeButton").disabled = true;
    showAlert(`免费本地保险清单加载失败：${error.message || String(error)}`);
    throw error;
  }
}

async function startLocalCheck(source) {
  hideAlert();
  const payload = buildPayload(source);
  if (!payload) return;
  try {
    const checklist = await loadLocalChecklist();
    const response = localAnalysisClient.analyzeRequirement(payload, checklist);
    state.sourceView = source === "manual" ? "manual" : "initial";
    state.analysisMode = "local";
    state.localBaseline = response.analysis;
    state.analysis = response.analysis;
    state.resultMeta = buildResultMeta(payload, source, "local", response.meta);
    renderAnalysis(response.analysis);
    setView("result");
    showToast("Free local check completed · No API used");
  } catch (error) {
    setView(source === "manual" ? "manual" : "initial");
    showAlert(error.message || String(error));
  }
}

async function startAIAnalysis(source) {
  hideAlert();
  const payload = buildPayload(source);
  if (!payload) return;

  state.sourceView = source === "manual" ? "manual" : "initial";
  state.analysisReturnView = state.view === "result" ? "result" : state.sourceView;
  dom.analyzingContext.textContent = `${payload.issueKey || "Manual input"} · ${payload.industry} / ${payload.module}`;
  element("analyzingTitle").textContent = "Running AI deep analysis…";
  const requestId = ++state.activeRequest;
  setView("analyzing");
  startProgressAnimation();

  try {
    let localBaseline = null;
    try {
      const checklist = await loadLocalChecklist();
      localBaseline = localAnalysisClient.analyzeRequirement(payload, checklist).analysis;
      payload.checklistContext = localAnalysisClient.selectChecklistContext(payload, checklist, 30);
    } catch (checklistError) {
      console.warn("Local checklist context unavailable for AI analysis", checklistError);
    }
    const response = isExtension
      ? await sendRuntimeMessage({ type: "ANALYZE_REQUIREMENT", payload })
      : await previewAnalysis();
    if (requestId !== state.activeRequest) return;
    finishProgressAnimation();
    state.analysisMode = "ai";
    state.localBaseline = localBaseline;
    state.analysis = localBaseline ? mergeLocalAndAI(response.analysis, localBaseline) : response.analysis;
    state.resultMeta = buildResultMeta(payload, source, "ai", response.meta);
    renderAnalysis(state.analysis);
    setView("result");
  } catch (error) {
    if (requestId !== state.activeRequest) return;
    stopProgressAnimation();
    setView(state.analysisReturnView);
    showAlert(error.message || String(error));
  }
}

function buildResultMeta(payload, source, mode, providerMeta = {}) {
  return {
    issueKey: payload.issueKey || "Manual input",
    industry: payload.industry,
    module: payload.modules.length ? `Manual: ${payload.modules.join(" + ")}` : "Auto-detected scope",
    mode,
    provider: providerMeta.providerName || providerMeta.provider || "",
    source: source === "manual" ? "Manual input" : "Jira Summary + Description",
    analyzedAt: new Date()
  };
}

function mergeLocalAndAI(aiAnalysis, localAnalysis) {
  const result = typeof structuredClone === "function"
    ? structuredClone(aiAnalysis)
    : JSON.parse(JSON.stringify(aiAnalysis));
  result.gaps ||= {};
  const mergeByCheckId = (aiItems, localItems) => {
    const values = safeArray(aiItems);
    const existingIds = new Set(values.map((item) => item.checkId).filter(Boolean));
    for (const item of safeArray(localItems)) {
      if (item.checkId && existingIds.has(item.checkId)) continue;
      values.push(item);
      if (item.checkId) existingIds.add(item.checkId);
    }
    return values;
  };
  result.gaps.missingBusinessRules = mergeByCheckId(result.gaps.missingBusinessRules, localAnalysis.gaps?.missingBusinessRules);
  result.gaps.ambiguities = mergeByCheckId(result.gaps.ambiguities, localAnalysis.gaps?.ambiguities);
  result.gaps.contextDependencies = mergeByCheckId(result.gaps.contextDependencies, localAnalysis.gaps?.contextDependencies);
  result.gaps.potentialImpacts = mergeByCheckId(result.gaps.potentialImpacts, localAnalysis.gaps?.potentialImpacts);
  result.questions = mergeByCheckId(result.questions, localAnalysis.questions);
  result.localReview = {
    ...localAnalysis.localReview,
    mode: "ai_with_local",
    localFindingsPreserved: true
  };
  result.disclaimer = `${result.disclaimer || ""} Local checklist findings are preserved as hypotheses and require validation.`.trim();
  return result;
}

function buildPayload(source) {
  if (source === "manual") {
    const summary = dom.manualSummary.value.trim();
    const description = dom.manualDescription.value.trim();
    if (!summary || !description) {
      showAlert("Please provide both Summary and Description before analyzing.");
      return null;
    }
    return {
      issueKey: state.jira?.issueKey || "",
      summary,
      description,
      industry: element("manualIndustrySelect").value,
      module: selectedScopeModules("manual").length ? selectedScopeModules("manual").join(" + ") : "Auto-detect",
      modules: selectedScopeModules("manual")
    };
  }

  if (!state.jira?.detected) {
    showAlert("Jira content is not available. Paste the requirement manually.");
    openManualView();
    return null;
  }
  return {
    issueKey: state.jira.issueKey || "",
    summary: state.jira.summary,
    description: state.jira.description,
    industry: element("industrySelect").value,
    module: selectedScopeModules("jira").length ? selectedScopeModules("jira").join(" + ") : "Auto-detect",
    modules: selectedScopeModules("jira")
  };
}

function cancelAnalysis() {
  state.activeRequest += 1;
  stopProgressAnimation();
  setView(state.analysisReturnView);
  showToast("Analysis cancelled");
}

function returnToAnalysisOptions() {
  hideAlert();
  setView(state.sourceView === "manual" ? "manual" : "initial");
}

function setView(name) {
  state.view = name;
  dom.initialView.classList.toggle("hidden", name !== "initial");
  dom.manualView.classList.toggle("hidden", name !== "manual");
  dom.analyzingView.classList.toggle("hidden", name !== "analyzing");
  dom.resultView.classList.toggle("hidden", name !== "result");
  dom.resultFooter.classList.toggle("hidden", name !== "result");
  dom.panelBody.scrollTop = 0;
  if (name === "result") setActiveNav("understandSection");
}

function startProgressAnimation() {
  stopProgressAnimation();
  let step = 0;
  updateProgress(step);
  state.progressTimer = setInterval(() => {
    if (step < dom.analysisSteps.length - 1) step += 1;
    updateProgress(step);
  }, 1150);
}

function updateProgress(activeIndex) {
  dom.analysisSteps.forEach((item, index) => {
    item.classList.toggle("done", index < activeIndex);
    item.classList.toggle("active", index === activeIndex);
  });
  const progress = Math.min(92, 10 + activeIndex * 19);
  dom.progressBar.style.width = `${progress}%`;
}

function finishProgressAnimation() {
  stopProgressAnimation();
  dom.analysisSteps.forEach((item) => {
    item.classList.add("done");
    item.classList.remove("active");
  });
  dom.progressBar.style.width = "100%";
}

function stopProgressAnimation() {
  if (state.progressTimer) clearInterval(state.progressTimer);
  state.progressTimer = null;
}

function renderAnalysis(analysis) {
  const isLocal = state.analysisMode === "local";
  dom.resultNav.querySelector('[data-target="understandSection"]').textContent = isLocal ? "Local Review" : "Understand";
  dom.resultNav.querySelector('[data-target="breakdownSection"]').textContent = isLocal ? "Coverage" : "Breakdown";
  const breakdown = analysis.breakdown || {};
  const gaps = analysis.gaps || {};
  const rules = safeArray(breakdown.businessRules);
  const missing = safeArray(gaps.missingBusinessRules);
  const ambiguities = safeArray(gaps.ambiguities);
  const dependencies = safeArray(gaps.contextDependencies);
  const impacts = safeArray(gaps.potentialImpacts);
  const questions = safeArray(analysis.questions);
  renderResultChrome({ termCount: safeArray(analysis.domainTerms).length, gapCount: missing.length + ambiguities.length + dependencies.length, questionCount: questions.length });

  dom.resultContent.innerHTML = `
    <section class="result-section" id="understandSection">
      ${sectionHead(1, isLocal ? "Free Local Review" : "Understand", isLocal ? "本次检查范围与待确认项" : "这条需求到底在说什么", "understand")}
      ${isLocal ? renderLocalReviewSummary(analysis.localReview) : `
        <div class="explanation-card"><span class="card-label">Business Explanation</span>${escapeHtml(analysis.understand?.businessExplanation)}</div>
        <div class="translation-card">
          <div class="translation-head">Chinese Translation</div>
          <div class="translation-body clipped" id="translationBody">${escapeHtml(analysis.understand?.chineseTranslation)}</div>
          <button class="translation-toggle" id="translationToggle" type="button">Show full text</button>
        </div>`}
    </section>

    <section class="result-section" id="termsSection">
      ${sectionHead(2, "Domain Terms", "需求中出现的行业专业术语", "terms")}
      <div class="term-list">${renderTerms(analysis.domainTerms)}</div>
      <div class="note-line">${isLocal ? "Terms are detected from the built-in local dictionary. No content was sent to an API." : "Only terminology is explained here. The Copilot does not add business rules that are not stated in the Jira."}</div>
    </section>

    <section class="result-section" id="breakdownSection">
      ${sectionHead(3, "Requirement Breakdown", "Jira 里已经明确写了什么", "breakdown")}
      <div class="kv-table">
        ${kvRow("Business Goal", escapeHtml(breakdown.businessGoal))}
        ${kvRow("Actor", linesOrNotSpecified(breakdown.actors))}
        ${kvRow("Current Behaviour", notSpecifiedMarkup(breakdown.currentBehaviour))}
        ${kvRow("Expected Behaviour", notSpecifiedMarkup(breakdown.expectedBehaviour))}
        ${kvRow("Preconditions", renderPreconditions(breakdown.preconditions))}
        ${kvRow("Business Rules Identified", rules.length ? `<ol class="rule-list">${rules.map((rule) => `<li>${escapeHtml(rule.rule)}<span class="source-evidence">Source: ${escapeHtml(rule.sourceEvidence)}</span></li>`).join("")}</ol>` : emptyMarkup())}
        ${kvRow("Scope", renderScope(breakdown.scopeIn, breakdown.scopeOut))}
      </div>
    </section>

    <section class="result-section" id="gapsSection">
      ${sectionHead(4, "Gaps &amp; Impact", "Jira 没说清楚的地方", "gaps")}
      <div class="gap-tabs" id="gapTabs">
        <button class="gap-tab active" type="button" data-gap-filter="all">All <span>${missing.length + ambiguities.length + dependencies.length}</span></button>
        <button class="gap-tab" type="button" data-gap-filter="missing">Missing rules <span>${missing.length}</span></button>
        <button class="gap-tab" type="button" data-gap-filter="ambiguity">Ambiguities <span>${ambiguities.length}</span></button>
        <button class="gap-tab" type="button" data-gap-filter="dependency">Dependencies <span>${dependencies.length}</span></button>
      </div>
      ${renderGapGroup("missing", "Missing Business Rules", missing, "Missing")}
      ${renderGapGroup("ambiguity", "Ambiguities", ambiguities, "Ambiguity")}
      ${renderGapGroup("dependency", "Context Dependencies", dependencies, "Related context needed")}
      <div class="gap-group">
        <div class="gap-group-head"><b>Potential Impact</b><span class="count-badge amber">${impacts.length}</span><small>推测，需与现有系统核实</small></div>
        <div class="impact-grid">${impacts.length ? impacts.map(renderImpact).join("") : emptyMarkup()}</div>
        <div class="disclaimer">${escapeHtml(analysis.disclaimer || "Potential impacts should be validated against the existing system.")}</div>
      </div>
    </section>

    <section class="result-section" id="questionsSection">
      ${sectionHead(5, "Questions to Clarify", "下一步可以直接问客户的问题", "questions", "Copy All Questions")}
      ${renderQuestions(questions)}
    </section>
  `;

  element("aiEnhanceButton").classList.toggle("hidden", !isLocal);
  element("resultDisclaimer").textContent = isLocal
    ? "Free local checklist result · No API used · Validate hypotheses against the Jira and existing system."
    : "AI analysis enhanced with local checklist findings · Validate against the Jira and existing system.";
  bindResultControls();
}

function renderLocalReviewSummary(localReview) {
  if (!localReview) return "";
  const reviewedCheckCount = Number(localReview.reviewedCheckCount || 0);
  const totalCheckCount = Number(localReview.totalCheckCount || 144);
  const findingCount = Number(localReview.findingCount || 0);
  const matchedModuleCount = safeArray(localReview.matchedModules).length;
  const isManualScope = localReview.selectionMode === "manual";
  const modules = safeArray(localReview.matchedModules).map((name) => `<span>${escapeHtml(name.replaceAll("_", " "))}</span>`).join("");
  return `<div class="local-review-purpose">这些信息用于说明本次本地清单的覆盖范围，不是需求评分。</div>
    <div class="local-review-overview">
      <div>
        <span>Review scope</span>
        <b>${reviewedCheckCount} of ${totalCheckCount} checks used</b>
        <small>${isManualScope ? `按用户指定的 ${matchedModuleCount} 个模块进行检查` : `从与当前 Jira 相关的 ${matchedModuleCount} 个模块中自动选取`}</small>
      </div>
      <div>
        <span>Output</span>
        <b>${findingCount} prompts to validate</b>
        <small>待确认的问题线索，不是已确认缺陷</small>
      </div>
    </div>
    <details class="local-module-details">
      <summary>View ${matchedModuleCount} matched modules</summary>
      <div class="local-module-list">${modules}</div>
    </details>`;
}

function renderResultChrome(counts) {
  element("termsNavCount").textContent = counts.termCount;
  element("gapsNavCount").textContent = counts.gapCount;
  element("questionsNavCount").textContent = counts.questionCount;
  const meta = state.resultMeta || {};
  const analyzedAt = meta.analyzedAt instanceof Date
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(meta.analyzedAt).replace(",", "")
    : "Just now";
  dom.resultMeta.innerHTML = `
    <span class="meta-chip ${meta.mode === "local" ? "local" : "ai"}">${meta.mode === "local" ? "Free Local · No API" : `AI Deep · ${escapeHtml(meta.provider || "Personal API")}`}</span>
    <span class="meta-chip">${escapeHtml(meta.issueKey || "Requirement")}</span>
    <span class="meta-chip">${escapeHtml(`${meta.industry || "General"} / ${meta.module || "General"}`)}</span>
    <span class="meta-detail">${meta.mode === "local" ? "Checked" : "Analyzed"} ${escapeHtml(analyzedAt)} · source: ${escapeHtml(meta.source || "Jira Summary + Description")}</span>`;
}

function bindResultControls() {
  const translationBody = element("translationBody");
  const translationToggle = element("translationToggle");
  translationToggle?.addEventListener("click", () => {
    const clipped = translationBody.classList.toggle("clipped");
    translationToggle.textContent = clipped ? "Show full text" : "Hide text";
  });

  element("gapTabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-gap-filter]");
    if (!button) return;
    document.querySelectorAll("#gapTabs .gap-tab").forEach((item) => item.classList.toggle("active", item === button));
    const filter = button.dataset.gapFilter;
    document.querySelectorAll("[data-gap-group]").forEach((group) => {
      group.classList.toggle("hidden", filter !== "all" && group.dataset.gapGroup !== filter);
    });
  });

  dom.resultContent.querySelectorAll("button[data-copy-section]").forEach((button) => {
    button.addEventListener("click", () => {
      void copyText(formatAnalysisSection(state.analysis, button.dataset.copySection), "Copied");
      showCopiedState(button);
    });
  });
  dom.resultContent.querySelectorAll("button[data-question-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const question = state.analysis?.questions?.[Number(button.dataset.questionIndex)];
      if (question) {
        void copyText(question.question, "Question copied");
        showCopiedState(button);
      }
    });
  });
}

function sectionHead(index, title, subtitle, copySection, copyLabel = "Copy") {
  return `<div class="section-head">
    <span class="section-index color-${index}">${index}</span>
    <div class="section-title">${title}<small>${subtitle}</small></div>
    <button class="mini-button" type="button" data-copy-section="${copySection}">${copyLabel}</button>
  </div>`;
}

function renderTerms(terms) {
  const values = safeArray(terms);
  if (!values.length) return emptyMarkup("No specialist terms were identified.");
  return values.map((term) => `<div class="term-card">
    <div class="term-name">${escapeHtml(term.term)}<span>${escapeHtml(term.chineseName)}</span><small>in Jira</small></div>
    <p>${escapeHtml(term.explanation)}</p>
  </div>`).join("");
}

function kvRow(key, value) {
  return `<div class="kv-row"><div class="kv-key">${key}</div><div class="kv-value">${value || emptyMarkup()}</div></div>`;
}

function linesOrNotSpecified(values) {
  const items = safeArray(values);
  return items.length ? items.map(escapeHtml).join("<br>") : notSpecifiedMarkup();
}

function renderPreconditions(preconditions) {
  if (!preconditions || preconditions.status === "not_specified") {
    return `${notSpecifiedMarkup()}<span class="missing-detail">需求未说明执行该变更所需的前置条件或限制。</span>`;
  }
  return escapeHtml(preconditions.detail);
}

function renderScope(scopeIn, scopeOut) {
  const inside = safeArray(scopeIn).map((item) => `<span class="tag">${escapeHtml(item)}</span>`);
  const outside = safeArray(scopeOut).map((item) => `<span class="tag out">${escapeHtml(item)}</span>`);
  return inside.length || outside.length ? `<div class="tag-list">${inside.join("")}${outside.join("")}</div>` : notSpecifiedMarkup();
}

function renderGapGroup(key, title, items, label) {
  const values = safeArray(items);
  const descriptions = {
    missing: "应该写但没写",
    ambiguity: "可能有多种理解",
    dependency: "需要其它需求或历史规则才能确认"
  };
  return `<div class="gap-group" data-gap-group="${key}">
    <div class="gap-group-head"><b>${title}</b><span class="count-badge ${key}">${values.length}</span><small>${descriptions[key]}</small></div>
    ${values.length ? values.map((item) => `<div class="gap-item ${key}">
      <div class="gap-label">${label}</div>
      <p>${escapeHtml(item.detail || item.title)}</p>
      ${item.why ? `<small>${escapeHtml(item.why)}</small>` : ""}
      ${item.sourceEvidence && !/not specified/i.test(item.sourceEvidence) ? `<small class="source-quote">Jira 原文：${escapeHtml(item.sourceEvidence)}</small>` : ""}
    </div>`).join("") : emptyMarkup()}
  </div>`;
}

function renderImpact(impact) {
  const level = ["high", "medium", "low"].includes(impact.level) ? impact.level : "low";
  const label = level === "medium" ? "MED" : level.toUpperCase();
  return `<span class="impact ${level}" title="${escapeHtml(impact.reason)}"><b>${label}</b>${escapeHtml(impact.area)}</span>`;
}

function renderQuestions(questions) {
  if (!questions.length) return emptyMarkup("No clarification questions were generated.");
  const groups = ["high", "medium"];
  return groups.map((priority) => {
    const subset = questions.map((question, index) => ({ question, index })).filter(({ question }) => question.priority === priority);
    if (!subset.length) return "";
    const description = priority === "high" ? "阻塞开发，建议优先确认" : "影响细节设计，可在澄清会一并确认";
    return `<div class="priority-head ${priority}"><b>${priority.toUpperCase()} PRIORITY</b><span>${description}</span></div>
      ${subset.map(({ question, index }) => `<div class="question ${priority}">
        <span class="question-number">${index + 1}</span>
        <div class="question-text">${escapeHtml(question.question)}<small>${escapeHtml(question.reason)}</small></div>
        <button class="mini-button" type="button" data-question-index="${index}">Copy</button>
      </div>`).join("")}`;
  }).join("");
}

function notSpecifiedMarkup(value) {
  const text = String(value || "").trim();
  if (!text || /not specified in the jira/i.test(text)) {
    return `<span class="not-specified">Not specified in the Jira</span>`;
  }
  return escapeHtml(text);
}

function showCopiedState(button) {
  const previous = button.textContent;
  button.classList.add("copied");
  button.textContent = "✓ Copied";
  setTimeout(() => {
    button.classList.remove("copied");
    button.textContent = previous;
  }, 1400);
}

function emptyMarkup(message = "None identified from the current Jira.") {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function formatAnalysis(analysis) {
  if (!analysis) return "";
  return [
    "JIRA REQUIREMENT COPILOT ANALYSIS",
    state.jira?.issueKey ? `Issue: ${state.jira.issueKey}` : "",
    "",
    formatAnalysisSection(analysis, "understand"),
    "",
    formatAnalysisSection(analysis, "terms"),
    "",
    formatAnalysisSection(analysis, "breakdown"),
    "",
    formatAnalysisSection(analysis, "gaps"),
    "",
    formatAnalysisSection(analysis, "questions"),
    "",
    analysis.disclaimer || ""
  ].filter((value, index, array) => value !== "" || array[index - 1] !== "").join("\n");
}

function formatAnalysisSection(analysis, section) {
  if (!analysis) return "";
  if (section === "understand") {
    if (state.analysisMode === "local") {
      const review = analysis.localReview || {};
      return `1. FREE LOCAL REVIEW\nChecks used: ${review.reviewedCheckCount || 0} of ${review.totalCheckCount || 144}\nMatched modules: ${safeArray(review.matchedModules).join(", ") || "None"}\nPrompts to validate: ${review.findingCount || 0}\n\nThese prompts are review hypotheses, not confirmed defects or client rules.`;
    }
    return `1. UNDERSTAND\n\nBusiness Explanation\n${analysis.understand?.businessExplanation || ""}\n\nChinese Translation\n${analysis.understand?.chineseTranslation || ""}`;
  }
  if (section === "terms") {
    const terms = safeArray(analysis.domainTerms).map((term) => `- ${term.term} / ${term.chineseName}: ${term.explanation}`).join("\n");
    return `2. DOMAIN TERMS\n${terms || "None identified"}`;
  }
  if (section === "breakdown") {
    const b = analysis.breakdown || {};
    const rules = safeArray(b.businessRules).map((item, index) => `${index + 1}. ${item.rule} [Source: ${item.sourceEvidence}]`).join("\n");
    return `3. REQUIREMENT BREAKDOWN\nBusiness Goal: ${b.businessGoal || ""}\nActor: ${safeArray(b.actors).join(", ") || "Not specified in the Jira"}\nCurrent Behaviour: ${b.currentBehaviour || "Not specified in the Jira"}\nExpected Behaviour: ${b.expectedBehaviour || "Not specified in the Jira"}\nPreconditions: ${b.preconditions?.detail || "Not specified in the Jira"}\nBusiness Rules:\n${rules || "None identified"}\nScope In: ${safeArray(b.scopeIn).join(", ") || "Not specified in the Jira"}\nScope Out: ${safeArray(b.scopeOut).join(", ") || "Not specified in the Jira"}`;
  }
  if (section === "gaps") {
    const g = analysis.gaps || {};
    const block = (title, items) => `${title}\n${safeArray(items).map((item) => `- ${item.detail}\n  Why: ${item.why}\n  Source: ${item.sourceEvidence}`).join("\n") || "- None identified"}`;
    const impacts = safeArray(g.potentialImpacts).map((item) => `- [${item.level.toUpperCase()}] ${item.area}: ${item.reason}`).join("\n") || "- None identified";
    return `4. GAPS & POTENTIAL IMPACT\n${block("Missing Business Rules", g.missingBusinessRules)}\n\n${block("Ambiguities", g.ambiguities)}\n\n${block("Context Dependencies", g.contextDependencies)}\n\nPotential Impact\n${impacts}`;
  }
  if (section === "questions") {
    const questions = safeArray(analysis.questions).map((item, index) => `${index + 1}. [${item.priority.toUpperCase()}] ${item.question}\n   Reason: ${item.reason}`).join("\n");
    return `5. QUESTIONS TO CLARIFY\n${questions || "None generated"}`;
  }
  return "";
}

async function copyText(text, message) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  showToast(message);
}

function showAlert(message) {
  dom.alertText.textContent = message;
  dom.alert.classList.remove("hidden");
}

function hideAlert() {
  dom.alert.classList.add("hidden");
}

function showToast(message) {
  dom.toastText.textContent = message;
  dom.toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 1800);
}

function setContextStatus(kind, text) {
  dom.contextStatus.className = `context-status ${kind}`.trim();
  dom.contextStatusText.textContent = text;
}

function updateManualCounts() {
  element("summaryCount").textContent = `${dom.manualSummary.value.length} / 2000`;
  element("descriptionCount").textContent = `${dom.manualDescription.value.length} characters`;
}

function updateNavFromScroll() {
  if (state.view !== "result") return;
  const bodyTop = dom.panelBody.getBoundingClientRect().top;
  let current = "understandSection";
  for (const id of ["understandSection", "termsSection", "breakdownSection", "gapsSection", "questionsSection"]) {
    const section = element(id);
    if (section && section.getBoundingClientRect().top - bodyTop <= 80) current = id;
  }
  setActiveNav(current);
}

function setActiveNav(target) {
  dom.resultNav.querySelectorAll("button[data-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.target === target);
  });
}

function sendRuntimeMessage(message) {
  return extensionApi.runtime.sendMessage(message).then((response) => {
    if (!response?.ok) throw new Error(response?.error || "The extension request failed.");
    return response.data;
  });
}

function previewAnalysis() {
  return new Promise((resolve) => setTimeout(() => resolve({ analysis: SAMPLE_ANALYSIS }), 1900));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
