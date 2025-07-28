function generateMermaid(data) {
	const classes = data.classes || {};
	const schemas = data.schemas || {};
	const classLines = [];
	const inheritanceLines = [];
	const associationLines = [];

	// Single sanitize method for all Mermaid names
	function sanitize(name) {
		if (!name || typeof name !== "string") return "";
		let clean = name.replace(/^class\s+/i, "");
		// Replace invalid chars with underscore
		clean = clean.replace(/[^\w]/g, "_");
		// Ensure starts with letter or underscore (Mermaid requirement)
		if (!/^[a-zA-Z_]/.test(clean)) clean = "_" + clean;
		return clean;
	}

	function topoSort(classes) {
		const visited = new Set();
		const sorted = [];

		function visit(name) {
			if (!classes[ name ]) return;
			if (visited.has(name)) return;
			const base = classes[ name ].baseClass;
			if (base) visit(base);
			visited.add(name);
			sorted.push(name);
		}

		Object.keys(classes).forEach(visit);
		return sorted;
	}

	function isKnownType(typeName) {
		if (!typeName) return false;
		if (typeName.endsWith("[]")) typeName = typeName.slice(0, -2);
		const primitives = [ "string", "number", "boolean", "object", "any" ];
		return !primitives.includes(typeName) && (classes[ typeName ] || schemas[ typeName ]);
	}

	const orderedClassNames = topoSort(classes);

	// Render classes
	for (const className of orderedClassNames) {
		const cls = classes[ className ];
		const cleanClassName = sanitize(className);

		classLines.push(`class ${cleanClassName} {`);

		// Props
		if (cls.props && cls.props.length > 0) {
			for (const prop of cls.props) {
				const visibility = prop.modifiers?.private
					? "-"
					: prop.modifiers?.protected
						? "#"
						: "+";

				const staticLabel = prop.modifiers?.static ? "«static» " : "";

				// Sanitize type, handle object type simplification
				let type = prop.type === "object" ? "object" : (prop.type || "any");
				type = sanitize(type);

				const cleanPropName = sanitize(prop.name);

				classLines.push(`  ${visibility} ${staticLabel}${type} ${cleanPropName}`);
			}
		}

		// Methods
		if (cls.methods && cls.methods.length > 0) {
			for (const method of cls.methods) {
				let visibility = "+";
				if (method.modifiers) {
					if (method.modifiers.private) visibility = "-";
					else if (method.modifiers.protected) visibility = "#";
				}

				const staticLabel = method.modifiers?.static ? "static " : "";
				const abstractLabel = method.modifiers?.abstract ? "abstract " : "";

				const sig = method.signature || "unnamed()";

				classLines.push(`  ${visibility} ${staticLabel}${abstractLabel}${sig}`);
			}
		}

		classLines.push("}");
	}

	// Render schemas
	for (const [ schemaName, schema ] of Object.entries(schemas)) {
		const cleanSchemaName = sanitize(schemaName);
		classLines.push(`class ${cleanSchemaName} {`);
		if (schema.props && schema.props.length > 0) {
			for (const prop of schema.props) {
				const visibility = "+";
				let type = prop.type === "object" ? "object" : (prop.type || "any");
				type = sanitize(type);
				const cleanPropName = sanitize(prop.name);
				classLines.push(`  ${visibility} ${type} ${cleanPropName}`);
			}
		}
		classLines.push("}");
	}

	// Inheritance relations
	for (const [ className, cls ] of Object.entries(classes)) {
		if (cls.baseClass) {
			const from = sanitize(cls.baseClass);
			const to = sanitize(className);
			inheritanceLines.push(`${from} <|-- ${to}`);
		}
	}

	// Associations from classes
	for (const [ className, cls ] of Object.entries(classes)) {
		if (!cls.props) continue;
		for (const prop of cls.props) {
			let typeName = prop.type;
			if (typeName && typeName.endsWith("[]")) typeName = typeName.slice(0, -2);

			if (isKnownType(typeName)) {
				const from = sanitize(className);
				const to = sanitize(typeName);
				const assocLabel = sanitize(prop.name);
				associationLines.push(`${from} --> ${to} : ${assocLabel}`);
			}
		}
	}

	// Associations from schemas
	for (const [ schemaName, schema ] of Object.entries(schemas)) {
		if (!schema.props) continue;
		for (const prop of schema.props) {
			let typeName = prop.type;
			if (typeName && typeName.endsWith("[]")) typeName = typeName.slice(0, -2);

			if (isKnownType(typeName)) {
				const from = sanitize(schemaName);
				const to = sanitize(typeName);
				const assocLabel = sanitize(prop.name);
				associationLines.push(`${from} --> ${to} : ${assocLabel}`);
			}
		}
	}

	return [
		"classDiagram",
		"",
		...classLines,
		"",
		...inheritanceLines,
		"",
		...associationLines,
	].join("\n");
}

export { generateMermaid };



