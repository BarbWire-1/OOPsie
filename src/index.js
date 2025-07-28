// === IMPORTS ===
import { generateMermaid } from "./generateMermaid.js";
import { generateJS } from "./generateJS.js";
import { parseDSL } from "./dsl/parseDSL.js";
import { examples } from './testSketches/exampleSketches.js';
mermaid.initialize({ startOnLoad: false });


// === STATE / DOM REFERENCES ===


// Cache DOM elements once here:
const themeSelect = document.getElementById("theme-select");
const exampleSelect = document.getElementById("example-select");
const dslInput = document.getElementById("dsl-input");
const jsonOutput = document.getElementById("json-output");
const mermaidCodeOutput = document.getElementById("mermaid-code-output");
const jsOutput = document.getElementById("js-output");
const jsOutputCode = jsOutput.querySelector("code");
const diagramDiv = document.getElementById("diagram");
const liveUpdateCheckbox = document.getElementById("live-update-checkbox");
const clearAllBtn = document.getElementById("clear-all-btn");
const downloadMdBtn = document.getElementById("download-md-btn");
const downloadSvgBtn = document.getElementById("download-svg-btn");
const clearedNotice = document.getElementById("cleared-notice");

const preElements = document.querySelectorAll("pre");


// === STATE FLAGS ===
let userEdited = false;
//let hasClearedAfterEdit = false;
let debounceTimer;


// === INIT EXAMPLES SELECT OPTIONS ===
examples.forEach((example, index) => {
	const option = document.createElement("option");
	option.value = index;
	option.textContent = `Example ${index + 1}`;
	exampleSelect.appendChild(option);
});

const defaultExampleIndex = 0;
dslInput.value = examples[ defaultExampleIndex ];
exampleSelect.value = defaultExampleIndex;
updateAllOutputs();


// === OUTPUT RENDERING FUNCTIONS ===
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
		// Ignore Mermaid rendering errors silently
	}
}

function renderJS(parsedDSL) {
	const jsCode = generateJS(parsedDSL);
	jsOutputCode.textContent = jsCode;
	Prism.highlightElement(jsOutputCode);
	return jsCode;
}


// === MAIN UPDATE FUNCTION ===
function updateAllOutputs() {
	clearError();

	const dslText = dslInput.value;

	try {
		const parsedDSL = parseDSL(dslText);

		renderJSON(parsedDSL);
		const jsCode = renderJS(parsedDSL);
		const mermaidCode = generateMermaid(parsedDSL);

		mermaidCodeOutput.textContent = mermaidCode;

		if (mermaidCode.trim()) {
			renderDiagram(mermaidCode);
		} else {
			diagramDiv.innerHTML = "";
		}
	} catch (err) {
		console.error("Parse error:", err);
		setError(err.message);
	}
}


// === OUTPUT CLEARING ON USER EDIT ===
function clearOutputsBeforeUserUpdate() {
	jsonOutput.textContent = "";
	mermaidCodeOutput.textContent = "";
	jsOutputCode.textContent = "";
	diagramDiv.innerHTML = "";

	if (clearedNotice) {
		clearedNotice.style.display = "block";
		setTimeout(() => {
			clearedNotice.style.display = "none";
		}, 1500);
	}
}

function clearAll() {
	// Clear the DSL input textarea
	dslInput.value = "";

	// Clear outputs
	jsonOutput.textContent = "";
	mermaidCodeOutput.textContent = "";
	jsOutputCode.textContent = "";
	diagramDiv.innerHTML = "";

	// Clear errors
	clearError();

	// Reset state flags
	userEdited = false;
	hasClearedAfterEdit = false;

	// Hide cleared notice if visible
	if (clearedNotice) {
		clearedNotice.style.display = "none";
	}
}


// === ERROR HANDLING ===
function setError(message) {
	jsonOutput.textContent = "Invalid DSL: " + message;
	diagramDiv.innerHTML = "";
	dslInput.classList.add("error");
}

function clearError() {
	dslInput.classList.remove("error");
}


// === UI EVENT LISTENERS ===

// DSL input typing
dslInput.addEventListener("input", () => {
	if (!userEdited) {
		userEdited = true;
		clearOutputsBeforeUserUpdate();
		hasClearedAfterEdit = true;
	}

	if (liveUpdateCheckbox.checked) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			updateAllOutputs();
		}, 500);
	}
});

// Tab support inside DSL input
dslInput.addEventListener("keydown", e => {
	if (e.key === "Tab") {
		e.preventDefault();
		const start = dslInput.selectionStart;
		const end = dslInput.selectionEnd;
		dslInput.value = dslInput.value.substring(0, start) + "  " + dslInput.value.substring(end);
		dslInput.selectionStart = dslInput.selectionEnd = start + 2;
	}
});

// Example selection
exampleSelect.addEventListener("change", () => {
	const selectedIndex = parseInt(exampleSelect.value, 10);
	const selectedExample = examples[ selectedIndex ];
	dslInput.value = selectedExample;

	userEdited = false;
	hasClearedAfterEdit = false;

	updateAllOutputs();
});

// Manual update button
document.getElementById('generate-out-btn').addEventListener('click', () => {
	updateAllOutputs();
});

// Clear All button
clearAllBtn.addEventListener("click", clearAll);

// Theme selector
themeSelect.addEventListener("change", () => {
	document.body.className = "";
	document.body.classList.add(themeSelect.value);
});

// Download Markdown button
downloadMdBtn.addEventListener("click", () => {
	try {
		const dslText = dslInput.value.trim();

		// Read checkboxes once
		const includeDsl = document.getElementById("include-dsl")?.checked ?? false;
		const includeJson = document.getElementById("include-json")?.checked ?? false;
		const includeMermaid = document.getElementById("include-mermaid")?.checked ?? false;
		const includeJs = document.getElementById("include-js")?.checked ?? false;

		if (!includeDsl && !includeJson && !includeMermaid && !includeJs) {
			throw new Error("Please select at least one output to include in the download.");
		}

		const parsedDSL = parseDSL(dslText);

		const json = includeJson ? JSON.stringify(parsedDSL, null, 2) : null;
		const mermaid = includeMermaid ? generateMermaid(parsedDSL) : null;
		const js = includeJs ? generateJS(parsedDSL) : null;

		const markdown = generateMarkdown({
			dsl: dslText,
			json,
			mermaid,
			js,
		}, {
			includeDsl,
			includeJson,
			includeMermaid,
			includeJs,
		});

		downloadFile("sketch-output.md", markdown);
	} catch (err) {
		setError(err.message);
	}
});

// Download SVG button
downloadSvgBtn.addEventListener("click", () => {
	const svgElement = diagramDiv.querySelector("svg");
	if (!svgElement) {
		alert("No diagram to download!");
		return;
	}

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


// === UTILITIES ===

function generateMarkdown({ dsl, json, mermaid, js }, { includeDsl, includeJson, includeMermaid, includeJs }) {
	let result = "";

	if (includeDsl) {
		result += `# DSL Input\n\`\`\`yaml\n${dsl}\n\`\`\``;
	}

	if (includeJson && json !== null) {
		if (result.length > 0) result += "\n\n";
		result += `# Parsed JSON\n\`\`\`json\n${json}\n\`\`\``;
	}
	if (includeMermaid && mermaid !== null) {
		if (result.length > 0) result += "\n\n";
		result += `# Mermaid Diagram\n\`\`\`mermaid\n${mermaid}\n\`\`\``;
	}
	if (includeJs && js !== null) {
		if (result.length > 0) result += "\n\n";
		result += `# Generated JS\n\`\`\`js\n${js}\n\`\`\``;
	}

	return result;
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


// === ZOOM PRE BLOCKS ON DOUBLE CLICK ===
// Set titles and event listener for all pre elements once at startup
preElements.forEach(pre => {
	pre.setAttribute("title", "Double-click to zoom in/out");
});

// Use event delegation for double click on any <pre> anywhere
document.body.addEventListener("dblclick", e => {
	if (e.target.tagName === "PRE") {
		e.target.classList.toggle("fullscreen-pre");
	}
});
