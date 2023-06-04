import { decodeBoolean, decodeLengthPrepended, encodeBoolean, encodeLengthPrepended } from "./compress";
import { DeltaString, DeltaError, ActionDelta, stringToDelta, deltaToCompressedString, compressedStringToDelta, deltaToString, deltaToStringWithResources } from "./delta";
import { ActionResource, calculateChange } from "./resource_delta";

export type ActionData = {
	name: string,
	deltaString: DeltaString,
}

export type RouteAction = {
	name: string,
	expanded: boolean,
	deltaString: DeltaString,
	deltaError: DeltaError,
	deltas: ActionDelta | null,
}

export function newAction(): RouteAction {
	return {
		name: "",
		expanded: true,
		deltaString: "",
		deltaError: null,
		deltas: {},
	};
}

export function cloneAction(action: RouteAction): RouteAction {
	const [deltas, deltaError] = stringToDelta(action.deltaString);
	return {
		name: action.name,
		expanded: action.expanded,
		deltaString: action.deltaString,
		deltaError,
		deltas,
	};
}

export function deflateRouteAction(action: RouteAction): ActionData {
	return {
		name: action.name || "",
		deltaString: action.deltaString || "",
	};
}

export function inflateActionData(action: ActionData): RouteAction {
	const [deltas, deltaError] = stringToDelta(action.deltaString);
	const routeAction = {
		name: action.name || "",
		deltaString: action.deltaString || "",
		expanded: true,
		deltas,
		deltaError,
	};
	return routeAction;
}

export function compressAction(action: ActionData, itemNameToIndex: Record<string, number>): string {
	const { name, deltaString } = action;
	const nameEncoded = encodeLengthPrepended(name);

	const [deltas, error] = stringToDelta(deltaString);
	const hasError = error !== null || deltas === null;
	const hasErrorEncoded = encodeBoolean(hasError);
	let deltaStringEncoded;
	if (error !== null || deltas === null) {
		deltaStringEncoded = encodeLengthPrepended(deltaString);
	} else {
		deltaStringEncoded = encodeLengthPrepended(deltaToCompressedString(deltas, itemNameToIndex));
	}

	return `${nameEncoded}${hasErrorEncoded}${deltaStringEncoded}`;
}

export function decompressAction(compressedString: string, currentIndex: number, itemNames: string[]): [ActionData, number, string | null] {
	const [name, indexAfterName, nameError] = decodeLengthPrepended(compressedString, currentIndex);

	if (nameError !== null) {
		return [{ name: "", deltaString: "" }, -1, `Fail to decompress action name: ${nameError}`];
	}
	const [hasError, indexAfterHasError, hasErrorError] = decodeBoolean(compressedString, indexAfterName);
	if (hasErrorError !== null) {
		return [{ name: "", deltaString: "" }, -1, `Fail to decompress action delta error: ${hasErrorError}`];
	}
	const [deltaStringRaw, indexAfterDeltaString, deltaStringError] = decodeLengthPrepended(compressedString, indexAfterHasError);
	if (deltaStringError !== null) {
		return [{ name: "", deltaString: "" }, -1, `Fail to decompress action delta string: ${deltaStringError}`];
	}
	let deltaString: string;
	if (hasError) {
		deltaString = deltaStringRaw;
	} else {
		const [deltas, deltaDecompressError] = compressedStringToDelta(deltaStringRaw, itemNames);
		if (deltaDecompressError !== null || deltas === null) {
			return [{ name: "", deltaString: "" }, -1, `Fail to decompress action delta: ${deltaDecompressError}`];
		}
		deltaString = deltaToString(deltas);
	}

	const action: ActionData = { name, deltaString };
	return [action, indexAfterDeltaString, null];
}

export function stringifyAction(action: ActionData, resourceBefore: ActionResource): [string, ActionResource] {
	if (action.deltaString) {
		const [delta, error] = stringToDelta(action.deltaString);
		if (delta !== null && error === null) {
			const resourceAfter = calculateChange(resourceBefore, delta);
			const deltaString = deltaToStringWithResources(delta, resourceAfter);
			return [`    - ${action.name}: ${deltaString}`, resourceAfter];
		}
		return [`    - ${action.name}: ${action.deltaString}`, resourceBefore];
	}
	return [`    * ${action.name}`, resourceBefore];
}