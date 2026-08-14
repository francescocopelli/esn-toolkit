const ESNCARD_ORIGIN = "https://esncard.org";
const PARTNERSHIP_DELAY_MS = 30 * 1000;
const PARTNERSHIP_PROGRESS_KEY = "partnershipProgress";

function buildCardUrl(code) {
  return `${ESNCARD_ORIGIN}/services/1.0/card.json?code=${encodeURIComponent(code)}`;
}

function buildPartnershipUrl(sectionCode) {
  return `${ESNCARD_ORIGIN}/services/1.0/discounts.json?code=${encodeURIComponent(sectionCode)}`;
}

async function getActiveEsncardTab() {
  const activeTabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
    url: "https://esncard.org/*"
  });

  if (activeTabs.length > 0) {
    return activeTabs[0];
  }

  const esnTabs = await chrome.tabs.query({
    url: "https://esncard.org/*"
  });

  return esnTabs.length > 0 ? esnTabs[0] : null;
}

async function fetchJsonInTab(tabId, url) {
  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: async (requestUrl) => {
      try {
        const response = await fetch(requestUrl, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json, text/plain, */*" }
        });
        const raw = await response.text();
        const trimmed = raw.trim();
        let json = null;
        let parseError = null;
        if (trimmed.length > 0) {
          try {
            json = JSON.parse(trimmed);
          } catch (error) {
            parseError = error instanceof Error ? error.message : String(error);
          }
        }
        return {
          httpOk: response.ok,
          status: response.status,
          contentType: response.headers.get("content-type") || "",
          redirected: response.redirected,
          finalUrl: response.url,
          raw,
          json,
          parseError,
          empty: trimmed.length === 0
        };
      } catch (error) {
        return {
          httpOk: false,
          status: 0,
          contentType: "",
          redirected: false,
          finalUrl: requestUrl,
          raw: "",
          json: null,
          parseError: error instanceof Error ? error.message : String(error),
          empty: true
        };
      }
    },
    args: [url]
  });

  return injectionResults[0]?.result || null;
}

function notifyProgress(port, progress) {
  if (!port) return;
  try {
    port.postMessage({ type: "PARTNERSHIPS_PROGRESS", progress });
  } catch (_) {}
}

async function savePartnershipProgress(progress) {
  await chrome.storage.session.set({ [PARTNERSHIP_PROGRESS_KEY]: progress });
}

async function getPartnershipProgress() {
  const stored = await chrome.storage.session.get(PARTNERSHIP_PROGRESS_KEY);
  return stored[PARTNERSHIP_PROGRESS_KEY] || null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeValue(value) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getObjectValue(object, keys) {
  if (!object || typeof object !== "object") return "";
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] !== null &&
      object[key] !== undefined
    ) {
      return normalizeValue(object[key]);
    }
  }
  return "";
}

function parseDateValue(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const italianMatch = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/
  );
  if (italianMatch) {
    const [, day, month, year, hours = "0", minutes = "0"] = italianMatch;
    return new Date(
      Number(year), Number(month) - 1, Number(day),
      Number(hours), Number(minutes)
    );
  }

  const sqlMatch = text.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (sqlMatch) {
    const [, year, month, day, hours, minutes, seconds] = sqlMatch;
    return new Date(
      Number(year), Number(month) - 1, Number(day),
      Number(hours), Number(minutes), Number(seconds)
    );
  }

  const iso = new Date(text);
  if (!Number.isNaN(iso.getTime())) return iso;
  return null;
}

function getRecordExpirationValue(record) {
  if (!record || typeof record !== "object") return "";

  const validUntil = record["valid until"];
  if (
    validUntil &&
    typeof validUntil === "object" &&
    !Array.isArray(validUntil) &&
    validUntil.value !== undefined &&
    validUntil.value !== null
  ) {
    return String(validUntil.value).trim();
  }

  const possibleKeys = [
    "expiration-date", "expiration date", "expiration_date",
    "expirationDate", "expiration", "end-date", "end_date", "endDate"
  ];

  for (const key of possibleKeys) {
    if (record[key] !== undefined && record[key] !== null) {
      const value = Array.isArray(record[key]) ? record[key][0] : record[key];
      if (value && typeof value === "object" && value.value !== undefined) {
        return String(value.value).trim();
      }
      return String(value).trim();
    }
  }

  return "";
}

function getRecordName(record) {
  if (!record || typeof record !== "object") return "";
  const keys = [
    "nartner name", "partner name", "partner-name", "partner_name",
    "business-name", "business_name", "name", "title"
  ];
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      const value = Array.isArray(record[key]) ? record[key][0] : record[key];
      if (String(value).trim()) return String(value).trim();
    }
  }
  return "";
}

function isPartnershipExpiredBeforePn(record, pnValue) {
  const pnStartDate = parseDateValue(pnValue);
  if (!pnStartDate) {
    return { expired: false, comparable: false, reason: "Data PN non valida." };
  }

  const expirationValue = getRecordExpirationValue(record);
  if (!expirationValue) {
    return { expired: false, comparable: false, reason: "Data di scadenza non disponibile." };
  }

  const expirationDate = parseDateValue(expirationValue);
  if (!expirationDate) {
    return { expired: false, comparable: false, reason: `Data non interpretabile: ${expirationValue}` };
  }

  const expired = expirationDate.getTime() < pnStartDate.getTime();
  return {
    expired,
    comparable: true,
    expirationValue,
    expirationDate: expirationDate.toISOString(),
    pnStartDate: pnStartDate.toISOString(),
    reason: expired
      ? "Partnership scaduta prima dell'inizio della PN."
      : "Partnership valida all'inizio della PN."
  };
}

function extractPartnershipArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const possibleKeys = ["discounts", "partnerships", "results", "items", "data"];
  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function filterPartnershipsForPn(data, pnValue) {
  const partnerships = extractPartnershipArray(data);
  const included = [];
  const excluded = [];
  const notComparable = [];

  for (const partnership of partnerships) {
    const validation = isPartnershipExpiredBeforePn(partnership, pnValue);
    if (validation.expired) {
      excluded.push({ ...partnership, _filterReason: validation.reason, _expirationValue: validation.expirationValue });
      continue;
    }
    if (!validation.comparable) {
      notComparable.push({ ...partnership, _filterReason: validation.reason });
    }
    included.push(partnership);
  }

  return { included, excluded, notComparable };
}

function extractPartnershipCount(data) {
  if (Array.isArray(data)) return data.length;
  if (!data || typeof data !== "object") return 0;
  const countKeys = ["count", "total", "total_count", "discount_count", "discounts_count", "partnership_count", "partnerships_count"];
  for (const key of countKeys) {
    if (typeof data[key] === "number") return data[key];
    if (typeof data[key] === "string" && data[key].trim() !== "") {
      const parsed = Number(data[key]);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return extractPartnershipArray(data).length;
}

async function countPartnershipsForSection(section, pnValue) {
  const tab = await getActiveEsncardTab();
  if (!tab || !tab.id) {
    return { ok: false, section, result: null, error: "Nessuna tab attiva su esncard.org." };
  }

  const url = buildPartnershipUrl(section);
  try {
    const outcome = await fetchJsonInTab(tab.id, url);
    if (!outcome) {
      return { ok: false, section, result: null, error: "Nessuna risposta dallo script iniettato." };
    }

    const diagnostic = {
      requestUrl: url,
      status: outcome.status,
      contentType: outcome.contentType,
      redirected: outcome.redirected,
      finalUrl: outcome.finalUrl,
      raw: outcome.raw
    };

    if (outcome.empty) {
      return { ok: false, section, result: diagnostic, error: `Risposta vuota per ${section}. HTTP ${outcome.status}.` };
    }
    if (!outcome.httpOk) {
      return { ok: false, section, result: diagnostic, error: `HTTP ${outcome.status} per ${section}.` };
    }
    if (outcome.parseError) {
      return { ok: false, section, result: diagnostic, error: `Risposta non JSON valida per ${section}: ${outcome.parseError}` };
    }

    const rawData = outcome.json;
    const filtered = filterPartnershipsForPn(rawData, pnValue);
    const allPartnerships = extractPartnershipArray(rawData);
    const hasPartnershipArray = Array.isArray(rawData) || allPartnerships.length > 0;
    const filteredCount = hasPartnershipArray
      ? filtered.included.length
      : extractPartnershipCount(rawData);

    return {
      ok: true,
      section,
      result: {
        ...diagnostic,
        data: rawData,
        count: filteredCount,
        total: hasPartnershipArray ? allPartnerships.length : filteredCount,
        included: filtered.included,
        excluded: filtered.excluded,
        notComparable: filtered.notComparable,
        pnDate: pnValue
      },
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      section,
      result: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function countPartnershipsAllWithProgress(sections, pnValue, port = null) {
  const validSections = sections.map((s) => String(s).trim()).filter(Boolean);
  const total = validSections.length;

  let progress = {
    status: "running",
    completed: 0,
    total,
    currentSection: null,
    waitUntil: null,
    results: [],
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    pnDate: pnValue
  };

  await savePartnershipProgress(progress);
  notifyProgress(port, progress);

  for (let i = 0; i < total; i++) {
    const section = validSections[i];
    progress = { ...progress, status: "running", currentSection: section, waitUntil: null };
    await savePartnershipProgress(progress);
    notifyProgress(port, progress);

    const outcome = await countPartnershipsForSection(section, pnValue);
    progress = { ...progress, completed: i + 1, currentSection: null, results: [...progress.results, outcome] };
    await savePartnershipProgress(progress);
    notifyProgress(port, progress);

    if (i < total - 1) {
      const waitUntil = Date.now() + PARTNERSHIP_DELAY_MS;
      progress = { ...progress, status: "waiting", currentSection: validSections[i + 1], waitUntil };
      await savePartnershipProgress(progress);
      notifyProgress(port, progress);
      await wait(PARTNERSHIP_DELAY_MS);
    }
  }

  progress = {
    ...progress,
    status: "completed",
    completed: total,
    currentSection: null,
    waitUntil: null,
    finishedAt: new Date().toISOString()
  };
  await savePartnershipProgress(progress);
  notifyProgress(port, progress);

  return { ok: true, result: progress.results, error: null };
}

async function checkCard(code) {
  const normalized = String(code || "").trim();
  if (!normalized) {
    return { ok: false, result: null, error: "Codice ESNcard mancante." };
  }

  const tab = await getActiveEsncardTab();
  if (!tab || !tab.id) {
    return { ok: false, result: null, error: "Nessuna tab attiva su esncard.org." };
  }

  const url = buildCardUrl(normalized);
  try {
    const outcome = await fetchJsonInTab(tab.id, url);
    if (!outcome) {
      return { ok: false, result: null, error: "Nessuna risposta dal server." };
    }
    if (outcome.empty) {
      return { ok: false, result: { status: outcome.status, raw: outcome.raw }, error: "Risposta vuota dal server." };
    }
    if (outcome.parseError) {
      return { ok: false, result: { status: outcome.status, raw: outcome.raw }, error: `Risposta non JSON valida: ${outcome.parseError}` };
    }
    return {
      ok: true,
      result: { status: outcome.status, data: outcome.json, raw: outcome.raw, requestUrl: url },
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      result: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "esn-toolkit") return;

  port.onMessage.addListener(async (message) => {
    if (message.type === "GET_PROGRESS") {
      const progress = await getPartnershipProgress();
      notifyProgress(port, progress);
      return;
    }

    if (message.type === "START_PARTNERSHIPS_SINGLE") {
      const { section, pnDate } = message;
      const outcome = await countPartnershipsForSection(section, pnDate);
      port.postMessage({ type: "PARTNERSHIPS_SINGLE_RESULT", outcome });
      return;
    }

    if (message.type === "START_PARTNERSHIPS_ALL") {
      const { sections, pnDate } = message;
      await countPartnershipsAllWithProgress(sections, pnDate, port);
      return;
    }

    if (message.type === "CHECK_CARD") {
      const { code } = message;
      const result = await checkCard(code);
      port.postMessage({ type: "CARD_RESULT", result });
      return;
    }

    if (message.type === "CLEAR_PROGRESS") {
      await chrome.storage.session.remove(PARTNERSHIP_PROGRESS_KEY);
      port.postMessage({ type: "PROGRESS_CLEARED" });
      return;
    }
  });
});
