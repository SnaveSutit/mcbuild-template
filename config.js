// MCBuild project template created by SnaveSutit.

const fs = require('fs')
const { packageDataPack } = require('./.tools/packager.js')

module.exports = {
	global: {
		preBuild: function preBuild() {
			if (process.argv.includes('-clean')) {
				console.log('Performing Clean Build...')
				if (fs.existsSync('./data')) {
					fs.rmSync('./data', { recursive: true })
				}
			}
		},
		postBuild: function postBuild() {
			if (process.argv.includes('-package')) {
				packageDataPack(module.exports.mc.packagerOptions)
			}
		},
	},
	mc: {
		dev: true,
		header: '#built using mc-build (https://github.com/mc-build/mc-build)',
		internalScoreboard: 'mcb.i',
		generatedDirectory: '_generated',
		globalImports: [],
		rootNamespace: null,
		packagerOptions: {
			output_file: 'datapack.zip',
			output_folder: './dist',
		},
	},
}
