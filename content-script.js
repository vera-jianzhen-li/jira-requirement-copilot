(() => {
  const clean = (value) => String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const textFrom = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return "";
    return clean(
      element.value ||
      element.getAttribute?.("content") ||
      element.innerText ||
      element.textContent
    );
  };

  const firstText = (selectors) => {
    for (const selector of selectors) {
      const value = textFrom(selector);
      if (value) return value;
    }
    return "";
  };

  const pageHeading = firstText([
    "[data-testid='issue.views.issue-base.foundation.summary.heading']",
    "[data-testid*='summary'] h1",
    "h1[data-testid*='summary']",
    "main h1",
    "h1"
  ]);

  const headingIssueMatch = pageHeading.match(/\b([A-Z][A-Z0-9_]+-\d+)\b/i);
  const pathAndTitle = `${location.pathname} ${document.title}`;
  const issueMatch = headingIssueMatch || pathAndTitle.match(/(?:browse\/|issues\/|^|\s)([A-Z][A-Z0-9_]+-\d+)\b/i);
  const issueKey = issueMatch ? issueMatch[1].toUpperCase() : firstText([
    "[data-testid='issue.views.issue-base.foundation.breadcrumbs.current-issue.item']",
    "#key-val",
    "[data-issue-key]"
  ]).match(/[A-Z][A-Z0-9_]+-\d+/i)?.[0]?.toUpperCase() || "";

  const rawSummary = firstText([
    "[data-testid='issue.views.issue-base.foundation.summary.heading']",
    "[data-testid*='summary'] h1",
    "h1[data-testid*='summary']",
    "#summary-val",
    "meta[name='ajs-issue-summary']",
    "main h1",
    "h1"
  ]);
  const summary = clean(issueKey
    ? rawSummary.replace(new RegExp(`^${escapeRegExp(issueKey)}\\s*[|:\\-–—]\\s*`, "i"), "")
    : rawSummary);

  const description = firstText([
    "[data-testid='issue.views.field.rich-text.description'] .ak-renderer-document",
    "[data-testid='issue.views.field.rich-text.description']",
    "[data-testid*='description'] .ak-renderer-document",
    "[data-testid*='description']",
    "#description-val",
    "[data-field-id='description']",
    "[aria-label='Description'] .ak-renderer-document",
    "[aria-label='Description']"
  ]) || textNearHeading("Description");

  const isLikelyJira = /atlassian\.net$/i.test(location.hostname) ||
    Boolean(document.querySelector("meta[name='application-name'][content*='Jira' i], #jira, [data-testid^='issue.']")) ||
    Boolean(issueKey);

  let reason = "";
  if (!isLikelyJira) reason = "The active page does not look like a Jira issue.";
  else if (!summary && !description) reason = "Jira was detected, but Summary and Description could not be read.";
  else if (!summary) reason = "Jira was detected, but Summary could not be read.";
  else if (!description) reason = "Jira was detected, but Description could not be read.";

  return {
    detected: Boolean(isLikelyJira && summary && description),
    partial: Boolean(isLikelyJira && (summary || description)),
    issueKey,
    summary,
    description,
    reason,
    url: location.href,
    title: document.title
  };

  function textNearHeading(label) {
    const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role='heading']")];
    const heading = headings.find((element) => clean(element.innerText || element.textContent).toLowerCase() === label.toLowerCase());
    if (!heading) return "";

    const candidates = [];
    let current = heading;
    for (let depth = 0; current && depth < 5; depth += 1, current = current.parentElement) {
      if (current.nextElementSibling) candidates.push(current.nextElementSibling);
      const containerText = clean(current.innerText || current.textContent);
      const withoutHeading = clean(containerText.replace(new RegExp(`^${escapeRegExp(label)}\\s*`, "i"), ""));
      if (withoutHeading.length >= 40 && withoutHeading.length <= 80_000) candidates.push({ innerText: withoutHeading });
    }

    return candidates
      .map((element) => clean(element.innerText || element.textContent))
      .filter((value) => value.length >= 40 && value.length <= 80_000)
      .sort((left, right) => left.length - right.length)[0] || "";
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
})();
