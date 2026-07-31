import {
	Menu,
	MenuItem,
	Notice,
	Plugin,
	TAbstractFile,
	TFolder,
} from 'obsidian';
import * as Path from 'path';
import { openDialogToSelectAttachment } from './attachment';

/**
 * Register a "file-menu" listener that adds Spark's custom context-menu items.
 * Returns nothing – the event lifetime is managed by the plugin via registerEvent.
 */
export function registerSparkFileMenu(plugin: Plugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on(
			'file-menu',
			(menu: Menu, fileOrFolder: TAbstractFile) => {
				if (fileOrFolder instanceof TFolder) {
					addFolderMenu(plugin, menu, fileOrFolder);
				} else {
					addFileMenu(menu, fileOrFolder);
				}
			},
		),
	);
}

function addFolderMenu(plugin: Plugin, menu: Menu, folder: TFolder): void {
	menu.addItem((item: MenuItem) => {
		item.setTitle('Import Attachment...')
			.setIcon('enter')
			.onClick(() => {
				const adapter = plugin.app.vault.adapter as import('obsidian').FileSystemAdapter;
				openDialogToSelectAttachment(adapter, folder.path);
			});
	});
	menu.addItem((item: MenuItem) => {
		item.setTitle('Search in Folder')
			.setIcon('search')
			.onClick(() => {
				const internalPlugins = (
					plugin.app as unknown as {
						internalPlugins: {
							getPluginById: (id: string) => {
								instance: {
									openGlobalSearch: (q: string) => void;
								};
							};
						};
					}
				).internalPlugins;
				internalPlugins
					.getPluginById('global-search')
					.instance.openGlobalSearch(`path:"${folder.path}" `);
			});
	});
}

function addFileMenu(menu: Menu, file: TAbstractFile): void {
	menu.addItem((item: MenuItem) => {
		item.setTitle('复制Markdown链接')
			.setIcon('copy')
			.onClick(() => {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const { clipboard } = require('electron');
				const text = `[${Path.basename(
					file.path,
					Path.extname(file.path),
				)}](${file.path})`;
				clipboard.writeText(text);
				new Notice(`Copied ${text}`);
			});
	});
	menu.addItem((item: MenuItem) => {
		item.setTitle('复制路径')
			.setIcon('copy')
			.onClick(() => {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const { clipboard } = require('electron');
				clipboard.writeText(file.path);
				new Notice(`Copied ${file.path}`);
			});
	});
}
