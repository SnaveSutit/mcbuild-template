const fs = require('fs')
const pathlib = require('path')
const { resolveEnvVariables } = require('./util.js')
const term = require('terminal-kit').terminal

const MINECRAFT_PATH = resolveEnvVariables('%APPDATA%/.minecraft/')
const CURSEFORGE_INSTANCES_PATH = resolveEnvVariables('%APPDATA%/.curseforge/Instances')
const GDLAUNCHER_INSTANCES_PATH = resolveEnvVariables('%APPDATA%/.gdlauncher/instances')
const MODRINTH_INSTANCES_PATH = resolveEnvVariables('%APPDATA%/com.modrinth.theseus/profiles')

function gatherMinecraftProfileInformation() {
	// Vanilla Launcher
	let vanilla
	try {
		vanilla = JSON.parse(
			fs.readFileSync(pathlib.join(MINECRAFT_PATH, 'launcher_profiles.json'), {
				encoding: 'utf-8',
			})
		).profiles
	} catch (e) {
		console.error(
			"Failed to read the vanilla launcher's launcher_profiles.json. Is Minecraft installed?"
		)
		console.error(e)
		return
	}
	vanilla = Object.values(vanilla)
		.map((profile) => {
			return {
				name: profile.name,
				path: profile.gameDir || MINECRAFT_PATH,
			}
		})
		.filter((profile) => profile.name && fs.existsSync(profile.path))
	vanilla.splice(
		0,
		0,
		{
			name: 'Release',
			path: MINECRAFT_PATH,
		},
		{
			name: 'Latest Snapshot',
			path: MINECRAFT_PATH,
		}
	)
	// CurseForge
	let curseforge = []
	if (fs.existsSync(CURSEFORGE_INSTANCES_PATH)) {
		for (const folder of fs.readdirSync(CURSEFORGE_INSTANCES_PATH)) {
			const path = pathlib.join(CURSEFORGE_INSTANCES_PATH, folder)
			console.log(path)
			const json = JSON.parse(fs.readFileSync(pathlib.join(path, 'minecraftinstance.json')), {
				encoding: 'utf-8',
			})
			curseforge.push({
				name: json.name,
				path,
			})
		}
	}
	// GDLauncher
	let gdlauncher = []
	if (fs.existsSync(GDLAUNCHER_INSTANCES_PATH)) {
		for (const folder of fs.readdirSync(GDLAUNCHER_INSTANCES_PATH)) {
			const path = pathlib.join(GDLAUNCHER_INSTANCES_PATH, folder)
			gdlauncher.push({
				name: folder,
				path,
			})
		}
	}
	let modrinth = []
	if (fs.existsSync(MODRINTH_INSTANCES_PATH)) {
		for (const folder of fs.readdirSync(MODRINTH_INSTANCES_PATH)) {
			const path = pathlib.join(MODRINTH_INSTANCES_PATH, folder)
			const json = JSON.parse(fs.readFileSync(pathlib.join(path, 'profile.json')), {
				encoding: 'utf-8',
			})
			modrinth.push({
				name: json.metadata.name,
				path,
			})
		}
	}
	return { vanilla, modrinth, curseforge, gdlauncher }
}

async function askUserToChooseLauncher(profiles) {
	const launchers = Object.keys(profiles)
		.filter((launcher) => profiles[launcher].length > 0)
		.map((launcher) => launcher[0].toUpperCase() + launcher.slice(1))

	term.green('\nSelect a launcher:')
	const selectedLauncher = (
		await term.singleColumnMenu(launchers).promise
	).selectedText.toLowerCase()

	return profiles[selectedLauncher]
}

async function askUserToChooseProfile(launcher) {
	term.green('\nSelect a profile:')
	let items = launcher.map((profile) => profile.name)
	const selectedIndex = (await term.singleColumnMenu(items).promise).selectedIndex
	return launcher[selectedIndex]
}

async function askUserToChooseWorld(profile) {
	const worlds = fs.readdirSync(pathlib.join(profile.path, 'saves'))
	if (worlds.length === 0) {
		term.red('The selected profile has no worlds.\n')
		process.exit(1)
	}
	term.green('\nSelect a world to inject into:')
	const selectedIndex = (await term.singleColumnMenu(worlds).promise).selectedIndex
	return pathlib.join(profile.path, 'saves', worlds[selectedIndex])
}

async function main() {
	const profiles = gatherMinecraftProfileInformation()
	const selectedLauncher = await askUserToChooseLauncher(profiles)
	// console.log(selectedLauncher)
	const selectedProfile = await askUserToChooseProfile(selectedLauncher)
	// console.log(selectedProfile)
	const selectedWorldPath = await askUserToChooseWorld(selectedProfile)
	// console.log(selectedWorldPath)

	let datapackName
	while (!datapackName) {
		term.green('\nData Pack Symlink Name: ')
		datapackName = await term.inputField({}).promise
	}

	const symlinkPath = pathlib.join(selectedWorldPath, 'datapacks', datapackName)

	term.green('\nSelected Data Pack Symlink Name: ')
		.cyan(datapackName)
		.green('\nSelected World: ')
		.cyan(selectedWorldPath)
		.green('\nFinal Symlink Path: ')
		.cyan(symlinkPath)
		.green('\nInject into selected world? [y/n]: ')
	const confirm = await term.yesOrNo({ yes: ['y'], no: ['n'] }).promise
	if (!confirm) {
		term.red('\nInjection Cancelled.\n')
		process.exit(0)
	}
	term.green('\nInjecting into world...\n')

	fs.symlinkSync(process.cwd(), symlinkPath, 'junction')

	term.green('\nInjection Complete.\n')
	process.exit(0)
}

void main()
