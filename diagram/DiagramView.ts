import { MarkdownPreviewView, TFile, ViewState, WorkspaceLeaf, MarkdownView, MarkdownSourceView } from "obsidian";

const DIAGRAM_VIEW_TYPE = "diagram";
const FILE_EXTENSIONS = ["svg"];

export default class DiagramView extends MarkdownView {
  isEditable: boolean;
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  async onload() {
    super.onload();
    this.contentEl.classList.add("diagram-view");
    if(this.actionsEl.firstChild != null)
    {
      this.actionsEl.removeChild(this.actionsEl.firstChild);
    }
  }

  async onLoadFile(file: TFile) {
    this.setViewData(`![[${file.path}]]`, true);
  }

  async onUnloadFile(file: TFile) {
    this.clear();
  }

  canAcceptExtension(extension: string) {
    return FILE_EXTENSIONS.contains(extension);
  }

  getViewType(): string {
    return DIAGRAM_VIEW_TYPE;
  }

  private async isDrawioFile(file: TFile) {
    const data = await this.app.vault.cachedRead(file);
    return this.isDrawioData(data);
  }

  private isDrawioData(data: string): boolean {
    if (typeof data !== "string") {
      return false;
    }
    const parser = new DOMParser();
    const diagramDocument = parser.parseFromString(data, "application/xml");

    const rootTagName = diagramDocument.documentElement.tagName.toLowerCase();

    if (rootTagName === "parsererror") {
      return false;
    }

    if (
      rootTagName === "mxfile" ||
      rootTagName === "mxgraph" ||
      rootTagName === "mxgraphmodel"
    ) {
      return true;
    }

    const attribute = diagramDocument.documentElement.getAttribute("content")
    if (attribute != null && rootTagName === "svg") {
      return this.isDrawioData(
        attribute
      );
    }

    return false;
  }
}
