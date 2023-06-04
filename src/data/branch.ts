import { decodeArray, decodeLengthPrepended, encodeArray, encodeLengthPrepended } from "./compress";
import { ActionResource } from "./resource_delta";
import { SplitData, RouteSplit, deflateRouteSplit, inflateSplitData, compressSplit, decompressSplit, stringifySplit } from "./split";
export type BranchData = {
	name: string,
	splits: SplitData[],
}
export type RouteBranch = {
	name: string,
	expanded: boolean,
	splits: RouteSplit[],
}

export function newBranch(): RouteBranch {
	return {
		name: "",
		expanded: true,
		splits: [],
	};
}

export function deflateRouteBranch(branch: RouteBranch): BranchData {
	return {
		name: branch.name || "",
		splits: (branch.splits || []).map(deflateRouteSplit)
	};
}

export function inflateBranchData(branch: BranchData): RouteBranch {
	return {
		name: branch.name || "",
		expanded: true,
		splits: (branch.splits || []).map(inflateSplitData),
	};
}

export function compressBranch(branch: BranchData, itemNameToIndex: Record<string, number>): string {
	const { name, splits } = branch;
	const nameEncoded = encodeLengthPrepended(name);
	const splitsEncoded = encodeArray(splits, split => compressSplit(split, itemNameToIndex));
	return `${nameEncoded}${splitsEncoded}`;
}

export function decompressBranch(compressedString: string, currentIndex: number, itemNames: string[]): [BranchData, number, string | null] {
	const [name, indexAfterName, nameError] = decodeLengthPrepended(compressedString, currentIndex);
	if (nameError !== null) {
		return [deflateRouteBranch(newBranch()), -1, `Fail to decompress branch name: ${nameError}`];
	}
	const [splits, indexAfterSplits, splitsError] = decodeArray(compressedString, indexAfterName, (str, idx) => decompressSplit(str, idx, itemNames));
	if (splitsError !== null) {
		return [deflateRouteBranch(newBranch()), -1, `Fail to decompress branch splits: ${splitsError}`];
	}
	const branch: BranchData = {
		name,
		splits,
	};
	return [branch, indexAfterSplits, null];
}

export function stringifyBranch(branch: BranchData, resourcesBefore: ActionResource): [string, ActionResource] {
	const lines = [];
	lines.push("- " + branch.name);
	branch.splits.forEach(split => {
		const [splitString, resources] = stringifySplit(split, resourcesBefore);
		resourcesBefore = resources;
		lines.push(splitString);
	});
	return [lines.join("\r\n"), resourcesBefore]; //for windows
}
