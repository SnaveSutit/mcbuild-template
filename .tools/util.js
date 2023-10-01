function resolveEnvVariables(str) {
	return str.replace(
		/%([^%]+)%|\$([A-Z_]+[A-Z0-9_]*)|\${([A-Z0-9_]*)}/gi,
		(_, a, b) => process.env[a || b]
	)
}

module.exports = { resolveEnvVariables }
