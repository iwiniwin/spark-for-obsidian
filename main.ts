import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Menu, MenuItem, TAbstractFile, TFolder, Vault, FileExplorerView } from 'obsidian';
import { around } from "monkey-around";
// Remember to rename these classes and interfaces!

let Collator = new Intl.Collator(undefined, {
	usage: "sort",
	sensitivity: "base",
	numeric: true,
}).compare;

interface SparkPluginSettings {
	customSortConfig: string;
}

const DEFAULT_SETTINGS: SparkPluginSettings = {
	customSortConfig: ''
}

export default class SparkPlugin extends Plugin {
	settings: SparkPluginSettings;

	async onload() {
		await this.loadSettings();

		// 右键，在文件夹中搜索
		this.addSearchInFolder();

		this.app.workspace.onLayoutReady(() => {
			this.patchFileExplorerFolder();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	addSearchInFolder() {
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, fileOrFolder: TAbstractFile) => {
				if (fileOrFolder instanceof TFolder) {
					menu.addItem((item: MenuItem) => {
						item
							.setTitle("Search in folder")
							.setIcon("search")
							.onClick(() => {
								const folderPath = fileOrFolder.path;
								(this.app as any).internalPlugins
									.getPluginById("global-search")
									.instance.openGlobalSearch(`path:"${folderPath}" `);
							});
					});
				}
			})
		);
	}

	// 自定义文件夹排序
	patchFileExplorerFolder() {
		let settings = this.settings;
		let leaf = this.app.workspace.getLeaf(true);
		let fileExplorer = this.app.viewRegistry.viewByType["file-explorer"](leaf) as FileExplorerView;
		// @ts-ignore
		let tmpFolder = new TFolder(Vault, "");
		let Folder = fileExplorer.createFolderDom(tmpFolder).constructor;
		this.register(
			around(Folder.prototype, {
				sort(old: any) {
					return function (...args: any[]) {
						let ret = old.call(this, ...args);
						let customSortConfig = settings.customSortConfig;
						if (customSortConfig === '' || this.file.path === "/") {
							let defaultOrder = 1000;
							let arr = customSortConfig.split("\n"); // 将字符串分割为数组
							const map = new Map();
							arr.forEach(item => {
								const [key, value] = item.split(":");
								if(typeof key === 'string' && typeof value === 'string') {
									map.set(key.trim(), parseInt(value.trim())); 
								}
							});

							this.vChildren.sort(function (first: any, second: any) {
								let firstName = first.file.name;
								let secondName = second.file.name;
								let firstOrder = map.has(firstName) ? map.get(firstName) : defaultOrder;
								let secondOrder = map.has(secondName) ? map.get(secondName) : defaultOrder;
								return firstOrder < secondOrder ? -1 : firstOrder == secondOrder ? 0 : 1;
							});
						}
						return ret;
					};
				},
			})
		);
		leaf.detach();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: SparkPlugin;

	constructor(app: App, plugin: SparkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Spark Plugin' });

		new Setting(containerEl)
			.setName('Custom Root Directory Sorting')
			.setDesc(
				`Allows to sort through customized root directory by configuration`
			)
			.addTextArea((text) =>
				text.setValue(this.plugin.settings.customSortConfig).onChange((value) => {
					this.plugin.settings.customSortConfig = value;
					this.plugin.saveSettings();
				})
			);
	}
}
