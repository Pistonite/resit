import { PayloadAction } from "@reduxjs/toolkit";
import { newAction } from "data/action";
import { newBranch } from "data/branch";
import { deleteItemInDelta, deltaToString, renameItemInDelta, stringToDelta } from "data/delta";
import { newItem } from "data/item";
import { ACTION_LIMIT, BRANCH_LIMIT, ITEM_LIMIT, SPLIT_LIMIT } from "data/limit";
import { cloneSplit, newSplit, RouteSplit } from "data/split";
import { ReduxGlobalState } from "store/store";
import {
	getActionCount,
	getActionDeltas,
	getActionDeltaString,
	getActiveAction,
	getActiveBranch,
	getActiveSplit,
	getBranchCount,
	getInvalidItemNamesIn,
	getItemCount,
	getSplitCount
} from "./selectors";
import { RouteState } from "./type";

function validateBranch(state: ReduxGlobalState, branchIndex: number): boolean {
	const branchLength = getBranchCount(state);
	return branchIndex >= 0 && branchIndex < branchLength;
}

function validateSplit(state: ReduxGlobalState, branchIndex: number, splitIndex: number): boolean {
	if (!validateBranch(state, branchIndex)) {
		return false;
	}
	return splitIndex >= 0 && splitIndex < getSplitCount(state, branchIndex);
}

function validateItem(state: ReduxGlobalState, index: number): boolean {
	return index >= 0 && index < getItemCount(state);
}

function validateAction(state: ReduxGlobalState, branchIndex: number, splitIndex: number, actionIndex: number): boolean {
	if (!validateSplit(state, branchIndex, splitIndex)) {
		return false;
	}
	return actionIndex >= 0 && actionIndex < getActionCount(state, branchIndex, splitIndex);
}

function parseDeltaString(state: ReduxGlobalState, deltaString: string, branchIndex: number, splitIndex: number, actionIndex: number): void {
	const [delta, error] = stringToDelta(deltaString);
	if (error) {
		state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].deltaError = error;
		state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].deltas = null;
	} else {
		if (delta !== null) {
			const names = Object.keys(delta);
			const invalidNames = getInvalidItemNamesIn(state, names);
			if (invalidNames.length > 0) {
				const message = `Undefined item(s): ${invalidNames.join(", ")}`;
				state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].deltaError = message;
				state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].deltas = null;
				return;
			}
		}

		state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].deltaError = null;
		state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].deltas = delta;
	}
}

export default {
	setRouteState(state: ReduxGlobalState, action: PayloadAction<{ routeState: RouteState }>): void {
		state.routeState = action.payload.routeState;
	},
	setProjectName(state: ReduxGlobalState, action: PayloadAction<{ projectName: string }>): void {
		state.routeState.projectName = action.payload.projectName;
	},
	setActiveBranchAndSplit(state: ReduxGlobalState, action: PayloadAction<{ activeBranch: number, activeSplit: number }>): void {
		state.routeState.activeBranch = action.payload.activeBranch;
		state.routeState.activeSplit = action.payload.activeSplit;
		state.routeState.activeAction = -1;
	},
	setActiveAction(state: ReduxGlobalState, action: PayloadAction<{ activeAction: number }>): void {
		state.routeState.activeAction = action.payload.activeAction;
	},
	createBranch(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number }>): void {
		const { branchIndex } = action.payload;
		const branchLength = getBranchCount(state);
		if (branchLength >= BRANCH_LIMIT) {
			return;
		}
		const branch = newBranch();
		if (!validateBranch(state, branchIndex)) {
			state.routeState.branches.push(branch);
		} else {
			state.routeState.branches.splice(branchIndex, 0, branch);
			const activeBranch = getActiveBranch(state);
			if (activeBranch >= branchIndex) {
				state.routeState.activeBranch = activeBranch + 1;
			}
		}
	},
	setBranchName(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number, name: string }>): void {
		const { branchIndex, name } = action.payload;
		state.routeState.branches[branchIndex].name = name;
	},
	setBranchExpanded(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number, expanded: boolean }>): void {
		const { branchIndex, expanded } = action.payload;
		state.routeState.branches[branchIndex].expanded = expanded;
	},
	deleteBranch(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number }>): void {
		const { branchIndex } = action.payload;
		state.routeState.branches.splice(branchIndex, 1);
		const activeBranch = getActiveBranch(state);
		if (activeBranch === branchIndex) {
			state.routeState.activeBranch = -1;
		} else if (activeBranch > branchIndex) {
			state.routeState.activeBranch = activeBranch - 1;
		}
	},
	swapBranches(state: ReduxGlobalState, action: PayloadAction<{ i: number, j: number }>): void {
		const { i, j } = action.payload;
		if (!validateBranch(state, i) || !validateBranch(state, j)) {
			return;
		}
		const temp = state.routeState.branches[i];
		state.routeState.branches[i] = state.routeState.branches[j];
		state.routeState.branches[j] = temp;
		const activeBranch = getActiveBranch(state);
		if (activeBranch === i) {
			state.routeState.activeBranch = j;
		} else if (activeBranch === j) {
			state.routeState.activeBranch = i;
		}
	},
	mergeNextIntoBranch(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number }>): void {
		const { branchIndex } = action.payload;
		const branchLength = getBranchCount(state);
		if (branchIndex === branchLength - 1 || !validateBranch(state, branchIndex)) {
			return;
		}
		const oldSplitSize = getSplitCount(state, branchIndex);
		const nextSplitSize = getSplitCount(state, branchIndex + 1);
		if (oldSplitSize + nextSplitSize >= SPLIT_LIMIT) {
			return;
		}
		state.routeState.branches[branchIndex].splits = state.routeState.branches[branchIndex].splits.concat(state.routeState.branches[branchIndex + 1].splits);
		state.routeState.branches.splice(branchIndex + 1, 1);
		const activeBranch = getActiveBranch(state);
		if (activeBranch === branchIndex + 1) {
			state.routeState.activeBranch = activeBranch - 1;
			state.routeState.activeSplit += oldSplitSize;
		}
	},
	breakBranchAt(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number, splitIndex: number }>): void {
		const branchLength = getBranchCount(state);
		if (branchLength >= BRANCH_LIMIT) {
			return;
		}
		const { branchIndex, splitIndex } = action.payload;
		if (!validateSplit(state, branchIndex, splitIndex)) {
			return;
		}
		const hiSplits = state.routeState.branches[branchIndex].splits.slice(splitIndex);
		state.routeState.branches[branchIndex].splits = state.routeState.branches[branchIndex].splits.slice(0, splitIndex);
		const branch = newBranch();
		branch.expanded = true;
		branch.splits = hiSplits;
		state.routeState.branches.splice(branchIndex + 1, 0, branch);
		const activeBranch = getActiveBranch(state);
		const activeSplit = getActiveSplit(state);
		if (activeBranch === branchIndex && activeSplit >= splitIndex) {
			state.routeState.activeBranch = activeBranch + 1;
			state.routeState.activeSplit -= splitIndex;
		}
	},
	createSplit(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number, splitIndex: number, templateSplit?: RouteSplit }>): void {
		const { branchIndex, splitIndex, templateSplit } = action.payload;
		if (!validateBranch(state, branchIndex)) {
			return;
		}
		const splitLength = getSplitCount(state, branchIndex);
		if (splitLength >= SPLIT_LIMIT) {
			return;
		}
		const split = templateSplit ? cloneSplit(templateSplit) : newSplit();
		if (!validateSplit(state, branchIndex, splitIndex)) {
			state.routeState.branches[branchIndex].splits.push(split);
		} else {
			state.routeState.branches[branchIndex].splits.splice(splitIndex, 0, split);
			if (getActiveBranch(state) === branchIndex) {
				const activeSplit = getActiveSplit(state);
				if (activeSplit >= splitIndex) {
					state.routeState.activeSplit = activeSplit + 1;
				}
			}
		}
	},
	setSplitName(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number, splitIndex: number, name: string }>): void {
		const { branchIndex, splitIndex, name } = action.payload;
		state.routeState.branches[branchIndex].splits[splitIndex].name = name;
	},
	setActiveSplitName(state: ReduxGlobalState, action: PayloadAction<{ name: string }>): void {
		const branchIndex = getActiveBranch(state);
		const splitIndex = getActiveSplit(state);
		if (!validateSplit(state, branchIndex, splitIndex)) {
			return;
		}
		const { name } = action.payload;
		state.routeState.branches[branchIndex].splits[splitIndex].name = name;
	},
	setSplitExpanded(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number, splitIndex: number, expanded: boolean }>): void {
		const { branchIndex, splitIndex, expanded } = action.payload;
		state.routeState.branches[branchIndex].splits[splitIndex].expanded = expanded;
	},
	deleteSplit(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number, splitIndex: number }>): void {
		const { branchIndex, splitIndex } = action.payload;
		if (!validateSplit(state, branchIndex, splitIndex)) {
			return;
		}
		state.routeState.branches[branchIndex].splits.splice(splitIndex, 1);
		if (getActiveBranch(state) === branchIndex) {
			const activeSplit = getActiveSplit(state);
			if (activeSplit === splitIndex) {
				state.routeState.activeSplit = -1;
			} else if (activeSplit > splitIndex) {
				state.routeState.activeSplit = activeSplit - 1;
			}
		}
	},
	swapSplits(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number, i: number, j: number }>): void {
		const { branchIndex, i, j } = action.payload;
		if (!validateSplit(state, branchIndex, i) || !validateSplit(state, branchIndex, j)) {
			return;
		}
		const temp = state.routeState.branches[branchIndex].splits[i];
		state.routeState.branches[branchIndex].splits[i] = state.routeState.branches[branchIndex].splits[j];
		state.routeState.branches[branchIndex].splits[j] = temp;
		if (getActiveBranch(state) === branchIndex) {
			const activeSplit = getActiveSplit(state);
			if (activeSplit === i) {
				state.routeState.activeSplit = j;
			} else if (activeSplit === j) {
				state.routeState.activeSplit = i;
			}
		}
	},
	moveFirstSplitToPreviousBranch(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number }>): void {
		const { branchIndex } = action.payload;
		if (!validateBranch(state, branchIndex) || !validateBranch(state, branchIndex - 1)) {
			return;
		}
		if (getSplitCount(state, branchIndex) <= 0) {
			return;
		}
		const movedSplitIndex = getSplitCount(state, branchIndex - 1);
		state.routeState.branches[branchIndex - 1].splits.push(state.routeState.branches[branchIndex].splits[0]);
		state.routeState.branches[branchIndex].splits.splice(0, 1);
		if (getActiveBranch(state) === branchIndex) {
			if (getActiveSplit(state) === 0) {
				state.routeState.activeBranch = branchIndex - 1;
				state.routeState.activeSplit = movedSplitIndex;
			} else {
				state.routeState.activeSplit -= 1;
			}
		}
	},
	moveLastSplitToNextBranch(state: ReduxGlobalState, action: PayloadAction<{ branchIndex: number }>): void {
		const { branchIndex } = action.payload;
		if (!validateBranch(state, branchIndex) || !validateBranch(state, branchIndex + 1)) {
			return;
		}
		if (getSplitCount(state, branchIndex) <= 0) {
			return;
		}
		const beforeMoveIndex = getSplitCount(state, branchIndex) - 1;
		state.routeState.branches[branchIndex + 1].splits.splice(0, 0, state.routeState.branches[branchIndex].splits[beforeMoveIndex]);
		state.routeState.branches[branchIndex].splits.pop();
		if (getActiveBranch(state) === branchIndex) {
			if (getActiveSplit(state) === beforeMoveIndex) {
				state.routeState.activeBranch = branchIndex + 1;
				state.routeState.activeSplit = 0;
			}
		} else if (getActiveBranch(state) === branchIndex + 1) {
			state.routeState.activeSplit += 1;
		}
	},
	createItem(state: ReduxGlobalState, action: PayloadAction<{ index: number }>): void {
		const { index } = action.payload;
		const item = newItem();
		const itemLength = getItemCount(state);
		if (itemLength >= ITEM_LIMIT) {
			return;
		}
		if (!validateItem(state, index)) {
			state.routeState.items.push(item);
		} else {
			state.routeState.items.splice(index, 0, item);
		}
	},
	setItemName(state: ReduxGlobalState, action: PayloadAction<{ index: number, name: string }>): void {
		const { index, name } = action.payload;
		const oldName = state.routeState.items[index].name;
		state.routeState.items[index].name = name;
		for (let b = 0; b < getBranchCount(state); b++) {
			for (let s = 0; s < getSplitCount(state, b); s++) {
				for (let a = 0; a < getActionCount(state, b, s); a++) {
					const deltas = getActionDeltas(state, b, s, a);
					if (deltas !== null) {
						renameItemInDelta(deltas, oldName, name);
						state.routeState.branches[b].splits[s].actions[a].deltaString = deltaToString(deltas);
					}
				}
			}
		}
	},
	setItemColor(state: ReduxGlobalState, action: PayloadAction<{ index: number, color: string }>): void {
		const { index, color } = action.payload;
		state.routeState.items[index].color = color;
	},
	swapItems(state: ReduxGlobalState, action: PayloadAction<{ i: number, j: number }>): void {
		const { i, j } = action.payload;
		if (!validateItem(state, i) || !validateItem(state, j)) {
			return;
		}
		const temp = state.routeState.items[i];
		state.routeState.items[i] = state.routeState.items[j];
		state.routeState.items[j] = temp;
	},
	deleteItem(state: ReduxGlobalState, action: PayloadAction<{ index: number }>): void {
		const { index } = action.payload;
		let name: string;
		if (!validateItem(state, index)) {
			const item = state.routeState.items.pop();
			if (item === undefined) {
				return;
			}
			name = item.name;
		} else {
			const item = state.routeState.items[index];
			state.routeState.items.splice(index, 1);
			name = item.name;
		}
		for (let b = 0; b < getBranchCount(state); b++) {
			for (let s = 0; s < getSplitCount(state, b); s++) {
				for (let a = 0; a < getActionCount(state, b, s); a++) {
					const deltas = getActionDeltas(state, b, s, a);
					if (deltas !== null) {
						deleteItemInDelta(deltas, name);
						const deltaString = deltaToString(deltas);
						state.routeState.branches[b].splits[s].actions[a].deltaString = deltaString;
						if (deltaString === "" &&
							getActiveBranch(state) === b &&
							getActiveSplit(state) === s &&
							getActiveAction(state) === a) {
							state.routeState.activeAction = -1;
						}
					}
				}
			}
		}
	},
	createAction(state: ReduxGlobalState, action: PayloadAction<{ branchIndex?: number, splitIndex?: number, actionIndex: number }>): void {
		let { branchIndex, splitIndex } = action.payload;
		const { actionIndex } = action.payload;
		branchIndex = branchIndex ?? getActiveBranch(state);
		splitIndex = splitIndex ?? getActiveSplit(state);
		if (!validateSplit(state, branchIndex, splitIndex)) {
			return;
		}
		const actionCount = getActionCount(state, branchIndex, splitIndex);
		if (actionCount >= ACTION_LIMIT) {
			return;
		}
		const routeAction = newAction();
		if (!validateAction(state, branchIndex, splitIndex, actionIndex)) {
			state.routeState.branches[branchIndex].splits[splitIndex].actions.push(routeAction);
		} else {
			state.routeState.branches[branchIndex].splits[splitIndex].actions.splice(actionIndex, 0, routeAction);
			const activeBranch = getActiveBranch(state);
			const activeSplit = getActiveSplit(state);
			if (activeBranch === branchIndex && activeSplit === splitIndex) {
				const activeAction = getActiveAction(state);
				if (activeAction >= actionIndex) {
					state.routeState.activeAction += 1;
				}
			}
		}
	},
	setActionName(state: ReduxGlobalState, action: PayloadAction<{ branchIndex?: number, splitIndex?: number, actionIndex: number, name: string }>): void {
		let { branchIndex, splitIndex } = action.payload;
		const { actionIndex, name } = action.payload;
		branchIndex = branchIndex ?? getActiveBranch(state);
		splitIndex = splitIndex ?? getActiveSplit(state);
		if (!validateAction(state, branchIndex, splitIndex, actionIndex)) {
			return;
		}
		state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].name = name;
	},
	setActionExpanded(state: ReduxGlobalState, action: PayloadAction<{ branchIndex?: number, splitIndex?: number, actionIndex: number, expanded: boolean }>): void {
		let { branchIndex, splitIndex } = action.payload;
		const { actionIndex, expanded } = action.payload;
		branchIndex = branchIndex ?? getActiveBranch(state);
		splitIndex = splitIndex ?? getActiveSplit(state);
		if (!validateAction(state, branchIndex, splitIndex, actionIndex)) {
			return;
		}
		state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].expanded = expanded;
	},
	setActionDeltaString(state: ReduxGlobalState, action: PayloadAction<{ branchIndex?: number, splitIndex?: number, actionIndex: number, deltaString: string }>): void {
		let { branchIndex, splitIndex } = action.payload;
		const { actionIndex, deltaString } = action.payload;
		branchIndex = branchIndex ?? getActiveBranch(state);
		splitIndex = splitIndex ?? getActiveSplit(state);

		if (!validateAction(state, branchIndex, splitIndex, actionIndex)) {
			return;
		}

		if (deltaString === "" &&
			getActiveBranch(state) === branchIndex &&
			getActiveSplit(state) === splitIndex &&
			getActiveAction(state) === actionIndex) {
			state.routeState.activeAction = -1;
		}
		state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].expanded = true;

		state.routeState.branches[branchIndex].splits[splitIndex].actions[actionIndex].deltaString = deltaString;
		parseDeltaString(state, deltaString, branchIndex, splitIndex, actionIndex);

	},
	deleteAction(state: ReduxGlobalState, action: PayloadAction<{ branchIndex?: number, splitIndex?: number, actionIndex: number }>): void {
		let { branchIndex, splitIndex } = action.payload;
		const { actionIndex } = action.payload;
		branchIndex = branchIndex ?? getActiveBranch(state);
		splitIndex = splitIndex ?? getActiveSplit(state);

		if (!validateAction(state, branchIndex, splitIndex, actionIndex)) {
			return;
		}

		state.routeState.branches[branchIndex].splits[splitIndex].actions.splice(actionIndex, 1);
		if (getActiveBranch(state) === branchIndex && getActiveSplit(state) === splitIndex) {
			const activeAction = getActiveAction(state);
			if (activeAction === actionIndex) {
				state.routeState.activeAction = -1;
			} else if (activeAction > actionIndex) {
				state.routeState.activeAction -= 1;
			}
		}
	},
	swapActions(state: ReduxGlobalState, action: PayloadAction<{ branchIndex?: number, splitIndex?: number, i: number, j: number }>): void {
		let { branchIndex, splitIndex } = action.payload;
		const { i, j } = action.payload;
		branchIndex = branchIndex ?? getActiveBranch(state);
		splitIndex = splitIndex ?? getActiveSplit(state);

		if (!validateAction(state, branchIndex, splitIndex, i) || !validateAction(state, branchIndex, splitIndex, j)) {
			return;
		}

		const temp = state.routeState.branches[branchIndex].splits[splitIndex].actions[i];
		state.routeState.branches[branchIndex].splits[splitIndex].actions[i] = state.routeState.branches[branchIndex].splits[splitIndex].actions[j];
		state.routeState.branches[branchIndex].splits[splitIndex].actions[j] = temp;
		if (getActiveBranch(state) === branchIndex && getActiveSplit(state) === splitIndex) {
			const activeAction = getActiveAction(state);
			if (activeAction === i) {
				state.routeState.activeAction = j;
			} else if (activeAction === j) {
				state.routeState.activeAction = i;
			}
		}
	},
	reparseAllDeltaStrings(state: ReduxGlobalState): void {
		for (let b = 0; b < getBranchCount(state); b++) {
			for (let s = 0; s < getSplitCount(state, b); s++) {
				for (let a = 0; a < getActionCount(state, b, s); a++) {
					parseDeltaString(state, getActionDeltaString(state, b, s, a), b, s, a);
				}
			}
		}
	},
	changeActiveSplit(state: ReduxGlobalState, action: PayloadAction<{ changeBy: number }>): void {
		const activeBranch = getActiveBranch(state);
		const activeSplit = getActiveSplit(state);
		if (activeBranch < 0 || activeSplit < 0) {
			return;
		}
		let current = 0;
		for (let b = 0; b < activeBranch; b++) {
			current += getSplitCount(state, b);
		}
		current += activeSplit;
		let changed = current + action.payload.changeBy;
		let changedBranch = -1;
		let changedSplit = -1;
		for (let b = 0; b < getBranchCount(state); b++) {
			const splitCount = getSplitCount(state, b);
			if (changed < splitCount) {
				changedBranch = b;
				changedSplit = changed;
				break;
			} else {
				changed -= splitCount;
			}
		}

		state.routeState.activeBranch = changedBranch;
		state.routeState.activeSplit = changedSplit;
		state.routeState.activeAction = -1;
	},
	setAllCollapsed(state: ReduxGlobalState, action: PayloadAction<{ collapsed: boolean }>): void {
		const expanded = !action.payload.collapsed;
		state.routeState.branches.forEach(b => {
			b.splits.forEach(s => {
				s.expanded = expanded;
			});
			b.expanded = expanded;
		});
	}
};