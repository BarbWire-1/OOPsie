function generateJS(data) {
	const lines = [];

	// === Logger scaffold ===
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

	// === Helpers ===
	const getDefaultValue = (prop) => {
		if (prop.type === 'object' && Array.isArray(prop.typeProps)) {
			return `{ ${prop.typeProps.map(p => `${p.name}: ${p.default ?? 'null'}`).join(', ')} }`;
		}
		if (prop.default !== null) return prop.default;
		if (/^[A-Z]/.test(prop.type)) return `new ${prop.type}()`;
		return 'null';
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
				const name = m.signature.split('(')[ 0 ];
				return `\t#${name};`;
			});

	// Clean param names by stripping out type annotations
	const extractParamNames = (sig) => {
		const match = sig.match(/\(([^)]*)\)/);
		if (!match) return [];
		return match[ 1 ]
			.split(',')
			.map(p => p.trim().split(':')[ 0 ].trim()) // Strip type after colon
			.filter(Boolean);
	};

	const renderMethod = (method, className) => {
		const mods = method.modifiers || {};
		const name = method.signature.split('(')[ 0 ];

		// Clean parameter list without types
		const paramStrRaw = method.signature.match(/\(([^)]*)\)/)?.[ 1 ] || '';
		const paramStrClean = paramStrRaw
			.split(',')
			.map(p => p.trim().split(':')[ 0 ].trim()) // Remove types here too
			.join(', ');

		const fullSig = `${mods.static ? 'static ' : ''}${mods.private ? '#' : ''}${name}(${paramStrClean})`;

		const bodyLines = method.body && method.body.trim() !== ''
			? method.body.split('\n').map(line => line.trim())
			: [];

		const paramsForLog = extractParamNames(method.signature);
		const paramList = paramsForLog.length ? ', ' + paramsForLog.join(', ') : '';

		const body = mods.abstract
			? [ `\t\tthrow new Error("Method ${name}() must be implemented in child classes");` ]
			: [
				`\t\tlog("Calling ${name} from ${className}"${paramList});`,
				...(bodyLines.length > 0
					? bodyLines.map(line => `\t\t${line}`)
					: [ `\t\t// TODO Implement ${name}` ])
			];

		return [ `\t${fullSig} {`, ...body, `\t}` ];
	};

	const renderClass = (className, cls) => {
		const result = [];
		const base = cls.baseClass ? ` extends ${cls.baseClass}` : '';
		result.push(`class ${className}${base} {`);

		// Fields & Private Methods
		cls.props.forEach(p => {
			const decl = renderPropDeclaration(p);
			if (decl) result.push(decl);
		});
		result.push(...renderPrivateMethodFields(cls.methods));

		// Constructor
		result.push(`\tconstructor(args = {}) {`);
		if (cls.baseClass) result.push(`\t\tsuper(args);`);
		cls.props.forEach(p => {
			const assign = renderPropAssignment(p);
			if (assign) result.push(assign);
		});
		result.push(`\t}`);

		// Methods
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
		const name = typeof fn === 'string' ? fn.replace(/\(\)$/, '') : fn.name;
		return [
			`function ${name}() {`,
			`\tlog("Calling ${name} from global function");`,
			`\t// TODO Implement ${name}`,
			`}\n`
		];
	};

	// === Render All ===
	Object.entries(data.classes).forEach(([ name, cls ]) => lines.push(...renderClass(name, cls)));
	Object.entries(data.schemas).forEach(([ name, schema ]) => lines.push(...renderSchema(name, schema)));
	data.functions.forEach(fn => lines.push(...renderGlobalFunction(fn)));

	return lines.join('\n');
}

export { generateJS };
