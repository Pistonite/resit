import { ReduxGlobalState } from "store/store";
import { ApplicationState } from "./type";
import { RouteSplit } from "data/split";
import { ResourceError, RouteResources } from "data/resource";
import { getGlobalActionIndex } from "store/routing/selectors";
import { ActionResource } from "data/resource_delta";

function getApplicationState(state: ReduxGlobalState): ApplicationState {
	return state.applicationState;
}

export function getInfo(state: ReduxGlobalState): string {
	return getApplicationState(state).info;
}

export function isSideSectionShrunk(state: ReduxGlobalState): boolean {
	return getApplicationState(state).shrinkSide;
}

export function isResourcesSectionCollapsed(state: ReduxGlobalState): boolean {
	return getApplicationState(state).resourcesCollapsed;
}

export function isHeaderCollapsed(state: ReduxGlobalState): boolean {
	return getApplicationState(state).headerCollapsed;
}

export function isSideSectionCollapsed(state: ReduxGlobalState): boolean {
	return getApplicationState(state).sideCollapsed;
}

export function isEditingNav(state: ReduxGlobalState): boolean {
	return getApplicationState(state).editingNav;
}

export function isEditingActions(state: ReduxGlobalState): boolean {
	return getApplicationState(state).editingActions;
}

export function isEditingItems(state: ReduxGlobalState): boolean {
	return getApplicationState(state).editingItems;
}

export function getSplitClipboard(state: ReduxGlobalState): RouteSplit | undefined {
	return getApplicationState(state).splitClipboard;
}

function getRouteResources(state: ReduxGlobalState): RouteResources {
	return getApplicationState(state).resources;
}

export function getResourceCalcProgress(state: ReduxGlobalState): number {
	return getRouteResources(state).progress;
}

export function getResourceCalcError(state: ReduxGlobalState): ResourceError {
	return getRouteResources(state).error;
}

export function getActionResourceByGlobalIndex(state: ReduxGlobalState, globalIndex: number): ActionResource | undefined {
	return getRouteResources(state).content[globalIndex];
}

export function getActionResource(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): ActionResource | undefined {
	return getActionResourceByGlobalIndex(state, getGlobalActionIndex(state, branchIndex, splitIndex, actionIndex));
}

export function isShowingHelp(state: ReduxGlobalState): boolean {
	return getApplicationState(state).showHelp;
}