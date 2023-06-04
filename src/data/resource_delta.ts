import { ActionDelta } from "./delta";

export type ActionResource = Record<string, ActionResourceItem>
export type ActionResourceItem = {
	value: number,
	change: number,
}
export function calculateChange(before: ActionResource, deltas: ActionDelta): ActionResource {
	const getAmountInBefore = (n: string) => n in before ? before[n].value : 0;
	const after: ActionResource = {};
	for (const name in before) {
		after[name] = {
			value: before[name].value,
			change: 0,
		};
	}
	for (const name in deltas) {
		const { type, value } = deltas[name];
		const oldAmount = getAmountInBefore(name);
		let newAmount: number;
		let change: number;
		switch (type) {
			case "add":
				change = Number(value) ?? 0;
				newAmount = oldAmount + change;
				break;
			case "set":
				newAmount = Number(value) ?? 0;
				change = newAmount - oldAmount;
				break;
			case "ref_add":
				change = getAmountInBefore(value.toString());
				newAmount = oldAmount + change;
				break;
			case "ref_sub":
				change = -getAmountInBefore(value.toString());
				newAmount = oldAmount + change;
				break;
			case "ref_set":
				newAmount = getAmountInBefore(value.toString());
				change = newAmount - oldAmount;
		}
		after[name] = {
			value: newAmount,
			change,
		};
	}
	return after;
}