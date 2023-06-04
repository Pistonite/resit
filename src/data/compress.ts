import { RouteState } from "store/routing/type";
import { deflateRouteState, inflateRouteData, RouteData } from "./storage";
import { compressBranch, decompressBranch } from "./branch";
import { compressItem, decompressItem } from "./item";
import zlib from "zlib";

type LengthPrependedString = string;
type CompressedStateString = string;

export function compressState(state: RouteState): CompressedStateString {
	const { projectName, branches, items } = deflateRouteState(state);
	const projectNameEncoded = encodeLengthPrepended(projectName);

	const itemNameToIndex: Record<string, number> = {};
	items.forEach((item, index) => {
		itemNameToIndex[item.name] = index;
	});

	const branchesEncoded = encodeArray(branches, branch => compressBranch(branch, itemNameToIndex));
	const itemsEncoded = encodeArray(items, compressItem);
	return `${projectNameEncoded}${itemsEncoded}${branchesEncoded}`;
}

export function decompressState(compressedStateString: CompressedStateString): [RouteState | null, string | null] {
	const [projectName, indexAfterProjectName, projectNameError] = decodeLengthPrepended(compressedStateString, 0);
	if (projectNameError !== null) {
		return [null, `Fail to decompress project name: ${projectNameError}`];
	}
	const [items, indexAfterItems, itemsError] = decodeArray(compressedStateString, indexAfterProjectName, decompressItem);
	if (itemsError !== null) {
		return [null, `Fail to decompress project items: ${itemsError}`];
	}
	const itemNames = items.map(item => item.name);
	const [branches, indexAfterBranches, branchesError] = decodeArray(compressedStateString, indexAfterItems, (str, idx) => decompressBranch(str, idx, itemNames));
	if (branchesError !== null) {
		return [null, `Fail to decompress project branches: ${branchesError}`];
	}
	if (indexAfterBranches !== compressedStateString.length) {
		return [null, "Fail to decompress project: length mismatch"];
	}
	const data: RouteData = {
		projectName,
		branches,
		items,
	};

	const state = inflateRouteData(data);
	return [state, null];
}

export function encodeLengthPrepended(str: string): LengthPrependedString {
	if (str.length === 0) {
		return ":";
	}
	return `${str.length}:${str}`;
}

export function decodeLengthPrepended(lengthPrependedString: LengthPrependedString, currentIndex: number): [string, number, string | null] {
	const i = lengthPrependedString.indexOf(":", currentIndex);
	if (i < currentIndex) {
		return ["null", -1, "Fail to decode: length not found"];
	}
	if (i === currentIndex) {
		return ["", i + 1, null];
	}
	const len = Number(lengthPrependedString.substring(currentIndex, i));
	if (!Number.isInteger(len)) {
		return ["null", -1, `Fail to decode: invalid length: ${len}`];
	}
	if (i + len >= lengthPrependedString.length) {
		return ["null", -1, `Fail to decode: length out of bound: ${len}`];
	}
	const decoded = lengthPrependedString.substring(i + 1, i + 1 + len);
	return [decoded, i + len + 1, null];
}

export function encodeBoolean(val: boolean): string {
	return val ? "T" : "F";
}

export function decodeBoolean(str: string, currentIndex: number): [boolean, number, string | null] {
	if (currentIndex < 0 || currentIndex >= str.length) {
		return [false, -1, "Fail to decode: index out of bound"];
	}
	if (str[currentIndex] === "T") {
		return [true, currentIndex + 1, null];
	}
	if (str[currentIndex] === "F") {
		return [false, currentIndex + 1, null];
	}
	return [false, -1, `Fail to decode: invalid boolean: ${str[currentIndex]}`];
}

export function encodeArray<T>(array: T[], encoder: (element: T) => string): string {
	return `[${array.map(encoder).join("")}]`;
}

export function decodeArray<T>(compressedString: string, currentIndex: number, decoder: (str: string, idx: number) => [T, number, string | null]): [T[], number, string | null] {
	if (currentIndex < 0 || currentIndex >= compressedString.length) {
		return [[], -1, "Fail to decode array: index out of bound"];
	}
	if (compressedString[currentIndex] !== "[") {
		return [[], -1, "Fail to decode array: invalid array"];
	}
	const array: T[] = [];
	currentIndex++;
	while (currentIndex < compressedString.length && compressedString[currentIndex] !== "]") {
		const [element, nextIndex, error] = decoder(compressedString, currentIndex);
		if (error !== null) {
			return [[], -1, `Fail to decode array at element ${array.length}: ${error}`];
		}
		currentIndex = nextIndex;
		array.push(element);
	}
	if (currentIndex >= compressedString.length) {
		return [[], -1, "Fail to decode array: array not properly closed"];
	}
	return [array, currentIndex + 1, null];
}

type EncodedStateString = string;

export function deflateCompressedState(compressedStateString: CompressedStateString): EncodedStateString {
	return zlib.deflateSync(compressedStateString).toString("base64");
}
export function inflateEncodedState(stateEncoded: EncodedStateString): CompressedStateString {
	return zlib.inflateSync(Buffer.from(stateEncoded, "base64")).toString();
}

