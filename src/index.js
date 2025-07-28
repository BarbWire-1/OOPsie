// === IMPORTS ===
// === IMPORTS ===
import { generateMermaid } from "./generateMermaid.js";
import { generateJS } from "./generateJS.js";
import { parseDSL } from "./dsl/parseDSL.js";
import { game, game2, ttt, simpleSketch } from './testSketches/exampleSketches.js';

mermaid.initialize({ startOnLoad: false });

// === STATE / DOM REFERENCES ===
const examples = [ game, game2, ttt, simpleSketch ];
const themeSelect = document.getElementById("theme-select");
const exampleSelect = document.getElementById("example-select");

const dslInput = document.getElementById("dsl-input");
const jsonOutput = document.getElementById("json-output");
const mermaidCodeOutput = document.getElementById("mermaid-code-output");
const jsOutput = document.getElementById("js-output");
const diagramDiv = document.getElementById("diagram");

// === INIT EXAMPLE SELECT ===
examples.forEach((example, index) => {
	const option = document.createElement("option");
	option.value = index;
	option.textContent = `Example ${index + 1}`;
	exampleSelect.appendChild(option);
});

const defaultExampleIndex = 1;
dslInput.value = examples[ defaultExampleIndex ];
exampleSelect.value = defaultExampleIndex;
updateAllOutputs(dslInput.value);

// === RENDERING ===
function renderJSON(parsedDSL) {
	jsonOutput.textContent = JSON.stringify(parsedDSL, null, 2);
}


async function renderDiagram(mermaidCode) {
	if (!mermaidCode.trim()) {
		diagramDiv.innerHTML = "";
		return;
	}
	try {
		const { svg, bindFunctions } = await mermaid.render('generatedDiagram', mermaidCode);
		diagramDiv.innerHTML = svg;
		if (bindFunctions) bindFunctions(diagramDiv);
	} catch {
		// Silently ignore all errors from Mermaid rendering
		// No logs, no UI errors
	}
}


function renderJS(parsedDSL) {
	const jsCode = generateJS(parsedDSL);
	const codeEl = jsOutput.querySelector("code");
	codeEl.textContent = jsCode;
	Prism.highlightElement(codeEl);
	return jsCode;
}

// === MAIN UPDATE FUNCTION ===
function updateAllOutputs() {
	clearError();
	const dslText = dslInput.value;

	console.log("=== UPDATE OUTPUTS ===");
	console.log("DSL Input:\n", dslText);

	try {
		const parsedDSL = parseDSL(dslText);

		// JSON + JS render should always work
		renderJSON(parsedDSL);
		renderJS(parsedDSL);

		// Generate Mermaid code
		const mermaidCode = generateMermaid(parsedDSL);
		mermaidCodeOutput.textContent = mermaidCode;

		// Only try rendering if there is Mermaid code
		if (mermaidCode.trim()) {
			renderDiagram(mermaidCode);
		} else {
			diagramDiv.innerHTML = ""; // Clear diagram if no code
		}
	} catch (err) {
		console.error("Parse error:", err);
		setError(err.message);
	}
}

// === ERROR HANDLING ===
function setError(message) {
	jsonOutput.textContent = "Invalid DSL: " + message;
	diagramDiv.innerHTML = "";
}

function clearError() {
	// Optional: remove visual error indicators
}

// === UI EVENTS ===

// Change example
exampleSelect.addEventListener("change", () => {
	const selectedIndex = parseInt(exampleSelect.value, 10);
	const selectedExample = examples[ selectedIndex ];
	dslInput.value = selectedExample;
	updateAllOutputs(selectedExample);
});

// Tab support in DSL input
dslInput.addEventListener("keydown", e => {
	if (e.key === "Tab") {
		e.preventDefault();
		const start = dslInput.selectionStart;
		const end = dslInput.selectionEnd;
		dslInput.value = dslInput.value.substring(0, start) + "  " + dslInput.value.substring(end);
		dslInput.selectionStart = dslInput.selectionEnd = start + 2;
	}
});


document.getElementById('generate-out-btn').addEventListener('click', updateAllOutputs)
// Live update (debounced)
let debounceTimer;
const liveUpdateCheckbox = document.getElementById("live-update-checkbox");

dslInput.addEventListener("input", () => {
	if (!liveUpdateCheckbox.checked) return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(updateAllOutputs, 500);
});

// Theme switching
themeSelect.addEventListener("change", () => {
	document.body.className = "";
	document.body.classList.add(themeSelect.value);
});

// Zoom/Fullscreen on <pre>
document.querySelectorAll("pre").forEach(pre => {
	pre.setAttribute("title", "Double-click to zoom in/out");
	pre.addEventListener("dblclick", () => {
		pre.classList.toggle("fullscreen-pre");
	});
});

// === DOWNLOAD HELPERS ===
function generateMarkdown({ dsl, json, mermaid, js }) {
	return `
# DSL Input
\`\`\`yaml
${dsl}
\`\`\`

# Parsed JSON
\`\`\`json
${json}
\`\`\`

# Mermaid Diagram
\`\`\`mermaid
${mermaid}
\`\`\`

# Generated JS
\`\`\`js
${js}
\`\`\`
`.trim();
}

function downloadFile(filename, content) {
	const blob = new Blob([ content ], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

// === DOWNLOAD EVENTS ===
document.getElementById("download-md-btn").addEventListener("click", () => {
	try {
		const parsedDSL = parseDSL(dslInput.value.trim());
		const json = JSON.stringify(parsedDSL, null, 2);
		const mermaid = generateMermaid(parsedDSL);
		const js = generateJS(parsedDSL);

		const markdown = generateMarkdown({
			dsl: dslInput.value,
			json,
			mermaid,
			js,
		});

		downloadFile("sketch-output.md", markdown);
	} catch (err) {
		setError(err.message);
	}
});

document.getElementById("download-svg-btn").addEventListener("click", () => {
	const svgElement = diagramDiv.querySelector("svg");
	if (!svgElement) return alert("No diagram to download!");

	const clonedSvg = svgElement.cloneNode(true);
	clonedSvg.setAttribute("width", "800");
	clonedSvg.setAttribute("height", "600");

	if (!clonedSvg.hasAttribute("viewBox")) {
		const w = clonedSvg.getAttribute("width");
		const h = clonedSvg.getAttribute("height");
		clonedSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
	}

	const svgData = new XMLSerializer().serializeToString(clonedSvg);
	const blob = new Blob([ svgData ], { type: "image/svg+xml;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "diagram.svg";
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
});
