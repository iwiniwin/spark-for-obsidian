import "obsidian";
import Sortable from "sortablejs";

declare module "sortablejs" {
    interface SortableEvent extends Event {
      items: HTMLElement[];
    }
}

declare module "obsidian" {
    export interface ViewRegistry {
        viewByType: Record<string, (leaf: WorkspaceLeaf) => unknown>;
        isExtensionRegistered(extension: string): boolean;
    }
    export interface App {
        viewRegistry: ViewRegistry;
    }
    export interface FileExplorerView extends View {
        dom: FileExplorerViewDom;
        createFolderDom(folder: TFolder): FileExplorerFolder;
        headerDom: FileExplorerHeader;
        sortOrder: string;
        hasCustomSorter?: boolean;
        dragEnabled: boolean;
        setSortOrder(order: String): void;
      }
      export interface FileExplorerView extends View {
        dom: FileExplorerViewDom;
        createFolderDom(folder: TFolder): FileExplorerFolder;
        headerDom: FileExplorerHeader;
        sortOrder: string;
        hasCustomSorter?: boolean;
        dragEnabled: boolean;
        setSortOrder(order: String): void;
      }
      interface FileExplorerHeader {
        addSortButton(sorter: (sortType: string) => void, sortOrder: () => string): void;
        navHeaderEl: HTMLElement;
      }
      interface FileExplorerFolder {}
      export interface FileExplorerViewDom {
        infinityScroll: InfinityScroll;
        navFileContainerEl: HTMLElement;
      }
      export interface InfinityScroll {
        rootEl: RootElements;
        scrollEl: HTMLElement;
        filtered: boolean;
        filter: string;
        compute(): void;
      }
      export interface VirtualChildren {
        children: ChildElement[];
        _children: ChildElement[];
        owner: ChildElement
      }
      export interface RootElements {
        childrenEl: HTMLElement;
        children: ChildElement[];
        _children: ChildElement[];
        vChildren: VirtualChildren;
        file: TAbstractFile;
        sorter: Sortable;
        fileExplorer: FileExplorerView;
      }
      export interface ChildElement {
        el: HTMLElement;
        file: TAbstractFile;
        fileExplorer: FileExplorerView;
        titleEl: HTMLElement;
        titleInnerEl: HTMLElement;
        children?: ChildElement[];
        vChildren: VirtualChildren;
        childrenEl?: HTMLElement;
        sorter?: Sortable;
      }
}