import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Menu, MenuItem, TAbstractFile, TFolder, Vault, FileExplorerView, FileSystemAdapter, normalizePath, WorkspaceLeaf, EditableFileView, Platform } from 'obsidian';
import { around } from "monkey-around";
import * as Path from 'path';
import DiagramView from 'diagram/DiagramView';
// Remember to rename these classes and interfaces!

const DIAGRAM_VIEW_TYPE = "diagram";

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
	adapter: FileSystemAdapter;

	private registerViewFactory(
		View: new (leaf: WorkspaceLeaf, plugin: SparkPlugin) => EditableFileView,
		viewType: string
	) {
		this.registerView(viewType, (leaf) => new View(leaf, this));
	}

	private registerExtensionsReplace(extensions: string[], viewType: string) {
		/*
		The viewRegistry manages dictionaries of file extensions and view types.
		There's no stack, so if we replace one we should put the old one back
		*/
		for (const extension of extensions) {
			const prev = this.app.viewRegistry.typeByExtension[extension];
			this.app.viewRegistry.typeByExtension[extension] = viewType;
			// Put back the previous registration
			this.register(() => {
				this.app.viewRegistry.typeByExtension[extension] = prev;
			});
		}
		this.app.viewRegistry.trigger("extensions-updated");
	}

	async onload() {
		this.adapter = this.app.vault.adapter as FileSystemAdapter;
		await this.loadSettings();

		if(Platform.isMobile)
		{
			this.registerViewFactory(DiagramView, DIAGRAM_VIEW_TYPE);
			this.registerExtensionsReplace(["svg"], DIAGRAM_VIEW_TYPE);
			this.registerExtensionsReplace(["drawio"], DIAGRAM_VIEW_TYPE);
		}
		
		// 右键，在文件夹中搜索
		this.addFileMenu();

		this.app.workspace.onLayoutReady(() => {
			this.patchFileExplorerFolder();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	addFileMenu() {
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, fileOrFolder: TAbstractFile) => {
				if (fileOrFolder instanceof TFolder) {
					menu.addItem((item: MenuItem) => {
						item
							.setTitle("Import Attachment...")
							.setIcon("enter")
							.onClick(() => {
								const folderPath = fileOrFolder.path;
								this.openDialogToSelectAttachment(folderPath);
							});
					});
					menu.addItem((item: MenuItem) => {
						item
							.setTitle("Search in Folder")
							.setIcon("search")
							.onClick(() => {
								const folderPath = fileOrFolder.path;
								(this.app as any).internalPlugins
									.getPluginById("global-search")
									.instance.openGlobalSearch(`path:"${folderPath}" `);
							});
					});
				} else {
					menu.addItem((item: MenuItem) => {
						item
							.setTitle("复制Markdown链接")
							.setIcon("copy")
							.onClick(() => {
								const { clipboard } = require('electron');
								const text = `[${Path.basename(fileOrFolder.path, Path.extname(fileOrFolder.path))}](${fileOrFolder.path})`;
								clipboard.writeText(text);
								new Notice(`Copied ${text}`);
							});
					});
					menu.addItem((item: MenuItem) => {
						item
							.setTitle("复制路径")
							.setIcon("copy")
							.onClick(() => {
								const { clipboard } = require('electron');
								clipboard.writeText(fileOrFolder.path);
								new Notice(`Copied ${fileOrFolder.path}`);
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
								if (typeof key === 'string' && typeof value === 'string') {
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

	openDialogToSelectAttachment(folderPath: string) {
		const { dialog } = require('electron').remote
		dialog.showOpenDialog({
			title: '选择附件',
			properties: ['openFile']
		}).then((res: any) => {
			if (res.filePaths.length <= 0) return;
			this.addAttachmentToCurrentFolder(res.filePaths[0], folderPath)
		}).catch((err: any) => {
			console.error(err);
		})
	}

	async addAttachmentToCurrentFolder(attachmentPath: string, folderPath: string) {
		try {
			let file = await FileSystemAdapter.readLocalFile(attachmentPath);
			let path = normalizePath(Path.join(folderPath, Path.basename(attachmentPath)))
			await this.adapter.writeBinary(path, file);
			new Notice(`Add attachment "${path}" successfully`);
		} catch (err) {
			console.error(err)
			new Notice(`Add attachment error : ${err}`);
		}
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
