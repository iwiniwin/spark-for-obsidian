import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Menu, MenuItem, TAbstractFile, TFolder } from 'obsidian';

// Remember to rename these classes and interfaces!

interface SparkPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: SparkPluginSettings = {
	mySetting: 'default'
}

export default class SparkPlugin extends Plugin {
	settings: SparkPluginSettings;

	async onload() {
		await this.loadSettings();

		// 右键，在文件夹中搜索
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

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
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
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
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
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
