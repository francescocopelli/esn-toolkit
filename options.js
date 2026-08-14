const sectionsInput = document.getElementById("sectionsInput");
const btnSave = document.getElementById("btnSave");
const btnReset = document.getElementById("btnReset");
const saveStatus = document.getElementById("saveStatus");
const creditsLink = document.getElementById("creditsLink");
const githubLink = document.getElementById("githubLink");

const DEFAULT_SECTIONS = [
  "IT-ANCO-ESA", "IT-AQUI-ESN", "IT-BARI-ESN", "IT-BENE-ESN",
  "IT-BERG-ESN", "IT-BOCC-ESN", "IT-BOLO-ESN", "IT-BRES-ESN",
  "IT-CAGL-ESN", "IT-CAME-AUR", "IT-CAMP-ESN", "IT-CATA-ASE",
  "IT-COSE-ESN", "IT-FERR-ESN", "IT-FLOR-ESN", "IT-FOGG-ESN",
  "IT-GENO-ESN", "IT-INSU-ESN", "IT-LECC-LIS", "IT-MACE-ESN",
  "IT-MESS-ESN", "IT-MILA-BIC", "IT-MILA-IUL", "IT-MILA-POL",
  "IT-MILA-STA", "IT-MILA-UCA", "IT-MODE-ESN", "IT-NAPO-ESN",
  "IT-PADO-ESN", "IT-PALE-ESN", "IT-PARM-ASI", "IT-PAVI-ESN",
  "IT-PERU-PEP", "IT-PESC-ASE", "IT-PISA-ESN", "IT-POTE-ESN",
  "IT-RAVE-ESN", "IT-RECA-ESN", "IT-RIMI-ESN", "IT-ROMA-ASE",
  "IT-ROMA-LUI", "IT-ROMA-TRE", "IT-SALE-ESN", "IT-SASS-ESN",
  "IT-SIEN-GES", "IT-TAVA-ESN", "IT-TERA-ESN", "IT-TORI-ESN",
  "IT-TREN-ESN", "IT-TRIE-ESN", "IT-URBI-ESN", "IT-VENE-MAM",
  "IT-VERO-ESN"
];

function setStatus(msg, type) {
  saveStatus.textContent = msg;
  saveStatus.className = "status" + (type ? " " + type : "");
}

chrome.storage.local.get("sections", (stored) => {
  if (Array.isArray(stored.sections) && stored.sections.length > 0) {
    sectionsInput.value = stored.sections.join("\n");
  } else {
    sectionsInput.value = DEFAULT_SECTIONS.join("\n");
  }
});

btnSave.addEventListener("click", () => {
  const lines = sectionsInput.value
    .split("\n")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (lines.length === 0) {
    setStatus("Inserisci almeno una sezione.", "error");
    return;
  }

  chrome.storage.local.set({ sections: lines }, () => {
    setStatus(`${lines.length} sezioni salvate.`, "ok");
    setTimeout(() => setStatus(""), 3000);
  });
});

btnReset.addEventListener("click", () => {
  sectionsInput.value = DEFAULT_SECTIONS.join("\n");
  chrome.storage.local.set({ sections: DEFAULT_SECTIONS }, () => {
    setStatus(`${DEFAULT_SECTIONS.length} sezioni ripristinate.`, "ok");
    setTimeout(() => setStatus(""), 3000);
  });
});

for (const link of [creditsLink, githubLink]) {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: link.href });
  });
}
