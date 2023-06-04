import { RouteBranch } from "data/branch";
import { RouteItem } from "data/item";

export type RouteState = {
	projectName: string,
	activeBranch: number,
	activeSplit: number,
	activeAction: number,
	branches: RouteBranch[],
	items: RouteItem[],
}