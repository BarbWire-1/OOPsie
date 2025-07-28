// TODO add abstract class!
// TODO no declaration of provate method!!! remove that

// TODO clean this monter - refactor, modules => eventDelegation!!!!!!
// === IMPORTS ===
import { generateMermaid } from "./generateMermaid.js";
import { generateJS } from "./generateJS.js";
import { parseDSL } from "./dsl/parseDSL.js";
import { examples } from './testSketches/exampleSketches.js';

mermaid.initialize({ startOnLoad: false });


// === DOM ELEMENTS ===
const DOM = {
	themeSelect: document.getElementById("theme-select"),
	exampleSelect: document.getElementById("example-select"),
	dslInput: document.getElementById("dsl-input"),
	jsonOutput: document.getElementById("json-output"),
	mermaidCodeOutput: document.getElementById("mermaid-code-output"),
	jsOutputCode: document.querySelector("#js-output code"),
	diagramDiv: document.getElementById("diagram"),
	liveUpdateCheckbox: document.getElementById("live-update-checkbox"),
	clearAllBtn: document.getElementById("clear-all-btn"),
	downloadMdBtn: document.getElementById("download-md-btn"),
	downloadSvgBtn: document.getElementById("download-svg-btn"),
	clearedNotice: document.getElementById("cleared-notice"),
	enableLogsBtn: document.getElementById('addLogs'),
	preElements: document.querySelectorAll("pre"),
	generateOutBtn: document.getElementById('generate-out-btn'),
};

// === STATE ===
let userEdited = false;
let debounceTimer = null;
let enableLogging = true;


// === INITIALIZATION ===
function init() {
	setupExamples();
	setupEventListeners();
	DOM.dslInput.value = examples[ 0 ];
	DOM.exampleSelect.value = 0;
	updateAllOutputs();
	setupPreElements();
}

function setupExamples() {
	examples.forEach((ex, i) => {
		const option = document.createElement("option");
		option.value = i;
		option.textContent = `Example ${i + 1}`;
		DOM.exampleSelect.appendChild(option);
	});
}

function setupPreElements() {
	DOM.preElements.forEach(pre => {
		pre.title = "Double-click to zoom in/out";
	});
}


// === OUTPUT RENDERING ===
function renderJSON(parsedDSL) {
	DOM.jsonOutput.textContent = JSON.stringify(parsedDSL, null, 2);
}

async function renderDiagram(mermaidCode) {
	if (!mermaidCode.trim()) {
		DOM.diagramDiv.innerHTML = "";
		return;
	}
	try {
		const { svg, bindFunctions } = await mermaid.render('generatedDiagram', mermaidCode);
		DOM.diagramDiv.innerHTML = svg;
		if (bindFunctions) bindFunctions(DOM.diagramDiv);
	} catch {
		// silently ignore errors
	}
}

function renderJS(parsedDSL) {
	const jsCode = generateJS(parsedDSL, enableLogging);
	DOM.jsOutputCode.textContent = jsCode;
	Prism.highlightElement(DOM.jsOutputCode);
	return jsCode;
}


// === MAIN UPDATE FUNCTION ===
function updateAllOutputs() {
	clearError();

	const dslText = DOM.dslInput.value;

	try {
		const parsedDSL = parseDSL(dslText);

		renderJSON(parsedDSL);
		const jsCode = renderJS(parsedDSL);
		const mermaidCode = generateMermaid(parsedDSL);

		DOM.mermaidCodeOutput.textContent = mermaidCode;

		if (mermaidCode.trim()) renderDiagram(mermaidCode);
		else DOM.diagramDiv.innerHTML = "";
	} catch (err) {
		console.error("Parse error:", err);
		setError(err.message);
	}
}


// === OUTPUT CLEARING ===
function clearOutputs() {
	DOM.jsonOutput.textContent = "";
	DOM.mermaidCodeOutput.textContent = "";
	DOM.jsOutputCode.textContent = "";
	DOM.diagramDiv.innerHTML = "";

	if (DOM.clearedNotice) {
		DOM.clearedNotice.style.display = "block";
		setTimeout(() => DOM.clearedNotice.style.display = "none", 1500);
	}
}

function clearAll() {
	DOM.dslInput.value = "";
	clearOutputs();
	clearError();
	userEdited = false;
	if (DOM.clearedNotice) DOM.clearedNotice.style.display = "none";
}


// === ERROR HANDLING ===
function setError(message) {
	DOM.jsonOutput.textContent = "Invalid DSL: " + message;
	DOM.diagramDiv.innerHTML = "";
	DOM.dslInput.classList.add("error");
}

function clearError() {
	DOM.dslInput.classList.remove("error");
}


// === EVENT LISTENERS SETUP ===
function setupEventListeners() {
	DOM.enableLogsBtn.addEventListener('change', () => {
		enableLogging = DOM.enableLogsBtn.checked;
		console.log('Enable logging:', enableLogging);
		updateAllOutputs();
	});

	DOM.dslInput.addEventListener("input", onDslInputChange);
	DOM.dslInput.addEventListener("keydown", onDslInputKeyDown);
	DOM.exampleSelect.addEventListener("change", onExampleChange);
	DOM.generateOutBtn.addEventListener('click', updateAllOutputs);
	DOM.clearAllBtn.addEventListener("click", clearAll);
	DOM.themeSelect.addEventListener("change", onThemeChange);
	DOM.downloadMdBtn.addEventListener("click", onDownloadMarkdown);
	DOM.downloadSvgBtn.addEventListener("click", onDownloadSVG);

	document.body.addEventListener("dblclick", onBodyDoubleClick);
}

function onDslInputChange() {
	if (!userEdited) {
		userEdited = true;
		clearOutputs();
	}

	if (DOM.liveUpdateCheckbox.checked) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(updateAllOutputs, 500);
	}
}

function onDslInputKeyDown(e) {
	if (e.key === "Tab") {
		e.preventDefault();
		const start = DOM.dslInput.selectionStart;
		const end = DOM.dslInput.selectionEnd;
		DOM.dslInput.value = DOM.dslInput.value.substring(0, start) + "  " + DOM.dslInput.value.substring(end);
		DOM.dslInput.selectionStart = DOM.dslInput.selectionEnd = start + 2;
	}
}

function onExampleChange() {
	const idx = parseInt(DOM.exampleSelect.value, 10);
	DOM.dslInput.value = examples[ idx ];
	userEdited = false;
	updateAllOutputs();
}

function onThemeChange() {
	document.body.className = "";
	document.body.classList.add(DOM.themeSelect.value);
}

function onDownloadMarkdown() {
	try {
		const dslText = DOM.dslInput.value.trim();

		// Read which outputs to include
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
		const js = includeJs ? generateJS(parsedDSL, enableLogging) : null;

		const markdown = generateMarkdown({ dsl: dslText, json, mermaid, js }, { includeDsl, includeJson, includeMermaid, includeJs });
		downloadFile("sketch-output.md", markdown);

	} catch (err) {
		setError(err.message);
	}
}

function onDownloadSVG() {
	const svgElement = DOM.diagramDiv.querySelector("svg");
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
}

function onBodyDoubleClick(e) {
	if (e.target.tagName === "PRE") {
		e.target.classList.toggle("fullscreen-pre");
	}
}


// === UTILITIES ===
function generateMarkdown({ dsl, json, mermaid, js }, { includeDsl, includeJson, includeMermaid, includeJs }) {
	let result = "";

	if (includeDsl) {
		result += `# DSL Input\n\`\`\`yaml\n${dsl}\n\`\`\``;
	}

	if (includeJson && json !== null) {
		if (result.length) result += "\n\n";
		result += `# Parsed JSON\n\`\`\`json\n${json}\n\`\`\``;
	}

	if (includeMermaid && mermaid !== null) {
		if (result.length) result += "\n\n";
		result += `# Mermaid Diagram\n\`\`\`mermaid\n${mermaid}\n\`\`\``;
	}

	if (includeJs && js !== null) {
		if (result.length) result += "\n\n";
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


// === START APP ===
init();
