const generateBtn = document.getElementById("generateBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const downloadCSVBtn = document.getElementById("downloadCSVBtn");
const textarea = document.getElementById("featureInput");
const negativeToggle = document.getElementById("negativeToggle");
const testCasesContainer = document.getElementById("testCases");
const playwrightScript = document.getElementById("playwrightScript");
const clearBtn = document.getElementById("clearBtn");
const copyScriptBtn = document.getElementById("copyScriptBtn");

let latestTestCases = [];

generateBtn.addEventListener("click", generate);
regenerateBtn.addEventListener("click", generate);
downloadCSVBtn.addEventListener("click", () => downloadCSV(latestTestCases));

copyScriptBtn.addEventListener("click", () => {
  const script = document.getElementById("playwrightScript").textContent;
  if (!script) return alert("No script to copy!");
  navigator.clipboard.writeText(script);
  alert("Script copied!");
});

async function generate() {
  const feature = textarea.value.trim();
  if (!feature) return alert("Enter feature description.");

  generateBtn.disabled = true;
  generateBtn.innerText = "Generating AI Cases...";

  const response = await fetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      feature,
      includeNegative: negativeToggle.checked,
    }),
  });

  const data = await response.json();

  latestTestCases = data.testCases;

  renderTestCases(data.testCases);
  renderPlaywright(data.playwrightScript);

  generateBtn.disabled = false;
  generateBtn.innerText = "Generate Test Cases";

  regenerateBtn.style.display = "inline-block";
  downloadCSVBtn.style.display = "inline-block";
}

function showEmptyState() {
  testCasesContainer.innerHTML =
    '<p class="empty-state">No test cases generated yet.</p>';
}

function renderTestCases(testCases) {
  const container = document.getElementById("testCases");
  container.innerHTML = "";

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

    container.appendChild(card);
  });
}

function renderPlaywright(script) {
  document.getElementById("playwrightScript").textContent = script;
}

function downloadCSV(testCases) {
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

clearBtn.addEventListener("click", () => {
  document.getElementById("featureInput").value = "";
  document.getElementById("negativeToggle").checked = false;

  showEmptyState();

  playwrightScript.textContent = "";

  document.getElementById("regenerateBtn").style.display = "none";
  document.getElementById("downloadCSVBtn").style.display = "none";
});

window.addEventListener("DOMContentLoaded", () => {
  showEmptyState();
});
