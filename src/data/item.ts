import { randomColor } from "util/color";
import { decodeLengthPrepended, encodeLengthPrepended } from "./compress";

export type ItemData = {
	name: string,
	color: string,
}

export type RouteItem = {
	name: string,
	color: string,
}

export type ItemDelta = {
	value: number,
	change: number,
}

export function newItem(): RouteItem {
	return {
		name: "",
		color: randomColor(),
	};
}

export function deflateRouteItem(item: RouteItem): ItemData {
	return {
		name: item.name || "",
		color: item.color || "",
	};
}

export function inflateItemData(item: ItemData): RouteItem {
	return {
		name: item.name || "",
		color: item.color || "",
	};
}

export function compressItem(item: ItemData): string {
	const { name, color } = item;
	const nameEncoded = encodeLengthPrepended(name.replace(/:/g, "_"));
	const colorEncoded = encodeLengthPrepended(color);
	return `${nameEncoded}${colorEncoded}`;
}

export function decompressItem(compressedString: string, currentIndex: number): [ItemData, number, string | null] {
	const [name, indexAfterName, nameError] = decodeLengthPrepended(compressedString, currentIndex);
	if (nameError !== null) {
		return [newItem(), -1, `Fail to decompress item name: ${nameError}`];
	}
	const [color, indexAfterColor, colorError] = decodeLengthPrepended(compressedString, indexAfterName);
	if (colorError !== null) {
		return [newItem(), -1, `Fail to decompress item color: ${nameError}`];
	}
	const item: ItemData = { name, color };
	return [item, indexAfterColor, null];
}