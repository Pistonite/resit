import { RouteAction } from "data/action";
import { RouteBranch } from "data/branch";
import { DeltaString, DeltaError, ActionDelta } from "data/delta";
import { RouteItem } from "data/item";
import { RouteState } from "./type";
import { RouteSplit } from "data/split";
import { ReduxGlobalState } from "store/store";

export function getRouteState(state: ReduxGlobalState): RouteState {
	return state.routeState;
}

export function getProjectName(state: ReduxGlobalState): string {
	return getRouteState(state).projectName;
}

export function getActiveBranch(state: ReduxGlobalState): number {
	return getRouteState(state).activeBranch;
}

export function getActiveSplit(state: ReduxGlobalState): number {
	return getRouteState(state).activeSplit;
}

export function getActiveGlobalIndex(state: ReduxGlobalState): number | undefined {
	const branch = getActiveBranch(state);
	const split = getActiveSplit(state);
	const action = getActiveAction(state);
	if (branch >= 0 && split >= 0) {
		let activeAction = action;
		if (activeAction < 0) {
			const count = getActionCount(state, branch, split);
			if (count > 0) {
				activeAction = count - 1;
			}
		}
		if (activeAction >= 0) {
			return getGlobalActionIndex(state, branch, split, activeAction);
		}
	}
	return undefined;
}

function getActiveRouteSplit(state: ReduxGlobalState): RouteSplit | undefined {
	const b = getActiveBranch(state);
	const s = getActiveSplit(state);
	if (b >= 0 && s >= 0) {
		return getSplit(state, b, s);
	}
	return undefined;
}

export function getActiveSplitName(state: ReduxGlobalState): string | undefined {
	return getActiveRouteSplit(state)?.name;
}

function getActiveSplitActions(state: ReduxGlobalState): RouteAction[] | undefined {
	return getActiveRouteSplit(state)?.actions;
}

export function getActiveSplitActionCount(state: ReduxGlobalState): number | undefined {
	return getActiveSplitActions(state)?.length;
}

function getActiveSplitAction(state: ReduxGlobalState, actionIndex: number): RouteAction | undefined {
	const actions = getActiveSplitActions(state);
	return actions === undefined ? undefined : actions[actionIndex];
}

export function getActiveSplitActionName(state: ReduxGlobalState, actionIndex: number): string | undefined {
	return getActiveSplitAction(state, actionIndex)?.name;
}

export function isActiveSplitActionExpanded(state: ReduxGlobalState, actionIndex: number): boolean | undefined {
	return getActiveSplitAction(state, actionIndex)?.expanded;
}

export function getActiveSplitActionDeltaString(state: ReduxGlobalState, actionIndex: number): DeltaString | undefined {
	return getActiveSplitAction(state, actionIndex)?.deltaString;
}

export function getActiveSplitActionDeltaError(state: ReduxGlobalState, actionIndex: number): DeltaError | undefined {
	const error = getActiveSplitAction(state, actionIndex)?.deltaError;
	return error ? error : undefined;
}

export function getActiveSplitActionDeltas(state: ReduxGlobalState, actionIndex: number): ActionDelta | undefined {
	const deltas = getActiveSplitAction(state, actionIndex)?.deltas;
	return deltas ? deltas : undefined;
}

export function getActiveAction(state: ReduxGlobalState): number {
	return getRouteState(state).activeAction;
}

export function getActiveActionName(state: ReduxGlobalState): string | undefined {
	const activeAction = getActiveAction(state);
	if (activeAction < 0) {
		return undefined;
	}
	const action = getActiveSplitAction(state, activeAction);
	return action?.name;
}

function getBranches(state: ReduxGlobalState): RouteBranch[] {
	return getRouteState(state).branches;
}

function getBranch(state: ReduxGlobalState, branchIndex: number): RouteBranch {
	return getBranches(state)[branchIndex];
}

export function getBranchCount(state: ReduxGlobalState): number {
	return getBranches(state).length;
}

export function getBranchName(state: ReduxGlobalState, branchIndex: number): string {
	return getBranch(state, branchIndex).name;
}

export function isBranchExpanded(state: ReduxGlobalState, branchIndex: number): boolean {
	return getBranch(state, branchIndex).expanded;
}

function getSplits(state: ReduxGlobalState, branchIndex: number): RouteSplit[] {
	return getBranch(state, branchIndex).splits;
}

export function getSplit(state: ReduxGlobalState, branchIndex: number, splitIndex: number): RouteSplit {
	return getSplits(state, branchIndex)[splitIndex];
}

export function getSplitCount(state: ReduxGlobalState, branchIndex: number): number {
	return getSplits(state, branchIndex).length;
}

export function getSplitName(state: ReduxGlobalState, branchIndex: number, splitIndex: number): string {
	return getSplit(state, branchIndex, splitIndex).name;
}

export function isSplitExpanded(state: ReduxGlobalState, branchIndex: number, splitIndex: number): boolean {
	return getSplit(state, branchIndex, splitIndex).expanded;
}

function getActions(state: ReduxGlobalState, branchIndex: number, splitIndex: number): RouteAction[] {
	return getSplit(state, branchIndex, splitIndex).actions;
}

function getAction(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): RouteAction {
	return getActions(state, branchIndex, splitIndex)[actionIndex];
}

export function getActionCount(state: ReduxGlobalState, branchIndex: number, splitIndex: number): number {
	return getActions(state, branchIndex, splitIndex).length;
}

export function isActionNote(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): boolean {
	return getAction(state, branchIndex, splitIndex, actionIndex).deltaString === "";
}

export function getActionName(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): string {
	return getAction(state, branchIndex, splitIndex, actionIndex).name;
}

export function getActionDeltas(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): ActionDelta | null {
	return getAction(state, branchIndex, splitIndex, actionIndex).deltas;
}

export function getActionDeltaError(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): DeltaError {
	return getAction(state, branchIndex, splitIndex, actionIndex).deltaError;
}

export function getActionDeltaString(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): string {
	return getAction(state, branchIndex, splitIndex, actionIndex).deltaString;
}

export function getGlobalActionIndex(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): number {
	let i = 0;
	for (let b = 0; b < branchIndex; b++) {
		const splitCount = getSplitCount(state, b);
		for (let s = 0; s < splitCount; s++) {
			i += getActionCount(state, b, s);
		}
	}
	for (let s = 0; s < splitIndex; s++) {
		i += getActionCount(state, branchIndex, s);
	}
	return i + actionIndex;
}

export function getTotalActionCount(state: ReduxGlobalState): number {
	let i = 0;
	getBranches(state).forEach(branch => {
		branch.splits.forEach(split => {
			i += split.actions.length;
		});
	});
	return i;
}

export function getActionIndexFromGlobal(state: ReduxGlobalState, globalIndex: number): [number, number, number] {
	let i = globalIndex;
	for (let b = 0; b < getBranchCount(state); b++) {
		for (let s = 0; s < getSplitCount(state, b); s++) {
			const actionCount = getActionCount(state, b, s);
			if (i < actionCount) {
				return [b, s, i];
			}
			i -= actionCount;
		}
	}
	return [-1, -1, -1];
}

function getItems(state: ReduxGlobalState): RouteItem[] {
	return getRouteState(state).items;
}

function getItemByName(state: ReduxGlobalState, name: string): RouteItem | undefined {
	const match = getItems(state).filter(item => item.name === name);
	if (match.length === 0) {
		return undefined;
	}
	return match[0];
}

export function getItemColorByName(state: ReduxGlobalState, name: string): string | undefined {
	return getItemByName(state, name)?.color;
}

export function getFilteredItemIndices(state: ReduxGlobalState, filter: string[]): number[] {
	if (filter.length === 0) {
		return getItems(state).map((_, i) => i);
	}
	const lowerCaseFilter = filter.map(s => s.toLowerCase());
	const indices: number[] = [];
	getItems(state).forEach((item, itemIndex) => {
		for (let i = 0; i < lowerCaseFilter.length; i++) {
			if (item.name.toLowerCase().includes(lowerCaseFilter[i])) {
				indices.push(itemIndex);
				break;
			}
		}
	});
	return indices;
}

export function getItemNameByIndex(state: ReduxGlobalState, i: number): string {
	return getItems(state)[i].name;
}

export function getItemColorByIndex(state: ReduxGlobalState, i: number): string {
	return getItems(state)[i].color;
}

export function getItemCount(state: ReduxGlobalState): number {
	return getItems(state).length;
}

export function getInvalidItemNamesIn(state: ReduxGlobalState, names: string[]): string[] {
	const validNames = getItems(state).map(item => item.name).sort();
	names.sort();
	let i = 0;
	let j = 0;
	const invalidNames = [];
	while (i < validNames.length && j < names.length) {
		if (names[j] < validNames[i]) {
			invalidNames.push(names[j]);
			j++;
		} else if (names[j] > validNames[i]) {
			i++;
		} else {
			i++;
			j++;
		}
	}
	for (; j < names.length; j++) {
		invalidNames.push(names[j]);
	}
	return invalidNames;
}

