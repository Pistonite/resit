import { RouteSplit } from "data/split";
import { RouteResources } from "data/resource";

export type ApplicationState = {
	info: string,
	sideCollapsed: boolean,
	headerCollapsed: boolean,
	resourcesCollapsed: boolean,
	showHelp: boolean,
	shrinkSide: boolean,
	editingNav: boolean,
	editingItems: boolean,
	editingActions: boolean,
	splitClipboard: RouteSplit | undefined,
	resources: RouteResources,
}