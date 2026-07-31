import { TFile, WorkspaceLeaf, MarkdownView } from 'obsidian';

export const DIAGRAM_VIEW_TYPE = 'diagram';
const FILE_EXTENSIONS = ['svg', 'drawio'];

export default class DiagramView extends MarkdownView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	override async onload() {
		super.onload();
		this.contentEl.classList.add('diagram-view');
		// `actionsEl` is a private field on the base MarkdownView – cast to any.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const actionsEl: HTMLElement | undefined = (this as any).actionsEl;
		if (actionsEl && actionsEl.firstChild != null) {
			actionsEl.removeChild(actionsEl.firstChild);
		}
	}

	override async onLoadFile(file: TFile) {
		this.setViewData(`![[${file.path}]]`, true);
	}

	override async onUnloadFile(_file: TFile) {
		this.clear();
	}

	override canAcceptExtension(extension: string) {
		return FILE_EXTENSIONS.contains(extension);
	}

	override getViewType(): string {
		return DIAGRAM_VIEW_TYPE;
	}
}
