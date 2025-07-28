import { countIndent, parseNestedProps, parseMethodBody } from "./utils.js";

// Unified modifier parser for both props and methods
function parseModifiers(line, isMethod = false) {
	const match = line.match(/^([apsr]+)\s+(.*)$/i);
	if (!match) return { modifiers: null, restLine: line };

	const modLetters = match[ 1 ].toLowerCase().split('');
	const restLine = match[ 2 ];

	const allowed = isMethod ? [ 'a', 'p', 's', 'r' ] : [ 'p', 's', 'r' ];

	const filteredMods = modLetters.filter(m => allowed.includes(m));
	if (filteredMods.length === 0) return { modifiers: null, restLine: line };

	const modMap = {
		p: "private",
		s: "static",
		a: "abstract",
		r: "readonly",
	};

	// Build modifiers object only with present keys
	const modifiers = {};
	for (const mod of filteredMods) {
		if (!isMethod && mod === 'a') continue; // skip abstract for props
		modifiers[ modMap[ mod ] ] = true;
	}

	if (Object.keys(modifiers).length === 0) return { modifiers: null, restLine: line };

	return { modifiers, restLine };
}



// parser.js
function parseDSL(input) {
	const lines = input.split("\n");
	let currentClassName = null;
	let currentSectionName = null;
	const data = {
		classes: {},
		schemas: {},
		functions: [],
	};
	let currentLineIndex = 0;

	function addClassProperty(className, sectionName, property) {
		data.classes[ className ][ sectionName ].push(property);
	}

	function addSchemaProperty(schemaName, property) {
		data.schemas[ schemaName ].props.push(property);
	}

	function addInlineObjectProperty(targetName, sectionName, propName, nestedProps) {
		const prop = {
			name: propName,
			type: "object",
			typeProps: nestedProps,
			default: null,
			modifiers: {},
		};
		if (data.classes[ targetName ]) {
			addClassProperty(targetName, sectionName, prop);
		} else if (data.schemas[ targetName ]) {
			addSchemaProperty(targetName, prop);
		}
	}

	function addTypedProperty(targetName, sectionName, name, type, defaultVal, modifiers = {}) {
		const prop = {
			name: name.trim(),
			type: type.trim(),
			default: defaultVal !== undefined && defaultVal !== null ? defaultVal.trim() : null,
			modifiers,
		};
		if (data.classes[ targetName ]) {
			addClassProperty(targetName, sectionName, prop);
		} else if (data.schemas[ targetName ]) {
			addSchemaProperty(targetName, prop);
		}
	}

	function addSimpleProperty(targetName, sectionName, name, defaultVal, modifiers = {}) {
		const prop = {
			name: name.trim(),
			type: null,
			default: defaultVal !== undefined && defaultVal !== null ? defaultVal.trim() : null,
			modifiers,
		};
		if (data.classes[ targetName ]) {
			addClassProperty(targetName, sectionName, prop);
		} else if (data.schemas[ targetName ]) {
			addSchemaProperty(targetName, prop);
		}
	}

	function parseSectionHeader(line) {
		return line.endsWith(":") ? line.slice(0, -1) : null;
	}

	while (currentLineIndex < lines.length) {
		const rawLine = lines[ currentLineIndex ];
		const indentLevel = countIndent(rawLine);
		const line = rawLine.trim();

		if (!line) {
			currentLineIndex++;
			continue;
		}

		if (indentLevel === 0) {
			const schemaMatch = line.match(/^schema\s+(\w+):$/);
			if (schemaMatch) {
				currentClassName = schemaMatch[ 1 ];
				currentSectionName = null;
				if (!data.schemas[ currentClassName ]) {
					data.schemas[ currentClassName ] = { props: [] };
				}
				currentLineIndex++;
				continue;
			}

			const inheritanceMatch = line.match(/^(\w+)\s*>\s*(\w+):$/);
			if (inheritanceMatch) {
				currentClassName = inheritanceMatch[ 1 ];
				const baseClass = inheritanceMatch[ 2 ];
				currentSectionName = null;
				if (!data.classes[ currentClassName ]) {
					data.classes[ currentClassName ] = {
						baseClass: baseClass,
						props: [],
						parameters: [],
						methods: [],
					};
				}
				currentLineIndex++;
				continue;
			}

			const classNameCandidate = parseSectionHeader(line);
			if (classNameCandidate) {
				currentClassName = classNameCandidate;
				currentSectionName = null;
const reserved = ["functions", "props"]
				if (
					!reserved.includes(currentClassName) &&
					!data.classes[ currentClassName ] &&
					!data.schemas[ currentClassName ]
				) {
					data.classes[ currentClassName ] = {
						baseClass: null,
						props: [],
						parameters: [],
						methods: [],
					};
				}
				currentLineIndex++;
				continue;
			}
		}

		if (indentLevel === 1) {
			if (currentClassName === "functions") {
				data.functions.push(line);
				currentLineIndex++;
				continue;
			}

			const sectionNameCandidate = parseSectionHeader(line);
			if (sectionNameCandidate) {
				currentSectionName = sectionNameCandidate;
				currentLineIndex++;
				continue;
			}
		}

		if (indentLevel === 2 && currentClassName && currentSectionName) {
			if ([ "props", "parameters" ].includes(currentSectionName)) {
				// parse modifiers (no abstract for props)
				const { modifiers, restLine } = parseModifiers(line, false);

				// now parse the restLine as usual for props

				const inlineObjectMatch = restLine.match(/^([\w$]+)\s*:\s*{$/);
				if (inlineObjectMatch) {
					const propName = inlineObjectMatch[ 1 ];
					const nestedResult = parseNestedProps(lines, currentLineIndex + 1, indentLevel);
					const prop = {
						name: propName,
						type: "object",
						typeProps: nestedResult.props,
						default: null,
					};
					if (modifiers) prop.modifiers = modifiers;

					if (data.classes[ currentClassName ]) {
						addClassProperty(currentClassName, currentSectionName, prop);
					} else if (data.schemas[ currentClassName ]) {
						addSchemaProperty(currentClassName, prop);
					}
					currentLineIndex = nestedResult.nextIndex;
					continue;
				}

				const typedPropertyMatch = restLine.match(/^([\w$]+)\s*:\s*([^\=]+)(?:=\s*(.+))?$/);
				if (typedPropertyMatch) {
					const prop = {
						name: typedPropertyMatch[ 1 ].trim(),
						type: typedPropertyMatch[ 2 ].trim(),
						default: typedPropertyMatch[ 3 ]?.trim() ?? null,
					};
					if (modifiers) prop.modifiers = modifiers;

					if (data.classes[ currentClassName ]) {
						addClassProperty(currentClassName, currentSectionName, prop);
					} else if (data.schemas[ currentClassName ]) {
						addSchemaProperty(currentClassName, prop);
					}
					currentLineIndex++;
					continue;
				}

				const simplePropertyMatch = restLine.match(/^([\w$]+)(?:\s*=\s*(.+))?$/);
				if (simplePropertyMatch) {
					const prop = {
						name: simplePropertyMatch[ 1 ].trim(),
						type: null,
						default: simplePropertyMatch[ 2 ]?.trim() ?? null,
					};
					if (modifiers) prop.modifiers = modifiers;

					if (data.classes[ currentClassName ]) {
						addClassProperty(currentClassName, currentSectionName, prop);
					} else if (data.schemas[ currentClassName ]) {
						addSchemaProperty(currentClassName, prop);
					}
					currentLineIndex++;
					continue;
				}


			} else if (currentSectionName === "methods") {
				// parse modifiers (including abstract for methods)
				const { modifiers, restLine: methodLine } = parseModifiers(line, true);
				const methodBodyResult = parseMethodBody(lines, currentLineIndex + 1, indentLevel);

				const method = {
					signature: methodLine,
					body: methodBodyResult.body,
				};
				if (modifiers) method.modifiers = modifiers;

				data.classes[ currentClassName ].methods.push(method);

				currentLineIndex = methodBodyResult.nextIndex;
				continue;
			}

		}

		currentLineIndex++;
	}

	return data;
}

export { parseDSL };
