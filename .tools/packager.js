const fs = require('fs')
const zip = require('zip-lib')
const pathlib = require('path')

const MCMETA_PATH = './pack.mcmeta'
const ICON_PATH = './pack.png'
const DATA_PATH = './data'

const DEFAULT_OUTPUT_PATH = './dist'
const DEFAULT_OUTPUT_FILE = 'datapack.zip'

function packageDataPack(options) {
	options ??= {}
	options.output_file ??= DEFAULT_OUTPUT_FILE
	options.output_path ??= DEFAULT_OUTPUT_PATH

	if (!process.argv.includes('-clean')) {
		console.log(
			'WARNING! It is recommended to use the -clean flag when packaging a data pack to avoid including old/leftover files.'
		)
	}
	console.log('Packaging Data Pack...')

	const zipFile = new zip.Zip()
	if (!fs.existsSync(MCMETA_PATH)) {
		console.log('ERROR: Missing pack.mcmeta file!')
		process.exit(1)
	}
	zipFile.addFile('./pack.mcmeta')

	if (!fs.existsSync(DATA_PATH)) {
		console.log('ERROR: Missing data folder!')
		process.exit(1)
	}
	zipFile.addFolder('./data')

	if (fs.existsSync(ICON_PATH)) {
		zipFile.addFile('./pack.png')
	}
	if (fs.existsSync(options.output_path)) {
		fs.rmSync(options.output_path, { recursive: true })
	}
	fs.mkdirSync(options.output_path, { recursive: true })
	zipFile.archive(pathlib.join(options.output_path, options.output_file))
}

module.exports = { packageDataPack }
