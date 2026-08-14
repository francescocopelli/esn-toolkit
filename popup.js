const port = chrome.runtime.connect({ name: "esn-toolkit" });

const tabBtns = document.querySelectorAll(".tab");
const tabPanels = document.querySelectorAll(".tab-panel");
const pnDateInput = document.getElementById("pnDate");
const verificationTypeSelect = document.getElementById("verificationType");
const sectionInput = document.getElementById("sectionInput");
const btnSingle = document.getElementById("btnSingle");
const btnAll = document.getElementById("btnAll");
const progressWrap = document.getElementById("progressWrap");
const progressFill = document.getElementById("progressFill");
const progressLabel = document.getElementById("progressLabel");
const statusMsg = document.getElementById("statusMsg");
const resultsBox = document.getElementById("resultsBox");
const copyRow = document.getElementById("copyRow");
const btnCopy = document.getElementById("btnCopy");
const btnClear = document.getElementById("btnClear");
const cardCode = document.getElementById("cardCode");
const btnCheckCard = document.getElementById("btnCheckCard");
const cardStatusMsg = document.getElementById("cardStatusMsg");
const cardResult = document.getElementById("cardResult");
const optionsLink = document.getElementById("optionsLink");
const creditsLink = document.getElementById("creditsLink");

let currentPartnershipResults = [];

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    tabPanels.forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

creditsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://github.com/francescocopelli" });
});

function parseDateValue(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const italianShort = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[,\s]+\s*(\d{1,2}):(\d{2}))?$/
  );
  if (italianShort) {
    const [, day, month, yearRaw, hours = "0", minutes = "0"] = italianShort;
    const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
    return new Date(year, Number(month) - 1, Number(day), Number(hours), Number(minutes));
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

function formatDateTime(date) {
  if (!date || Number.isNaN(date.getTime())) return "N/D";
  return date.toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function getVerificationLabel() {
  const v = verificationTypeSelect.value;
  if (v === "30d") return "Controllo a 30 giorni";
  if (v === "10d") return "Controllo a 10 giorni";
  if (v === "48h") return "Controllo a 48 ore";
  return "Tutti";
}

function setStatus(msg, type = "") {
  statusMsg.textContent = msg;
  statusMsg.className = "status-msg" + (type ? " " + type : "");
}

function renderSingleResult(outcome) {
  resultsBox.style.display = "block";
  resultsBox.innerHTML = "";

  if (!outcome || !outcome.ok) {
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `
      <span class="result-section">${outcome?.section || "N/D"}</span>
      <span class="badge badge-error">ERRORE</span>
      <span style="font-size:10px;color:#dc2626">${outcome?.error || ""}</span>
    `;
    resultsBox.appendChild(row);
    return;
  }

  const count = typeof outcome.result?.count === "number" ? outcome.result.count : 0;
  const total = typeof outcome.result?.total === "number" ? outcome.result.total : count;
  const excluded = Array.isArray(outcome.result?.excluded) ? outcome.result.excluded : [];
  const included = Array.isArray(outcome.result?.included) ? outcome.result.included : [];

  const row = document.createElement("div");
  row.className = "result-row";
  const badgeClass = count === 0 ? "badge-zero" : count < total ? "badge-warning" : "badge-ok";
  row.innerHTML = `
    <span class="result-section">${outcome.section}</span>
    <span class="result-count">${count}/${total}</span>
    `;
  // <span class="badge ${badgeClass}">${count === 0 ? "ZERO" : count < total ? "PARZIALE" : "OK"}</span>
  resultsBox.appendChild(row);

  for (const p of included) {
    const name = getPartnerName(p);
    const exp = getPartnerExpiry(p);
    const sub = document.createElement("div");
    sub.className = "result-row";
    sub.style.paddingLeft = "20px";
    sub.innerHTML = `
      <span style="font-size:11px;flex:1">${name}</span>
      <span class="badge badge-ok">ATTIVA</span>
      <span class="expired-detail">${exp}</span>
    `;
    resultsBox.appendChild(sub);
  }

  for (const p of excluded) {
    const name = getPartnerName(p);
    const exp = getPartnerExpiry(p);
    const sub = document.createElement("div");
    sub.className = "result-row";
    sub.style.paddingLeft = "20px";
    sub.innerHTML = `
      <span style="font-size:11px;flex:1">${name}</span>
      <span class="badge badge-expired">SCADUTA</span>
      <span class="expired-detail">${exp}</span>
    `;
    resultsBox.appendChild(sub);
  }
}

function getPartnerName(p) {
  if (!p || typeof p !== "object") return "Senza nome";
  const keys = ["nartner name", "partner name", "partner-name", "partner_name", "name"];
  for (const k of keys) {
    if (p[k] && String(p[k]).trim()) return String(p[k]).trim();
  }
  return "Senza nome";
}

function getPartnerExpiry(p) {
  if (!p || typeof p !== "object") return "";
  const vu = p["valid until"];
  if (vu && typeof vu === "object" && vu.value) return String(vu.value).slice(0, 10);
  const keys = ["expiration-date", "expiration_date", "expirationDate", "expiration"];
  for (const k of keys) {
    if (p[k]) return String(p[k]).trim();
  }
  return "";
}

function renderAllResults(results) {
  resultsBox.style.display = "block";
  resultsBox.innerHTML = "";
  currentPartnershipResults = results;

  for (const outcome of results) {
    const row = document.createElement("div");
    row.className = "result-row";

    if (!outcome || !outcome.ok) {
      row.innerHTML = `
        <span class="result-section">${outcome?.section || "N/D"}</span>
        <span class="badge badge-error">ERRORE</span>
      `;
      resultsBox.appendChild(row);
      continue;
    }

    const count = typeof outcome.result?.count === "number" ? outcome.result.count : 0;
    const total = typeof outcome.result?.total === "number" ? outcome.result.total : count;
    const expired = Array.isArray(outcome.result?.excluded) ? outcome.result.excluded.length : 0;
    const badgeClass = count === 0 ? "badge-zero" : count < total ? "badge-warning" : "badge-ok";
    const label = count === 0 ? "ZERO" : count < total ? "PARZIALE" : "OK";

    row.innerHTML = `
      <span class="result-section">
      <a href="https://esncard.org/services/1.0/discounts.json?code=${outcome.section}" target="_blank" rel="noopener noreferrer">
      ${outcome.section}
      </a>
      </span>
      <span class="result-count">${count}/${total}</span>
      ${expired > 0 ? `<span class="badge badge-expired">${expired} scadute</span>` : "<span class='badge badge-expired'>Nessuna scaduta</span>"}
    `;
    resultsBox.appendChild(row);
  }

  copyRow.style.display = "flex";
}

function updateProgress(progress) {
  if (!progress) return;

  progressWrap.classList.add("visible");
  const pct = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  progressFill.style.width = `${pct}%`;

  if (progress.status === "waiting" && progress.currentSection) {
    progressLabel.textContent = `In attesa... prossima: ${progress.currentSection} (${progress.completed}/${progress.total})`;
  } else if (progress.status === "running" && progress.currentSection) {
    progressLabel.textContent = `Verifica ${progress.currentSection} (${progress.completed}/${progress.total})`;
  } else if (progress.status === "completed") {
    progressLabel.textContent = `Completato: ${progress.completed}/${progress.total} sezioni`;
    renderAllResults(progress.results || []);
    setStatus("Verifica completata.", "success");
    btnAll.disabled = false;
    btnSingle.disabled = false;
  }

  if (progress.results && progress.results.length > 0 && progress.status !== "completed") {
    renderAllResults(progress.results);
  }
}

port.onMessage.addListener((message) => {
  if (message.type === "PARTNERSHIPS_PROGRESS") {
    updateProgress(message.progress);
    return;
  }
  if (message.type === "PARTNERSHIPS_SINGLE_RESULT") {
    btnSingle.disabled = false;
    const { outcome } = message;
    renderSingleResult(outcome);
    currentPartnershipResults = [outcome];
    copyRow.style.display = "flex";
    if (outcome.ok) {
      setStatus(`Trovate ${outcome.result?.count ?? 0} partnership valide.`, "success");
    } else {
      setStatus(outcome.error || "Errore.", "error");
    }
    return;
  }
  if (message.type === "CARD_RESULT") {
    btnCheckCard.disabled = false;
    renderCardResult(message.result);
    return;
  }
  if (message.type === "PROGRESS_CLEARED") {
    progressWrap.classList.remove("visible");
    progressFill.style.width = "0%";
    progressLabel.textContent = "";
    resultsBox.style.display = "none";
    resultsBox.innerHTML = "";
    copyRow.style.display = "none";
    setStatus("");
    return;
  }
});

btnSingle.addEventListener("click", async () => {
  const section = sectionInput.value.trim().toUpperCase();
  const pnDate = pnDateInput.value.trim();
  if (!section) { setStatus("Inserisci un codice sezione.", "error"); return; }
  if (!pnDate) { setStatus("Inserisci la Data PN.", "error"); return; }
  btnSingle.disabled = true;
  setStatus("Verifica in corso...");
  resultsBox.style.display = "none";
  port.postMessage({ type: "START_PARTNERSHIPS_SINGLE", section, pnDate });
});

btnAll.addEventListener("click", async () => {
  const pnDate = pnDateInput.value.trim();
  if (!pnDate) { setStatus("Inserisci la Data PN.", "error"); return; }

  const stored = await chrome.storage.local.get("sections");
  const sections = Array.isArray(stored.sections) && stored.sections.length > 0
    ? stored.sections
    : [];

  if (sections.length === 0) {
    setStatus("Nessuna sezione configurata. Vai in Opzioni.", "error");
    return;
  }

  btnAll.disabled = true;
  btnSingle.disabled = true;
  setStatus("Verifica in corso...");
  resultsBox.style.display = "none";
  resultsBox.innerHTML = "";
  copyRow.style.display = "none";
  progressFill.style.width = "0%";
  progressWrap.classList.add("visible");

  port.postMessage({ type: "START_PARTNERSHIPS_ALL", sections, pnDate });
});

btnCopy.addEventListener("click", async () => {
  if (!currentPartnershipResults.length) return;
  const text = formatPartnershipResultsForClipboard(currentPartnershipResults);
  try {
    await navigator.clipboard.writeText(text);
    btnCopy.textContent = "✓ Copiato!";
    setTimeout(() => { btnCopy.textContent = "📋 Copia risultati"; }, 2000);
  } catch (e) {
    setStatus("Errore copia negli appunti.", "error");
  }
});

btnClear.addEventListener("click", () => {
  port.postMessage({ type: "CLEAR_PROGRESS" });
  currentPartnershipResults = [];
});

btnCheckCard.addEventListener("click", () => {
  const code = cardCode.value.trim();
  if (!code) { cardStatusMsg.textContent = "Inserisci un codice."; return; }
  btnCheckCard.disabled = true;
  cardStatusMsg.textContent = "Verifica in corso...";
  cardResult.classList.remove("visible");
  port.postMessage({ type: "CHECK_CARD", code });
});

function getCardStatusBadge(status) {
  switch (String(status).toLowerCase()) {
    case "active": return `<span class="badge badge-ok">ATTIVA</span>`;
    case "inactive": return `<span class="badge badge-expired">INATTIVA</span>`;
    case "available": return `<span class="badge badge-warning">DISPONIBILE</span>`;
    default: return `<span class="badge badge-error">${status || "N/D"}</span>`;
  }
}

function renderCardResult(result) {
  cardResult.innerHTML = "";
  if (!result || !result.ok) {
    cardStatusMsg.textContent = result?.error || "Errore sconosciuto.";
    cardStatusMsg.className = "status-msg error";
    return;
  }
  cardStatusMsg.textContent = "";
  cardStatusMsg.className = "status-msg";
  const data = result.result?.data;
  if (!data) { cardStatusMsg.textContent = "Nessun dato ricevuto."; return; }

  // Campi reali dell'API esncard.org
  const code = data["code"] || "";
  const expirationRaw = data["expiration-date"] || "";
  const status = data["status"] || "";
  const sectionCode = data["section-code"] || "";
  const activationRaw = data["activation date"] || "";
  const tid = data["tid"] || "";

  const expirationDate = parseDateValue(expirationRaw);
  const activationDate = parseDateValue(activationRaw);

  const fields = [
    ["Codice", code],
    ["Sezione", sectionCode],
    ["Stato", status ? getCardStatusBadge(status) : "", true],
    ["Valida fino", expirationDate ? formatDateTime(expirationDate) : expirationRaw],
    ["Attivata il", activationDate ? formatDateTime(activationDate) : activationRaw],
    ["TID", tid]
  ];

  for (const [label, value, isHtml = false] of fields) {
    if (!value) continue;
    const div = document.createElement("div");
    div.className = "card-field";
    if (isHtml) {
      div.innerHTML = `<span>${label}:</span><span>${value}</span>`;
    } else {
      const labelEl = document.createElement("span");
      const valueEl = document.createElement("span");
      labelEl.textContent = `${label}:`;
      valueEl.textContent = value;
      div.appendChild(labelEl);
      div.appendChild(valueEl);
    }
    cardResult.appendChild(div);
  }
  cardResult.classList.add("visible");
}

function formatPartnershipResultsForClipboard(results) {
  const pnDate = pnDateInput.value
    ? formatDateTime(parseDateValue(pnDateInput.value))
    : "-";

  const lines = [];

  for (const outcome of results) {
    if (!outcome || !outcome.ok) {
      lines.push(`${outcome?.section || "N/D"}: ERRORE - ${outcome?.error || "Errore sconosciuto"}`);
      continue;
    }
    const count = typeof outcome.result?.count === "number" ? outcome.result.count : 0;
    const total = typeof outcome.result?.total === "number" ? outcome.result.total : count;
    const excluded = Array.isArray(outcome.result?.excluded) ? outcome.result.excluded.length : 0;
    // lines.push(`${outcome.section}: ${count} partnership valide su ${total}; ${excluded} scadute escluse`);
    lines.push(count);
  }

  return lines.join("\n");
}

chrome.storage.local.get(["pnDate", "verificationType"], (stored) => {
  if (stored.pnDate) pnDateInput.value = stored.pnDate;
  if (stored.verificationType) verificationTypeSelect.value = stored.verificationType;
});

pnDateInput.addEventListener("change", () => {
  chrome.storage.local.set({ pnDate: pnDateInput.value });
});

verificationTypeSelect.addEventListener("change", () => {
  chrome.storage.local.set({ verificationType: verificationTypeSelect.value });
});

port.postMessage({ type: "GET_PROGRESS" });
