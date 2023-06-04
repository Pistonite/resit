export type millisecond = number;

export function benchStart(): millisecond {
	return new Date().getTime();
}

export function benchEnd(start: millisecond): millisecond {
	return new Date().getTime() - start;
}