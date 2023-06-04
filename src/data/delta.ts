import { ActionResource } from "./resource_delta";

export type ActionDelta = Record<string, DeltaItem>;
export type DeltaItem = {
	type: DeltaType,
	value: number | string,
}
export type DeltaType = "add" | "set" | "ref_set" | "ref_add" | "ref_sub";
export type DeltaOperator = "+" | "-" | "=" | "?";
export type DeltaString = string;
export type CompressedDeltaString = string;
export type DeltaError = string | null;
type DeltaItemString = string;
type CompressedDeltaItemString = string;

export function deleteItemInDelta(deltas: ActionDelta, deleteName: string): void {
	for (const name in deltas) {
		if (deltas[name].type.startsWith("ref")) {
			if (deltas[name].value === deleteName) {
				delete deltas[name];
			}
		}
	}
	if (deleteName in deltas) {
		delete deltas[deleteName];
	}
}

export function renameItemInDelta(deltas: ActionDelta, oldName: string, newName: string): void {
	for (const name in deltas) {
		if (deltas[name].type.startsWith("ref")) {
			if (deltas[name].value === oldName) {
				deltas[name].value = newName;
			}
		}
	}
	if (oldName in deltas) {
		deltas[newName] = deltas[oldName];
		delete deltas[oldName];
	}
}

export function deltaToString(deltas: ActionDelta): DeltaString {
	const array = [];
	for (const name in deltas) {
		array.push(itemToString(name, deltas[name]));
	}
	return array.join(", ");
}

export function deltaToStringWithResources(deltas: ActionDelta, resources: ActionResource): DeltaString {
	const array = [];
	for (const name in deltas) {
		let itemDeltaString = itemToString(name, deltas[name]);
		if (name in resources) {
			itemDeltaString += `(${resources[name].value})`;
		}
		array.push(itemDeltaString);
	}
	return array.join(", ");
}

export function stringToDelta(str: DeltaString): [ActionDelta | null, DeltaError] {
	if (!str || !str.length) {
		return [{}, null];
	}
	if (!str.trim()) {
		return [{}, null];
	}

	const array = str.split(",").map(e => e.trim());
	const deltaObj: ActionDelta = {};
	const errors: string[] = [];
	array.forEach(str => {
		const [item, itemError] = stringToItem(str.trim() as DeltaItemString);
		if (item !== null) {
			if (item.name in deltaObj) {
				errors.push(`Duplicate: ${item.name}`);
			} else {
				deltaObj[item.name] = {
					type: item.type,
					value: item.value,
				};
			}

		} else {
			if (itemError !== null) {
				errors.push(itemError);
			}
		}
	});
	return errors.length > 0 ? [null, errors.join("; ")] : [deltaObj, null];
}

function itemToString(name: string, item: DeltaItem): DeltaItemString {
	const { type, value } = item;
	const [op, processedValue] = typeToOperator(type, value);
	let quantity = processedValue;
	if (type.startsWith("ref")) {
		quantity = `[${processedValue}]`;
	}
	return `[${name}]${op}${quantity}`;
}

function stringToItem(str: DeltaItemString): [(DeltaItem & { name: string }) | null, DeltaError] {
	//\[*?<name>](+|=|-)<quantity>
	if (!str || !str.length) {
		return [null, null];//no item, skip
	}
	if (!str.startsWith("[")) {
		return [null, `Invalid: ${str}`];
	}
	const nameEnd = str.indexOf("]");
	if (nameEnd < 0) {
		return [null, `Item name bracket not closed: ${str}`];
	}
	const name = str.substring(1, nameEnd);
	if (str.length <= nameEnd + 1) {
		return [null, `Item [${name}] missing operator and quantity`];
	}
	const op = str[nameEnd + 1];
	const value = str.substring(nameEnd + 2);
	if (value.length === 0) {
		return [null, `Item [${name}] has empty value`];
	}
	if (value.startsWith("[")) {
		if (!value.endsWith("]")) {
			return [null, `Item reference bracket not closed: ${value}`];
		}
		const ref = value.substring(1, value.length - 1);
		return parseRefItem(name, op as DeltaOperator, ref);
	} else {
		return parseValueItem(name, op as DeltaOperator, value);
	}
}

export function deltaToCompressedString(deltas: ActionDelta, itemMap: Record<string, number>): CompressedDeltaString {
	const array = [];
	for (const name in deltas) {
		array.push(itemToCompressedString(name, itemMap, deltas[name]));
	}
	return array.join(",");
}

export function compressedStringToDelta(str: CompressedDeltaString, inverseItemMap: string[]): [ActionDelta | null, DeltaError] {
	if (!str || !str.length) {
		return [{}, null];
	}
	if (!str.trim()) {
		return [{}, null];
	}

	const array = str.split(",").map(e => e.trim());
	const deltaObj: ActionDelta = {};
	const errors: string[] = [];
	array.forEach(str => {
		const [item, itemError] = compressedStringToItem(str.trim() as CompressedDeltaItemString, inverseItemMap);
		if (item !== null) {
			deltaObj[item.name] = {
				type: item.type,
				value: item.value,
			};
		} else {
			if (itemError !== null) {
				errors.push(itemError);
			}
		}
	});
	return errors.length > 0 ? [null, errors.join("; ")] : [deltaObj, null];
}

function itemToCompressedString(name: string, itemMap: Record<string, number>, item: DeltaItem): CompressedDeltaItemString {
	const { type, value } = item;
	const [op, processedValue] = typeToOperator(type, value);
	let quantity = processedValue;
	if (type.startsWith("ref")) {
		if (processedValue in itemMap) {
			quantity = `:${itemMap[processedValue]}`;
		} else {
			quantity = `:${processedValue}`;
		}
	}
	let ref: string | number = name;
	if (name in itemMap) {
		ref = itemMap[name];
	} else {
		ref = ref.replace(/:/g, "");
	}
	return `${ref}:${op}${quantity}`;
}

function compressedStringToItem(str: CompressedDeltaItemString, inverseItemMap: string[]): [(DeltaItem & { name: string }) | null, DeltaError] {
	if (!str || !str.length) {
		return [null, null];//no item, skip
	}
	const indexEnd = str.indexOf(":");
	if (indexEnd < 0) {
		return [null, `Item index not found: ${str}`];
	}
	const index = str.substring(0, indexEnd);
	if (str.length <= indexEnd + 1) {
		return [null, `Item [${index}] missing operator and quantity`];
	}
	const indexNum = Number(index);
	let name: string;
	if (!Number.isInteger(indexNum)) {
		name = index;
	} else if (indexNum < 0 || indexNum >= inverseItemMap.length) {
		return [null, `Invalid index: ${index}`];
	} else {
		name = inverseItemMap[indexNum];
	}

	const op = str[indexEnd + 1];
	const value = str.substring(indexEnd + 2);
	if (value.length === 0) {
		return [null, `Item [${name}] has empty value`];
	}

	if (value.startsWith(":")) {
		const refIndex = value.substring(1);
		const refIndexNum = Number(refIndex);
		let ref: string;
		if (!Number.isInteger(refIndexNum)) {
			ref = refIndex;
		} else if (refIndexNum < 0 || refIndexNum >= inverseItemMap.length) {
			return [null, `Invalid ref index: ${refIndex}`];
		} else {
			ref = inverseItemMap[refIndexNum];
		}
		return parseRefItem(name, op as DeltaOperator, ref);
	} else {
		return parseValueItem(name, op as DeltaOperator, value);
	}
}

export function typeToOperator(type: DeltaType, value: string | number): [DeltaOperator, string | number] {
	switch (type) {
		case "add":
			if (value >= 0) {
				return ["+", value];
			} else {
				return ["-", -value];
			}
		case "set":
		case "ref_set":
			return ["=", value];
		case "ref_add":
			return ["+", value];
		case "ref_sub":
			return ["-", value];
		default: return ["?", value];
	}
}

function parseRefItem(name: string, op: DeltaOperator, value: string): [(DeltaItem & { name: string }) | null, DeltaError] {
	let type: DeltaType;
	switch (op) {
		case "+": type = "ref_add"; break;
		case "-": type = "ref_sub"; break;
		case "=": type = "ref_set"; break;
		default: return [null, `Item [${name}]: unknown operator "${op}"`];
	}
	return [{
		name,
		type,
		value,
	}, null];
}

function parseValueItem(name: string, op: DeltaOperator, value: string): [(DeltaItem & { name: string }) | null, DeltaError] {
	let type: DeltaType;
	let num = Number(value);
	if (!Number.isInteger(num)) {
		return [null, `Item [${name}]: invalid quantity "${value}`];
	}
	switch (op) {
		case "+": type = "add"; break;
		case "-": type = "add"; num = -num; break;
		case "=": type = "set"; break;
		default: return [null, `Item [${name}]: unknown operator "${op}"`];
	}
	return [{
		name,
		type,
		value: num,
	}, null];
}