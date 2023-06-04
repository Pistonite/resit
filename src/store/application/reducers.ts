import { PayloadAction } from "@reduxjs/toolkit";
import { ReduxGlobalState } from "store/store";
import {
	getResourceCalcProgress,
	getResourceCalcError
} from "./selectors";
import { RouteSplit } from "data/split";
import { getActiveBranch, getActiveSplit, getGlobalActionIndex } from "store/routing/selectors";
import { ResourceError } from "data/resource";
import { ActionResource } from "data/resource_delta";

function markResourceDirty(state: ReduxGlobalState, globalIndex: number): void {
	const currentProgress = getResourceCalcProgress(state);
	if (currentProgress >= 0 && currentProgress < globalIndex) {
		return;
	}
	state.applicationState.resources.progress = globalIndex;
	const error = getResourceCalcError(state);
	if (error !== null) {
		const { branch, split, action } = error;
		const errorGlobalIndex = getGlobalActionIndex(state, branch, split, action);
		if (errorGlobalIndex >= globalIndex) {
			state.applicationState.resources.error = null;
		}
	}
}

export default {
	setHeaderCollapsed(state: ReduxGlobalState, action: PayloadAction<{ collapsed: boolean }>): void {
		state.applicationState.headerCollapsed = action.payload.collapsed;
	},
	setSideCollapsed(state: ReduxGlobalState, action: PayloadAction<{ collapsed: boolean }>): void {
		state.applicationState.sideCollapsed = action.payload.collapsed;
	},
	setResourcesCollapsed(state: ReduxGlobalState, action: PayloadAction<{ collapsed: boolean }>): void {
		state.applicationState.resourcesCollapsed = action.payload.collapsed;
	},
	setEditingNav(state: ReduxGlobalState, action: PayloadAction<{ editing: boolean }>): void {
		state.applicationState.editingNav = action.payload.editing;
	},
	setEditingActions(state: ReduxGlobalState, action: PayloadAction<{ editing: boolean }>): void {
		state.applicationState.editingActions = action.payload.editing;
	},
	setEditingItems(state: ReduxGlobalState, action: PayloadAction<{ editing: boolean }>): void {
		state.applicationState.editingItems = action.payload.editing;
	},
	setInfo(state: ReduxGlobalState, action: PayloadAction<{ info: string }>): void {
		state.applicationState.info = action.payload.info;
	},
	setSplitClipboard(state: ReduxGlobalState, action: PayloadAction<{ split: RouteSplit }>): void {
		state.applicationState.splitClipboard = action.payload.split;
	},
	setResourceContent(state: ReduxGlobalState, action: PayloadAction<{ globalIndex: number, content: ActionResource }>): void {
		const { globalIndex, content } = action.payload;
		state.applicationState.resources.content[globalIndex] = content;
		state.applicationState.resources.progress = globalIndex + 1;
	},
	setResourceError(state: ReduxGlobalState, action: PayloadAction<{ error: ResourceError }>): void {
		state.applicationState.resources.error = action.payload.error;
	},
	markResourceDirtyAt(state: ReduxGlobalState, action: PayloadAction<{ globalIndex: number }>): void {
		const { globalIndex } = action.payload;
		markResourceDirty(state, globalIndex);
	},
	markResourceDirtyAtSplit(state: ReduxGlobalState, action: PayloadAction<{ branchIndex?: number, splitIndex?: number }>): void {
		let { branchIndex, splitIndex } = action.payload;
		branchIndex = branchIndex ?? getActiveBranch(state);
		splitIndex = splitIndex ?? getActiveSplit(state);

		const globalIndex = getGlobalActionIndex(state, branchIndex, splitIndex, 0);
		markResourceDirty(state, globalIndex);
	},
	setShowingHelp(state: ReduxGlobalState, action: PayloadAction<{ showHelp: boolean }>): void {
		state.applicationState.showHelp = action.payload.showHelp;
	}
};