function generateJS(data, options = { enableLogging: true }) {
	const lines = [];

	// === Logger scaffold ===
	if (options.enableLogging) {
		const logger = [
			`let logger = true;`,
			`function log(message, ...args) {`,
			`\tif (logger) {`,
			`\t\tconst now = new Date();`,
			`\t\tconst timestamp = now.toLocaleTimeString('en-US', { hour12: false });`,
			`\t\tconsole.log(\`[\${timestamp}] \${message}\`, ...args);`,
			`\t}`,
			`}\n`
		];
		lines.push(...logger);
	}

	// === Helpers ===
	const getDefaultValue = (prop) => {
		if (prop.type === 'object' && Array.isArray(prop.typeProps)) {
			return `{ ${prop.typeProps.map(p => `${p.name}: ${p.default ?? 'null'}`).join(', ')} }`;
		}
		if (prop.default !== null) return prop.default;
		if (/^[A-Z]/.test(prop.type)) return `new ${prop.type}()`;
		return 'null';
	};

	const parseFunctionSignature = (signature) => {
		const name = signature.split('(')[ 0 ].trim();
		const rawParams = signature.match(/\(([^)]*)\)/)?.[ 1 ] || '';

		const paramList = rawParams
			.split(',')
			.map(p => p.trim().split(':')[ 0 ].trim())
			.filter(Boolean);

		const paramStr = paramList.join(', ');
		const logParamStr = paramList.length ? ', ' + paramList.join(', ') : '';

		return { name, paramStr, logParamStr, paramList };
	};

	const renderPropDeclaration = (prop) => {
		const { name, modifiers = {}, default: def } = prop;
		if (modifiers.static) return `\tstatic ${name} = ${def ?? 'null'};`;
		if (modifiers.private) return `\t#${name};`;
		if (modifiers.readonly) return `\tget ${name}() { return this._${name}; }`;
		return null;
	};

	const renderPropAssignment = (prop) => {
		const { name, modifiers = {} } = prop;
		if (modifiers.static) return null;

		const isPrivate = modifiers.private;
		const isReadonly = modifiers.readonly;
		const internalName = isReadonly ? `_${name}` : (isPrivate ? `#${name}` : name);

		const defaultVal = getDefaultValue(prop);

		if (isPrivate) {
			return `\t\tthis.${internalName} = ${defaultVal};`;
		}

		return `\t\tthis.${internalName} = args.${name} ?? ${defaultVal};`;
	};

	const renderPrivateMethodFields = (methods) =>
		methods
			.filter((m) => m.modifiers?.private)
			.map((m) => {
				const { name } = parseFunctionSignature(m.signature);
				return `\t#${name};`;
			});

	const renderMethod = (method, className) => {
		const mods = method.modifiers || {};
		const { name, paramStr, logParamStr } = parseFunctionSignature(method.signature);

		const fullSig = `${mods.static ? 'static ' : ''}${mods.private ? '#' : ''}${name}(${paramStr})`;

		let bodyLines;
		if (mods.abstract) {
			bodyLines = [ `throw new Error("Method ${name}() must be implemented in child classes");` ];
		} else if (method.body && method.body.trim() !== '') {
			bodyLines = method.body.split('\n').map(line => line.trim());
		} else {
			bodyLines = [ `// TODO Implement ${name}` ];
		}

		const body = [];
		if (options.enableLogging) {
			body.push(`\t\tlog("Calling ${name} from ${className}"${logParamStr});`);
		}
		body.push(...bodyLines.map(line => `\t\t${line}`));

		return [ `\t${fullSig} {`, ...body, `\t}` ];
	};

	const renderClass = (className, cls) => {
		const result = [];
		const base = cls.baseClass ? ` extends ${cls.baseClass}` : '';
		result.push(`class ${className}${base} {`);

		cls.props.forEach(p => {
			const decl = renderPropDeclaration(p);
			if (decl) result.push(decl);
		});
		result.push(...renderPrivateMethodFields(cls.methods));

		result.push(`\tconstructor(args = {}) {`);
		if (cls.baseClass) result.push(`\t\tsuper(args);`);
		cls.props.forEach(p => {
			const assign = renderPropAssignment(p);
			if (assign) result.push(assign);
		});
		result.push(`\t}`);

		cls.methods.forEach(method => {
			result.push(...renderMethod(method, className));
		});

		result.push(`}\n`);
		return result;
	};

	const renderSchema = (name, schema) => {
		const result = [ `// Schema: ${name}`, `const ${name} = {` ];
		schema.props.forEach(p => result.push(`\t${p.name}: ${p.default ?? 'null'},`));
		result.push(`};\n`);
		return result;
	};

	const renderGlobalFunction = (fn) => {
		const signature = typeof fn === 'string' ? fn : fn.name;
		const { name, paramStr, logParamStr } = parseFunctionSignature(signature);

		const body = typeof fn === 'object' && fn.body
			? fn.body.split('\n').map(line => `\t${line.trim()}`)
			: [ `\t// TODO Implement ${name}` ];

		const result = [ `function ${name}(${paramStr}) {` ];
		if (options.enableLogging) {
			result.push(`\tlog("Calling ${name} from global function"${logParamStr});`);
		}
		result.push(...body, `}\n`);
		return result;
	};

	// === Render All ===
	Object.entries(data.classes).forEach(([ name, cls ]) => lines.push(...renderClass(name, cls)));
	Object.entries(data.schemas).forEach(([ name, schema ]) => lines.push(...renderSchema(name, schema)));
	data.functions.forEach(fn => lines.push(...renderGlobalFunction(fn)));

	return lines.join('\n');
}

export { generateJS };
