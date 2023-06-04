import store, { ReduxGlobalState } from "store/store";
import { getActionResourceByGlobalIndex, getResourceCalcError, getResourceCalcProgress } from "store/application/selectors";
import { getActionDeltaError, getActionDeltas, getActionIndexFromGlobal, getActionName, getBranchName, getGlobalActionIndex, getSplitName, getTotalActionCount } from "store/routing/selectors";
import { markResourceDirtyAt, setResourceContent, setResourceError } from "store/application/actions";
import { ActionResource, calculateChange } from "./resource_delta";

export type RouteResources = {
	error: ResourceError,
	content: ActionResource[],
	progress: number,
}

export type ResourceError = {
	branch: number,
	split: number,
	action: number,
	message: string,
} | null;

let handle: NodeJS.Timeout | undefined = undefined;

export function startResourceCalcClock(): void {
	stopResourceCalcClock();
	handle = setInterval(update, 100);
}

export function stopResourceCalcClock(): void {
	if (handle !== undefined) {
		clearInterval(handle);
	}
}

function update() {
	if (!store.getState()) {
		return;
	}
	const state = store.getState();
	const currentlyNeedToUpdate = getResourceCalcProgress(state);
	const total = getTotalActionCount(state);
	if (total !== 0 && currentlyNeedToUpdate < total) {
		updateAt(state, currentlyNeedToUpdate);
	}
}

function updateAt(state: ReduxGlobalState, currentlyNeedToUpdate: number) {
	if (currentlyNeedToUpdate < 0) {
		currentlyNeedToUpdate = 0;
	}

	const error = getResourceCalcError(state);
	if (error !== null) {
		const { branch, split, action } = error;
		const errorGlobalIndex = getGlobalActionIndex(state, branch, split, action);
		if (currentlyNeedToUpdate > errorGlobalIndex) {
			store.dispatch(setResourceContent({ globalIndex: currentlyNeedToUpdate, content: {} }));
			return;
		}
	}
	let before: ActionResource = {};
	if (currentlyNeedToUpdate > 0) {
		const resourceBefore = getActionResourceByGlobalIndex(state, currentlyNeedToUpdate - 1);
		if (resourceBefore === undefined) {
			store.dispatch(markResourceDirtyAt({ globalIndex: currentlyNeedToUpdate - 1 }));
			return;
		}
		before = resourceBefore;
	}
	const [branch, split, action] = getActionIndexFromGlobal(state, currentlyNeedToUpdate);
	const deltas = getActionDeltas(state, branch, split, action);
	const deltaError = getActionDeltaError(state, branch, split, action);
	if (deltaError !== null || deltas === null) {
		const branchName = getBranchName(state, branch);
		const splitName = getSplitName(state, branch, split);
		const actionName = getActionName(state, branch, split, action);
		const resourceError: ResourceError = {
			branch,
			split,
			action,
			message: `Error in branch "${branchName}", split "${splitName}", action "${actionName}"`,
		};
		store.dispatch(setResourceError({ error: resourceError }));
		store.dispatch(setResourceContent({ globalIndex: currentlyNeedToUpdate, content: {} }));
		return;
	}

	const after = calculateChange(before, deltas);
	store.dispatch(setResourceContent({ globalIndex: currentlyNeedToUpdate, content: after }));
}

