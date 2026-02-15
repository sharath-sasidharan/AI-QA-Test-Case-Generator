const generateBtn = document.getElementById("generateBtn");
const generateBtnText = generateBtn.querySelector(".btn-text");
const spinner = generateBtn.querySelector(".spinner");

const regenerateBtn = document.getElementById("regenerateBtn");
const downloadCSVBtn = document.getElementById("downloadCSVBtn");
const textarea = document.getElementById("featureInput");
const negativeToggle = document.getElementById("negativeToggle");
const testCasesContainer = document.getElementById("testCases");
const playwrightScript = document.getElementById("playwrightScript");
const clearBtn = document.getElementById("clearBtn");
const copyScriptBtn = document.getElementById("copyScriptBtn");

let latestTestCases = [];
let isLoading = false;

/* ===========================
   UI STATE CONTROLLER
=========================== */

function updateUIState() {
  generateBtn.disabled = isLoading || !textarea.value.trim();

  if (isLoading) {
    spinner.style.display = "inline-block";
    generateBtnText.textContent = "Generating...";
  } else {
    spinner.style.display = "none";
    generateBtnText.textContent = "Generate Test Cases";
  }

  // Show clear only if results exist
  const hasResults =
    latestTestCases.length > 0 || playwrightScript.textContent.trim() !== "";

  clearBtn.style.display = hasResults ? "inline-block" : "none";
}

/* ===========================
   Event Listeners
=========================== */

generateBtn.addEventListener("click", generate);
regenerateBtn.addEventListener("click", generate);
downloadCSVBtn.addEventListener("click", () => downloadCSV(latestTestCases));

textarea.addEventListener("input", updateUIState);

copyScriptBtn.addEventListener("click", () => {
  const script = playwrightScript.textContent;

  if (!script) {
    alert("No script to copy!");
    return;
  }

  navigator.clipboard.writeText(script);
  copyScriptBtn.innerText = "Copied ✓";

  setTimeout(() => {
    copyScriptBtn.innerText = "Copy Script";
  }, 1500);
});

/* ===========================
   Generate AI Test Cases
=========================== */

async function generate() {
  const feature = textarea.value.trim();
  if (!feature) {
    alert("Enter feature description.");
    return;
  }

  isLoading = true;
  updateUIState();

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature,
        includeNegative: negativeToggle.checked,
      }),
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    latestTestCases = data.testCases || [];

    renderTestCases(latestTestCases);
    renderPlaywright(data.playwrightScript || "");
    updateStats(latestTestCases);

    regenerateBtn.style.display = "inline-block";
    downloadCSVBtn.style.display = "inline-block";

    testCasesContainer.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.log(error);
    alert("Something went wrong. Please try again.");
  } finally {
    isLoading = false;
    updateUIState();
  }
}

/* ===========================
   UI Helpers
=========================== */

function showEmptyState() {
  testCasesContainer.innerHTML =
    '<p class="empty-state">No test cases generated yet.</p>';
}

function updateStats(testCases) {
  document.getElementById("totalCount").textContent = testCases.length;

  const high = testCases.filter((tc) => tc.priority === "High").length;
  const medium = testCases.filter((tc) => tc.priority === "Medium").length;
  const low = testCases.filter((tc) => tc.priority === "Low").length;

  document.getElementById("highCount").textContent = high;
  document.getElementById("mediumCount").textContent = medium;
  document.getElementById("lowCount").textContent = low;
}

/* ===========================
   Render Functions
=========================== */

function renderTestCases(testCases) {
  testCasesContainer.innerHTML = "";

  if (!testCases.length) {
    showEmptyState();
    return;
  }

  testCases.forEach((tc) => {
    const card = document.createElement("div");
    card.classList.add("test-card", tc.priority.toLowerCase());

    card.innerHTML = `
      <h3>${tc.title} (${tc.priority})</h3>
      <p><strong>Preconditions:</strong> ${tc.preconditions}</p>
      <p><strong>Steps:</strong></p>
      <ul>
        ${tc.steps.map((step) => `<li>${step}</li>`).join("")}
      </ul>
      <p><strong>Expected:</strong> ${tc.expected}</p>
    `;

    testCasesContainer.appendChild(card);
  });
}

function renderPlaywright(script) {
  playwrightScript.textContent = script;
}

/* ===========================
   CSV Export
=========================== */

function downloadCSV(testCases) {
  if (!testCases.length) {
    alert("No test cases to download.");
    return;
  }

  let csv = "Title,Priority,Preconditions,Steps,Expected\n";

  testCases.forEach((tc) => {
    csv += `"${tc.title}","${tc.priority}","${
      tc.preconditions
    }","${tc.steps.join(" | ")}","${tc.expected}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "test_cases.csv";
  link.click();
}

/* ===========================
   Clear Button
=========================== */

clearBtn.addEventListener("click", () => {
  textarea.value = "";
  negativeToggle.checked = false;

  latestTestCases = [];
  playwrightScript.textContent = "";

  showEmptyState();
  updateStats([]);

  regenerateBtn.style.display = "none";
  downloadCSVBtn.style.display = "none";

  updateUIState();
});

/* ===========================
   Initial Load
=========================== */

window.addEventListener("DOMContentLoaded", () => {
  showEmptyState();
  updateStats([]);
  updateUIState();
});
