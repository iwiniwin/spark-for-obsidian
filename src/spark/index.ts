import { Platform } from 'obsidian';
import type MyPlugin from '../main';
import DiagramView, { DIAGRAM_VIEW_TYPE } from './DiagramView';
import { registerSparkFileMenu } from './fileMenu';

/**
 * Wire up every Spark feature. Call once from MyPlugin.onload().
 *
 * @param plugin The plugin instance.
 */
export function initSparkFeatures(plugin: MyPlugin): void {
	try {
		// Mobile: reuse MarkdownView for `.svg` / `.drawio` so they render as diagrams
		if (Platform.isMobile) {
			plugin.registerView(
				DIAGRAM_VIEW_TYPE,
				(leaf) => new DiagramView(leaf),
			);
			registerExtensionsReplace(plugin, ['svg'], DIAGRAM_VIEW_TYPE);
			registerExtensionsReplace(plugin, ['drawio'], DIAGRAM_VIEW_TYPE);
		}

		// Right-click menu items (file / folder)
		registerSparkFileMenu(plugin);
	} catch (err) {
		console.error('[spark] initSparkFeatures failed:', err);
		// Re-throw so Obsidian still marks the load as failed, but with
		// a proper Error instance instead of an opaque `{}`.
		throw err instanceof Error ? err : new Error(String(err));
	}
}

/**
 * Replace the view type bound to a set of file extensions, restoring the
 * previous binding when the plugin unloads.
 */
function registerExtensionsReplace(
	plugin: MyPlugin,
	extensions: string[],
	viewType: string,
): void {
	const registry = (plugin.app as unknown as {
		viewRegistry: {
			typeByExtension: Record<string, string>;
			trigger: (event: string) => void;
		};
	}).viewRegistry;
	for (const extension of extensions) {
		const prev = registry.typeByExtension[extension];
		registry.typeByExtension[extension] = viewType;
		plugin.register(() => {
			if (prev === undefined) {
				delete registry.typeByExtension[extension];
			} else {
				registry.typeByExtension[extension] = prev;
			}
		});
	}
	registry.trigger('extensions-updated');
}
