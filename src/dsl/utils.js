
// Support tabs indent
function countIndent(line) {
	let count = 0;
	for (const ch of line) {
		if (ch === ' ') count++;
		else if (ch === '\t') count += 2; // treat tab as 2 spaces indent
		else break;
	}
	return Math.floor(count / 2);
}
function parseNestedProps(lines, startLineIndex, baseIndentLevel) {
	const properties = [];
	let currentIndex = startLineIndex;

	function addProperty({ name, type = null, typeProps = null, defaultValue = null }) {
		properties.push({
			name,
			type,
			typeProps,
			default: defaultValue !== undefined && defaultValue !== null ? defaultValue.trim() : null,
		});
	}

	while (currentIndex < lines.length) {
		const line = lines[ currentIndex ];
		if (!line.trim()) {
			currentIndex++;
			continue;
		}

		const indentLevel = countIndent(line);
		if (indentLevel <= baseIndentLevel) break;

		const trimmedLine = line.trim();

		// Inline object property
		const inlineObjectMatch = trimmedLine.match(/^([\w$]+)\s*:\s*{$/);
		if (inlineObjectMatch) {
			const propertyName = inlineObjectMatch[ 1 ];
			const nestedResult = parseNestedProps(lines, currentIndex + 1, indentLevel);
			addProperty({
				name: propertyName,
				type: "object",  // changed from "inlineObject"
				typeProps: nestedResult.props,
				defaultValue: null,
			});
			currentIndex = nestedResult.nextIndex;
			continue;
		}

		const typedPropertyMatch = trimmedLine.match(/^([\w$]+)\s*:\s*([\w\[\]]+)(?:\s*=\s*(.+))?$/);
		if (typedPropertyMatch) {
			addProperty({
				name: typedPropertyMatch[ 1 ],
				type: typedPropertyMatch[ 2 ],
				defaultValue: typedPropertyMatch[ 3 ],
			});
			currentIndex++;
			continue;
		}

		const simplePropertyMatch = trimmedLine.match(/^([\w$]+)(?:\s*=\s*(.+))?$/);
		if (simplePropertyMatch) {
			addProperty({
				name: simplePropertyMatch[ 1 ],
				defaultValue: simplePropertyMatch[ 2 ],
			});
			currentIndex++;
			continue;
		}

		currentIndex++;
	}

	return {
		props: properties,
		nextIndex: currentIndex,
	};
}

function parseMethodLine(line) {
	let modifiers = {};
	let methodLine = line;

	while (/^[aspr]\s/.test(methodLine)) {
		const mod = methodLine[ 0 ];
		modifiers = {
			...modifiers,
			[ { a: "abstract", s: "static", p: "private", r: "readonly" }[ mod ] ]: true,
		};
		methodLine = methodLine.slice(2).trimStart();
	}

	return {
		modifiers,
		methodLine,
	};
}

function parseMethodBody(lines, startLineIndex, baseIndentLevel) {
	const bodyLines = [];
	let currentIndex = startLineIndex;

	while (currentIndex < lines.length) {
		const line = lines[ currentIndex ];
		if (!line.trim()) {
			bodyLines.push("");
			currentIndex++;
			continue;
		}

		const indentLevel = countIndent(line);
		if (indentLevel <= baseIndentLevel) break;

		bodyLines.push(line.slice(baseIndentLevel));
		currentIndex++;
	}

	return {
		body: bodyLines.join("\n"),
		nextIndex: currentIndex,
	};
}

export {countIndent,parseMethodLine, parseNestedProps, parseMethodBody}