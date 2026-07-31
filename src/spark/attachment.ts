import { FileSystemAdapter, Notice, normalizePath } from 'obsidian';
import * as Path from 'path';

/**
 * Show a native Electron open-file dialog and import the picked file
 * into `folderPath` inside the current vault.
 */
export function openDialogToSelectAttachment(
	adapter: FileSystemAdapter,
	folderPath: string,
): void {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const electron = require('electron');
	const dialog = electron.remote?.dialog ?? electron.dialog;
	if (!dialog) {
		new Notice('Electron dialog API not available.');
		return;
	}

	dialog
		.showOpenDialog({
			title: '选择附件',
			properties: ['openFile'],
		})
		.then((res: { filePaths: string[] }) => {
			if (!res.filePaths || res.filePaths.length <= 0) return;
			void addAttachmentToCurrentFolder(
				adapter,
				res.filePaths[0]!,
				folderPath,
			);
		})
		.catch((err: unknown) => {
			console.error(err);
		});
}

async function addAttachmentToCurrentFolder(
	adapter: FileSystemAdapter,
	attachmentPath: string,
	folderPath: string,
): Promise<void> {
	try {
		const file = await FileSystemAdapter.readLocalFile(attachmentPath);
		const path = normalizePath(
			Path.join(folderPath, Path.basename(attachmentPath)),
		);
		await adapter.writeBinary(path, file);
		new Notice(`Add attachment "${path}" successfully`);
	} catch (err) {
		console.error(err);
		new Notice(`Add attachment error : ${String(err)}`);
	}
}
