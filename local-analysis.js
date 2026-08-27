(function initializeLocalAnalysis(globalObject) {
  "use strict";

  const MODULE_ALIASES = {
    General: "CORE",
    "Product Factory": "PRODUCT_FACTORY",
    Party: "PARTY",
    Agreement: "AGREEMENT",
    Quotation: "QUOTATION",
    Underwriting: "UNDERWRITING",
    Policy: "POLICY",
    Endorsement: "ENDORSEMENT",
    Renewal: "RENEWAL",
    "Cancellation / Reinstatement": "CANCELLATION_REINSTATEMENT",
    "Billing / Payment / Commission": "BILLING_PAYMENT_COMMISSION",
    Documents: "DOCUMENTS",
    Claims: "CLAIMS_IMPACT",
    "Integration / Data": "INTEGRATION_DATA",
    "Security / Audit / Compliance": "SECURITY_AUDIT_COMPLIANCE",
    Finance: "BILLING_PAYMENT_COMMISSION"
  };

  const EVIDENCE_PATTERNS = {
    "CORE-001": ["so that", "in order to", "objective", "goal", "目的", "目标", "为了", "以便"],
    "CORE-002": ["broker", "customer", "user", "underwriter", "insurer", "agent", "经纪", "客户", "用户", "核保", "保险人"],
    "CORE-003": ["current", "currently", "today", "existing", "should", "must", "当前", "现有", "目前", "应当", "必须"],
    "CORE-004": ["before", "after", "when", "if", "provided", "only when", "之前", "之后", "当", "如果", "仅当", "前提"],
    "CORE-005": ["new business", "submission", "renewal", "policy change", "endorsement", "cancellation", "reinstatement", "新保", "投保", "续保", "批改", "批单", "取消", "复效"],
    "CORE-006": ["product", "line of business", "lob", "channel", "jurisdiction", "territory", "产品", "险种", "渠道", "司法辖区", "地区"],
    "CORE-007": ["draft", "quoted", "accepted", "bound", "issued", "withdrawn", "declined", "status", "草稿", "已报价", "已接受", "承保", "签发", "撤回", "拒绝", "状态"],
    "CORE-008": ["error", "fail", "invalid", "timeout", "retry", "duplicate", "manual", "异常", "失败", "无效", "超时", "重试", "重复", "人工"],
    "CORE-009": ["acceptance criteria", "given", "when", "then", "验收标准", "假设", "当", "那么"],
    "CORE-010": ["performance", "volume", "availability", "accessibility", "retention", "性能", "容量", "可用性", "可访问", "留存"],

    "PROD-001": ["product", "line of business", "lob", "mono-line", "multi-line", "产品", "险种", "组合险"],
    "PROD-002": ["version", "effective date", "expiry", "grandfather", "版本", "生效日期", "失效日期", "存量"],
    "PROD-003": ["available", "availability", "eligible", "jurisdiction", "channel", "可用", "资格", "地区", "渠道"],
    "PROD-004": ["required coverage", "optional coverage", "default coverage", "mandatory", "optional", "必选", "可选", "默认保障", "互斥"],
    "PROD-005": ["limit", "deductible", "excess", "currency", "限额", "免赔", "币种"],
    "PROD-006": ["risk object", "coverable", "attribute", "required field", "风险对象", "标的", "属性", "必填字段"],
    "PROD-007": ["eligibility", "underwriting rule", "question set", "资格规则", "核保规则", "问题集"],
    "PROD-008": ["rate", "rating", "discount", "surcharge", "tax", "费率", "计费", "折扣", "附加费", "税"],
    "PROD-009": ["form", "wording", "clause", "document", "条款", "表单", "文件"],
    "PROD-010": ["in-flight", "existing policy", "migration", "renewal", "在途", "存量保单", "迁移", "续保"],

    "PARTY-001": ["person", "organisation", "organization", "individual", "个人", "组织", "机构"],
    "PARTY-002": ["role", "account contact", "policy contact", "角色", "账户联系人", "保单联系人"],
    "PARTY-003": ["named insured", "applicant", "payer", "beneficiary", "producer", "投保人", "被保险人", "付款人", "受益人", "经纪人"],
    "PARTY-004": ["unique id", "duplicate", "merge", "match", "唯一标识", "重复", "合并", "匹配"],
    "PARTY-005": ["relationship", "related", "parent", "subsidiary", "关系", "关联", "母公司", "子公司"],
    "PARTY-006": ["address", "email", "phone", "contact detail", "地址", "邮箱", "电话", "联系方式"],
    "PARTY-007": ["role effective", "appointment date", "role end", "角色生效", "任命日期", "角色终止"],
    "PARTY-008": ["consent", "privacy", "mask", "retention", "授权", "隐私", "脱敏", "留存"],
    "PARTY-009": ["external id", "customer id", "producer code", "外部标识", "客户号", "经纪人代码"],
    "PARTY-010": ["access", "permission", "producer code", "visible", "访问", "权限", "可见"],

    "AGR-001": ["agreement type", "agency agreement", "broker agreement", "binding authority", "service agreement", "协议类型", "代理协议", "经纪协议", "授权承保", "服务协议"],
    "AGR-002": ["agreement party", "signatory", "agreement owner", "协议主体", "签约方", "协议负责人"],
    "AGR-003": ["authority", "bind", "issue", "endorse", "cancel", "授权", "承保", "签发", "批改", "取消"],
    "AGR-004": ["territory", "channel", "product scope", "currency", "地区", "渠道", "产品范围", "币种"],
    "AGR-005": ["effective", "expiry", "renew agreement", "terminate", "生效", "到期", "续签", "终止"],
    "AGR-006": ["commission", "fee", "tax", "佣金", "费用", "税费"],
    "AGR-007": ["authority limit", "referral", "threshold", "授权限额", "转人工", "阈值"],
    "AGR-008": ["suspend", "terminate", "expire", "暂停", "终止", "失效"],
    "AGR-009": ["approve", "approval", "evidence", "attachment", "审批", "证据", "附件"],
    "AGR-010": ["precedence", "priority", "conflict", "优先级", "冲突"],

    "QUOTE-001": ["new business", "renewal", "policy change", "endorsement", "新保", "续保", "批改", "批单"],
    "QUOTE-002": ["required", "mandatory", "risk information", "loss history", "prior policy", "必填", "风险信息", "损失记录", "历史保单"],
    "QUOTE-003": ["draft", "quoted", "accepted", "declined", "withdrawn", "expired", "草稿", "已报价", "已接受", "拒绝", "撤回", "失效"],
    "QUOTE-004": ["quote version", "side-by-side", "compare quote", "报价版本", "报价比较"],
    "QUOTE-005": ["recalculate", "re-rate", "reprice", "rating-related", "重新计算", "重新计价", "费率相关"],
    "QUOTE-006": ["base premium", "discount", "surcharge", "fee", "tax", "rounding", "基础保费", "折扣", "附加费", "费用", "税", "舍入"],
    "QUOTE-007": ["valid until", "validity", "expire", "rate lock", "有效期", "到期", "费率锁定"],
    "QUOTE-008": ["re-accept", "accept again", "new acceptance", "重新接受", "再次接受"],
    "QUOTE-009": ["block quote", "block bind", "block issue", "referral", "阻止报价", "阻止承保", "阻止签发", "转人工"],
    "QUOTE-010": ["override", "adjust premium", "manual rate", "覆盖", "调整保费", "人工费率"],
    "QUOTE-011": ["lock", "concurrent", "conflict", "锁定", "并发", "冲突"],
    "QUOTE-012": ["rating fail", "timeout", "retry", "manual", "计费失败", "超时", "重试", "人工"],

    "UW-001": ["trigger", "underwriting rule", "referral", "warning", "触发", "核保规则", "转人工", "警告"],
    "UW-002": ["rule version", "effective date", "规则版本", "生效日期"],
    "UW-003": ["informational", "blocking", "quote", "bind", "issue", "提示性", "阻断", "报价", "承保", "签发"],
    "UW-004": ["authority level", "approval limit", "权限级别", "审批限额"],
    "UW-005": ["assign", "queue", "sla", "escalate", "reassign", "分配", "队列", "时效", "升级", "转派"],
    "UW-006": ["document", "evidence", "external check", "attachment", "文件", "证据", "外部查询", "附件"],
    "UW-007": ["approve", "decline", "condition", "load", "exclude", "同意", "拒绝", "条件", "加费", "除外"],
    "UW-008": ["re-evaluate", "re-run", "invalidate approval", "重新核保", "重新执行", "审批失效"],
    "UW-009": ["override", "exception", "second approval", "特批", "例外", "二次审批"],
    "UW-010": ["audit", "history", "carry forward", "renewal", "审计", "历史", "带入", "续保"],

    "POL-001": ["policy number", "policy period", "transaction id", "保单号", "保单期间", "交易号"],
    "POL-002": ["bound", "issued", "in force", "expired", "cancelled", "承保", "签发", "生效", "到期", "取消"],
    "POL-003": ["before bind", "before issue", "precondition", "签发前", "承保前", "前置条件"],
    "POL-004": ["effective date", "transaction date", "issue date", "timezone", "生效日期", "交易日期", "签发日期", "时区"],
    "POL-005": ["snapshot", "immutable", "as at", "快照", "不可变", "截至"],
    "POL-006": ["consistent", "consistency", "一致"],
    "POL-007": ["service", "correct", "download", "view", "服务", "更正", "下载", "查看"],
    "POL-008": ["renewal", "endorsement", "cancellation", "claim", "续保", "批改", "取消", "理赔"],
    "POL-009": ["history", "as of date", "reconstruct", "历史", "截止日期", "重现"],
    "POL-010": ["event", "notify", "downstream", "sync", "事件", "通知", "下游", "同步"],

    "END-001": ["policy status", "eligible", "permission", "保单状态", "资格", "权限"],
    "END-002": ["field", "risk information", "coverage", "party", "date", "字段", "风险信息", "保障", "参与方", "日期"],
    "END-003": ["change reason", "endorsement type", "attachment", "变更原因", "批改类型", "附件"],
    "END-004": ["effective date", "backdate", "future date", "retroactive", "生效日期", "追溯", "未来日期"],
    "END-005": ["recalculate", "prorata", "short rate", "minimum premium", "重新计算", "按日比例", "短期费率", "最低保费"],
    "END-006": ["additional premium", "refund", "instalment", "payment", "追加保费", "退款", "分期", "付款"],
    "END-007": ["re-accept", "consent", "signature", "重新接受", "同意", "签署"],
    "END-008": ["re-run underwriting", "re-evaluate", "approval invalid", "重新核保", "重新评估", "审批失效"],
    "END-009": ["out of sequence", "oos", "conflict", "乱序", "顺序冲突"],
    "END-010": ["renewal", "apply changes to renewal", "续保", "同步到续保"],
    "END-011": ["endorsement document", "notice", "obsolete", "批单文件", "通知", "作废"],
    "END-012": ["withdraw", "rollback", "reverse", "撤回", "回滚", "冲销"],

    "REN-001": ["renewal", "renew", "续保"],
    "REN-002": ["initiate renewal", "renewal lead", "automatic renewal", "发起续保", "续保提前", "自动续保"],
    "REN-003": ["carry forward", "copy", "re-confirm", "带入", "复制", "重新确认"],
    "REN-004": ["new rate", "new product version", "new wording", "新费率", "新产品版本", "新条款"],
    "REN-005": ["loss history", "refresh risk", "payment history", "损失记录", "更新风险", "付款记录"],
    "REN-006": ["renewal quote", "requote", "renewal acceptance", "续保报价", "重新报价", "续保接受"],
    "REN-007": ["pre-renewal", "renewal referral", "renewal underwriting", "预续保", "续保转人工", "续保核保"],
    "REN-008": ["non-renew", "not taken", "withdraw renewal", "非续保", "不接受续保", "撤回续保"],
    "REN-009": ["non-renew reason", "notice period", "非续保原因", "通知期限"],
    "REN-010": ["policy change", "apply change", "endorsement", "批改", "同步变更"],
    "REN-011": ["renewal payment", "renewal document", "bind renewal", "续保付款", "续保文件", "续保承保"],
    "REN-012": ["grace period", "continuity", "lapse", "宽限期", "保障连续", "失效"],

    "CAN-001": ["cancel reason", "reinstate", "eligible", "取消原因", "复效", "资格"],
    "CAN-002": ["notice period", "cooling off", "backdate", "通知期限", "犹豫期", "追溯"],
    "CAN-003": ["approval", "evidence", "override", "审批", "证明", "特批"],
    "CAN-004": ["refund", "short rate", "commission clawback", "退款", "短期费率", "佣金冲回"],
    "CAN-005": ["no loss", "payment", "underwriting", "无损失", "付款", "核保"],
    "CAN-006": ["coverage gap", "lapse", "保障中断", "失效"],
    "CAN-007": ["renewal", "endorsement", "claim", "续保", "批改", "理赔"],
    "CAN-008": ["cancellation notice", "reinstatement document", "取消通知", "复效文件"],

    "FIN-001": ["receivable", "invoice", "charge", "应收", "账单", "收费"],
    "FIN-002": ["additional premium", "refund", "credit", "debit", "追加保费", "退款", "贷项", "借项"],
    "FIN-003": ["payment collected", "paid", "partial payment", "已收款", "已付款", "部分付款"],
    "FIN-004": ["instalment", "installment", "due date", "deposit", "分期", "到期日", "首付款"],
    "FIN-005": ["tax", "fee", "currency", "rounding", "税", "费用", "币种", "舍入"],
    "FIN-006": ["refund method", "refund approval", "退款方式", "退款审批"],
    "FIN-007": ["commission plan", "producer code", "clawback", "佣金计划", "经纪人代码", "佣金冲回"],
    "FIN-008": ["posting date", "accounting period", "closed period", "过账日期", "会计期间", "关账"],
    "FIN-009": ["reconcile", "ledger", "对账", "总账"],
    "FIN-010": ["idempotent", "duplicate", "retry", "幂等", "重复", "重试"],

    "DOC-001": ["generate", "quote document", "policy document", "notice", "生成", "报价单", "保单文件", "通知"],
    "DOC-002": ["template", "language", "jurisdiction", "模板", "语言", "司法辖区"],
    "DOC-003": ["template version", "edition", "模板版本", "版本日期"],
    "DOC-004": ["regenerate", "obsolete", "replace document", "重新生成", "作废", "替换文件"],
    "DOC-005": ["email", "post", "portal", "delivery", "邮件", "邮寄", "门户", "发送"],
    "DOC-006": ["signature", "acknowledge", "consent", "签署", "确认", "同意"],
    "DOC-007": ["data source", "reproduce", "数据来源", "重现"],
    "DOC-008": ["archive", "retention", "tamper", "归档", "留存", "防篡改"],

    "CLM-001": ["loss date", "report date", "policy snapshot", "出险日期", "报案日期", "保单快照"],
    "CLM-002": ["existing claim", "open claim", "in-flight claim", "在途理赔", "未结赔案"],
    "CLM-003": ["retroactive", "existing loss", "追溯", "已发生事故"],
    "CLM-004": ["loss history", "renewal", "underwriting", "损失记录", "续保", "核保"],
    "CLM-005": ["notify claim", "claim event", "通知理赔", "理赔事件"],
    "CLM-006": ["audit", "snapshot", "history", "审计", "快照", "历史"],

    "INT-001": ["source of truth", "system of record", "master", "权威系统", "主数据", "数据归属"],
    "INT-002": ["api", "event", "message", "synchronous", "asynchronous", "接口", "事件", "消息", "同步", "异步"],
    "INT-003": ["mapping", "external id", "correlation", "映射", "外部标识", "关联标识"],
    "INT-004": ["idempotent", "duplicate", "retry", "幂等", "重复", "重试"],
    "INT-005": ["ordering", "concurrent", "stale", "sequence", "顺序", "并发", "旧版本"],
    "INT-006": ["retry", "compensate", "dead letter", "manual repair", "重试", "补偿", "死信", "人工修复"],
    "INT-007": ["code mapping", "reference data", "typelist", "代码映射", "参考数据", "码表"],
    "INT-008": ["monitor", "alert", "reconcile", "data quality", "监控", "告警", "对账", "数据质量"],

    "SEC-001": ["role", "permission", "access", "角色", "权限", "访问"],
    "SEC-002": ["segregation", "dual control", "four eyes", "职责分离", "双人复核"],
    "SEC-003": ["mask", "pii", "personal data", "health data", "脱敏", "个人信息", "健康信息"],
    "SEC-004": ["audit", "before value", "after value", "reason", "审计", "修改前", "修改后", "原因"],
    "SEC-005": ["override", "approval", "evidence", "特批", "审批", "证据"],
    "SEC-006": ["retention", "archive", "delete", "legal hold", "留存", "归档", "删除", "冻结"],
    "SEC-007": ["external user", "producer access", "revoke", "外部用户", "经纪人访问", "撤权"],
    "SEC-008": ["jurisdiction", "disclosure", "consent", "fair treatment", "司法辖区", "告知", "同意", "公平对待"]
  };

  const TERM_DICTIONARY = [
    ["New Business", "新保", ["new business", "submission", "新保", "投保"]],
    ["Renewal", "续保", ["renewal", "renew", "续保"]],
    ["Endorsement / Policy Change", "批改 / 保单变更", ["endorsement", "policy change", "mid-term adjustment", "mta", "批改", "批单"]],
    ["Quote Acceptance", "报价接受", ["quote acceptance", "accepted quote", "re-accept", "报价接受", "接受报价"]],
    ["Policy Inception", "保单生效", ["policy inception", "inception date", "effective date", "保单生效", "生效日期"]],
    ["Underwriting Referral", "核保转人工", ["underwriting referral", "referral", "转人工", "核保转介"]],
    ["Binding", "承保确认", ["binding", "bind", "承保"]],
    ["Issuance", "保单签发", ["issuance", "issue policy", "签发"]],
    ["Premium Recalculation", "保费重算", ["recalculate premium", "re-rate", "reprice", "保费重算", "重新计价"]],
    ["Out-of-sequence", "交易顺序冲突", ["out of sequence", "oos", "顺序冲突", "乱序批改"]]
  ];

  function analyzeRequirement(input, checklist) {
    const requirement = normalizeRequirement(input);
    validateChecklist(checklist);
    const text = normalizeText(`${requirement.summary}\n${requirement.description}`);
    const selectedModules = resolveSelectedModules(requirement.modules);
    const matchedModules = selectModules(checklist, text, selectedModules);
    const candidates = checklist.modules.filter((module) => matchedModules.includes(module.id)).flatMap((module) => module.checks.map((check) => ({ module, check })));
    const totalCheckCount = checklist.modules.reduce((count, module) => count + module.checks.length, 0);
    const findings = candidates
      .filter(({ check }) => EVIDENCE_PATTERNS[check.id])
      .filter(({ check }) => !hasAnyEvidence(text, EVIDENCE_PATTERNS[check.id]))
      .map(({ module, check }) => makeFinding(module, check, selectedModules))
      .sort(compareFindings)
      .slice(0, 12);

    const terms = detectTerms(text);
    const actors = detectActors(text);
    const scope = detectScope(text);
    const grouped = groupFindings(findings);
    const questions = findings.map((finding) => ({
      priority: finding.priority === "low" ? "medium" : finding.priority,
      question: finding.clientQuestionEn,
      reason: `本地保险检查 ${finding.checkId}：${finding.checkZh}`,
      checkId: finding.checkId,
      source: "local_checklist"
    }));

    return {
      analysis: {
        understand: {
          businessExplanation: `免费本地保险检查已完成。系统根据 ${matchedModules.length} 个相关模块检查了 ${candidates.length} 个预录维度，识别出 ${findings.length} 个需要确认的缺口信号。此模式不调用外部模型，也不会上传 Jira 内容。`,
          chineseTranslation: `本地免费模式不调用翻译模型，因此不生成机器翻译。请以 Jira 原文为准：\n\n${requirement.summary}\n\n${requirement.description}`
        },
        domainTerms: terms,
        breakdown: {
          businessGoal: requirement.summary,
          actors,
          currentBehaviour: "Not specified in the Jira",
          expectedBehaviour: "Not specified in the Jira",
          preconditions: { status: "not_specified", detail: "Not specified in the Jira" },
          businessRules: [],
          scopeIn: scope.scopeIn,
          scopeOut: scope.scopeOut
        },
        gaps: {
          missingBusinessRules: grouped.missing,
          ambiguities: grouped.ambiguity,
          contextDependencies: grouped.dependency,
          potentialImpacts: buildImpacts(findings)
        },
        questions,
        disclaimer: "Free local checklist findings are hypotheses generated in the browser. Validate them against the Jira, applicable regulation, and the existing system.",
        localReview: {
          mode: "local",
          cost: "zero_api",
          checklistVersion: checklist.version,
          selectionMode: selectedModules.length ? "manual" : "auto",
          selectedModules,
          matchedModules,
          reviewedCheckCount: candidates.length,
          totalCheckCount,
          findingCount: findings.length,
          findings
        }
      },
      meta: { mode: "local", checklistVersion: checklist.version, reviewedCheckCount: candidates.length }
    };
  }

  function selectChecklistContext(input, checklist, limit = 30) {
    const requirement = normalizeRequirement(input);
    validateChecklist(checklist);
    const text = normalizeText(`${requirement.summary}\n${requirement.description}`);
    const selectedModules = resolveSelectedModules(requirement.modules);
    const matchedModules = selectModules(checklist, text, selectedModules);
    const checks = checklist.modules
      .filter((module) => matchedModules.includes(module.id))
      .flatMap((module) => module.checks.map((check) => ({
        id: check.id,
        module: module.id,
        priority: check.priority,
        checkZh: check.checkZh,
        clientQuestionEn: check.clientQuestionEn,
        sourceRefs: check.sourceRefs
      })))
      .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority));
    return { checklistVersion: checklist.version, assertionMode: "hypothesis_only", matchedModules, checks: checks.slice(0, Math.max(1, Math.min(limit, 30))) };
  }

  function selectModules(checklist, text, selectedModules = []) {
    const available = new Set(checklist.modules.map((module) => module.id));
    const manualModules = (Array.isArray(selectedModules) ? selectedModules : [selectedModules])
      .filter((id) => id && id !== "CORE" && available.has(id));
    if (manualModules.length) return ["CORE", ...new Set(manualModules)].slice(0, 6);

    const scores = new Map([["CORE", 1_000]]);
    for (const module of checklist.modules) {
      const hits = module.keywords.reduce((count, keyword) => count + (text.includes(normalizeText(keyword)) ? 1 : 0), 0);
      if (hits) scores.set(module.id, Math.max(scores.get(module.id) || 0, hits * 10));
    }
    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id)
      .filter((id) => checklist.modules.some((module) => module.id === id));
  }

  function makeFinding(module, check, selectedModules) {
    const type = chooseOutputType(check.outputTypes);
    return {
      checkId: check.id,
      moduleId: module.id,
      moduleName: module.nameEn,
      dimension: check.dimension,
      checkZh: check.checkZh,
      clientQuestionEn: check.clientQuestionEn,
      priority: check.priority,
      type,
      selectedModuleMatch: selectedModules.includes(module.id),
      sourceRefs: check.sourceRefs
    };
  }

  function groupFindings(findings) {
    const result = { missing: [], ambiguity: [], dependency: [] };
    for (const finding of findings) {
      const item = {
        title: `${finding.moduleName} · ${finding.dimension}`,
        detail: finding.checkZh,
        why: `本地清单未在 Jira 中识别到相应说明，建议作为待确认项，而不是既定规则。`,
        sourceEvidence: `Not specified in the Jira · ${finding.checkId}`,
        checkId: finding.checkId,
        source: "local_checklist"
      };
      if (finding.type === "ambiguity") result.ambiguity.push(item);
      else if (finding.type === "dependency" || finding.type === "potential_impact") result.dependency.push(item);
      else result.missing.push(item);
    }
    return result;
  }

  function buildImpacts(findings) {
    const seen = new Set();
    return findings.filter((finding) => {
      if (seen.has(finding.moduleName)) return false;
      seen.add(finding.moduleName);
      return true;
    }).slice(0, 8).map((finding) => ({
      area: finding.moduleName,
      level: finding.priority === "low" ? "low" : finding.priority,
      reason: `本地检查 ${finding.checkId} 发现该模块存在需要客户确认的范围或规则。`,
      checkId: finding.checkId,
      source: "local_checklist"
    }));
  }

  function detectTerms(text) {
    return TERM_DICTIONARY.filter(([, , patterns]) => hasAnyEvidence(text, patterns)).slice(0, 8).map(([term, chineseName]) => ({
      term,
      chineseName,
      explanation: "该术语由本地保险词表识别；具体业务含义和规则应以当前项目为准。"
    }));
  }

  function detectActors(text) {
    const dictionary = [
      ["Broker / 经纪人", ["broker", "经纪人"]],
      ["Underwriter / 核保人员", ["underwriter", "核保人员", "核保人"]],
      ["Customer / 客户", ["customer", "client", "客户"]],
      ["Policyholder / 投保人", ["policyholder", "applicant", "投保人"]],
      ["Insured / 被保险人", ["insured", "被保险人"]],
      ["Agent / 代理人", ["agent", "代理人"]],
      ["Insurer / 保险人", ["insurer", "保险人", "保险公司"]]
    ];
    return dictionary.filter(([, patterns]) => hasAnyEvidence(text, patterns)).map(([label]) => label);
  }

  function detectScope(text) {
    const terms = [
      ["New Business", ["new business", "submission", "新保", "投保"]],
      ["Renewal", ["renewal", "renew", "续保"]],
      ["Endorsement / Policy Change", ["endorsement", "policy change", "mta", "批改", "批单"]],
      ["Cancellation", ["cancellation", "cancel policy", "取消", "退保"]],
      ["Reinstatement", ["reinstatement", "reinstate", "复效"]]
    ];
    const scopeIn = [];
    const scopeOut = [];
    for (const [label, patterns] of terms) {
      const matched = patterns.find((pattern) => text.includes(normalizeText(pattern)));
      if (!matched) continue;
      const index = text.indexOf(normalizeText(matched));
      const sentenceStart = Math.max(text.lastIndexOf(".", index - 1), text.lastIndexOf(";", index - 1), text.lastIndexOf("。", index - 1));
      const followingBoundaries = [text.indexOf(".", index), text.indexOf(";", index), text.indexOf("。", index)].filter((value) => value >= 0);
      const sentenceEnd = followingBoundaries.length ? Math.min(...followingBoundaries) : Math.min(text.length, index + matched.length + 60);
      const sentence = text.slice(sentenceStart + 1, sentenceEnd + 1);
      if (/out of scope|not in scope|does not apply|exclude|outside scope|不适用|不在范围|排除/.test(sentence)) scopeOut.push(label);
      else scopeIn.push(label);
    }
    return { scopeIn, scopeOut };
  }

  function compareFindings(a, b) {
    return criticalScore(b.checkId) - criticalScore(a.checkId)
      || priorityScore(b.priority) - priorityScore(a.priority)
      || Number(b.selectedModuleMatch) - Number(a.selectedModuleMatch)
      || a.checkId.localeCompare(b.checkId);
  }

  function criticalScore(checkId) {
    return ["CORE-005", "QUOTE-001", "REN-001"].includes(checkId) ? 10 : 0;
  }

  function chooseOutputType(types) {
    for (const type of ["ambiguity", "missing_rule", "dependency", "potential_impact"]) if (types.includes(type)) return type;
    return "missing_rule";
  }

  function priorityScore(priority) {
    return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  }

  function hasAnyEvidence(text, patterns) {
    return patterns.some((pattern) => text.includes(normalizeText(pattern)));
  }

  function normalizeRequirement(input) {
    if (!input || typeof input !== "object") throw new Error("Requirement content is missing.");
    const suppliedModules = Array.isArray(input.modules)
      ? input.modules
      : input.module && !/^(auto-detect|auto-detected scope|general)$/i.test(String(input.module).trim()) ? [input.module] : [];
    const requirement = {
      issueKey: String(input.issueKey || "").trim().slice(0, 80),
      summary: String(input.summary || "").trim(),
      description: String(input.description || "").trim(),
      industry: String(input.industry || "Insurance").trim(),
      module: String(input.module || "Auto-detect").trim(),
      modules: suppliedModules.map((value) => String(value || "").trim()).filter(Boolean).slice(0, 5)
    };
    if (!requirement.summary || !requirement.description) throw new Error("Summary and Description are required.");
    return requirement;
  }

  function resolveSelectedModules(modules) {
    return [...new Set((Array.isArray(modules) ? modules : [])
      .map((name) => MODULE_ALIASES[name] || name)
      .filter((id) => id && id !== "CORE"))].slice(0, 5);
  }

  function validateChecklist(checklist) {
    if (!checklist?.modules?.length || checklist.usagePolicy?.assertionMode !== "hypothesis_only") {
      throw new Error("The local insurance checklist is unavailable or invalid.");
    }
  }

  function normalizeText(value) {
    return String(value || "").toLocaleLowerCase().replace(/[\u2010-\u2015]/g, "-").replace(/\s+/g, " ").trim();
  }

  globalObject.JiraCopilotLocal = {
    MODULE_ALIASES,
    analyzeRequirement,
    selectChecklistContext,
    selectModules
  };
})(globalThis);
