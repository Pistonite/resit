import { BranchData, deflateRouteBranch, inflateBranchData, stringifyBranch } from "./branch";
import { ItemData, deflateRouteItem, inflateItemData } from "./item";
import { RouteState } from "store/routing/type";
import { compressState, decompressState, deflateCompressedState, inflateEncodedState } from "./compress";
import { SettingState } from "store/setting/type";
import { ActionResource } from "./resource_delta";
export type RouteData = {
	projectName: string,
	branches: BranchData[],
	items: ItemData[],
}

const OLD_KEYS = ["RRT_STATE_v1"];
const KEY = "RRT_COMPRESS_STATE";
const SETTING_KEY = "RRT_SETTINGS";

export function deflateRouteState(state: RouteState): RouteData {
	return {
		branches: (state.branches || []).map(deflateRouteBranch),
		items: (state.items || []).map(deflateRouteItem),
		projectName: state.projectName || "",
	};
}

export function inflateRouteData(data: RouteData): RouteState {
	return {
		projectName: data.projectName || "",
		activeBranch: -1,
		activeSplit: -1,
		activeAction: -1,
		branches: (data.branches || []).map(inflateBranchData),
		items: (data.items || []).map(inflateItemData),
	};
}

export function newEmptyRouteState(): RouteState {
	return {
		projectName: "Unnamed Project",
		activeBranch: -1,
		activeSplit: -1,
		activeAction: -1,
		branches: [],
		items: [],
	};
}

export function exportAsCompressed(state: RouteState): string {
	return compressState(state);
}

export function exportAsEncoded(state: RouteState): string {
	return deflateCompressedState(compressState(state));
}

export function exportAsTxt(state: RouteState): string {
	const lines: string[] = [];
	let resources: ActionResource = {};
	state.branches.forEach(branch => {
		const [branchString, resourcesAfter] = stringifyBranch(branch, resources);
		resources = resourcesAfter;
		lines.push(branchString);
	});
	const itemStrings: string[] = [];
	for (const name in resources) {
		itemStrings.push(`  ${name}: ${resources[name].value}`);
	}
	return `${state.projectName}:\r\n${lines.join("\r\n")}\r\nFinal Resources:\r\n${itemStrings.join("\r\n")}`;
}

export function exportAsLss(): string {
	//TODO
	return "";
}

export function exportAsJson(state: RouteState): string {
	return JSON.stringify(deflateRouteState(state));
}

export function importAsCompressed(str: string): [RouteState | null, string | null] {
	return decompressState(str);
}

export function importAsEncoded(str: string): [RouteState | null, string | null] {
	const compressed = inflateEncodedState(str);
	return decompressState(compressed);
}

export function importAsJson(str: string): [RouteState | null, string | null] {
	return [inflateRouteData(JSON.parse(str) as RouteData), null];
}

export function storeToLocalStorage(state: RouteState, settings: SettingState): void {
	const compressed = exportAsCompressed(state);
	localStorage.setItem(KEY, compressed);
	saveSettings(settings);
}

export function downloadToFile(projectName: string, str: string, extension: string): void {
	const blob = new Blob([str], { type: "text" });
	const a = document.createElement("a");
	const fileName = projectName + "." + extension;
	a.download = fileName;
	a.href = URL.createObjectURL(blob);
	a.dataset.downloadurl = ["text", a.download, a.href].join(":");
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}

export function clearLocalStorage(): void {
	OLD_KEYS.forEach(localStorage.removeItem);
	localStorage.removeItem(KEY);
}

export function loadfromLocalStorage(): [RouteState | undefined, SettingState | undefined] {
	const compressed = localStorage.getItem(KEY);
	const settingsString = localStorage.getItem(SETTING_KEY);
	let settings;
	if (settingsString === null) {
		console.error("Failed to load settings from localstorage");
		settings = undefined;
	} else {
		settings = JSON.parse(settingsString);
	}
	if (compressed === null) {
		console.error("Failed to load from localstorage");
		return [undefined, settings];
	}
	const [state, error] = importAsCompressed(compressed);
	if (error !== null || state === null) {
		console.error(`Failed to load from localstorage: ${error}`);
		return [undefined, settings];
	}
	return [state, settings];
}

export function saveSettings(settings: SettingState): void {
	localStorage.setItem(SETTING_KEY, JSON.stringify(settings));
}

export function readFromFile(file: File, callback: (content: string) => void): void {
	if (file) {
		const reader = new FileReader();
		reader.onloadend = () => {
			const str = reader.result;
			callback(str?.toString() || "");
		};
		reader.readAsText(file);
	}
}
