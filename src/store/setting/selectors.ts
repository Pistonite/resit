import { ReduxGlobalState } from "store/store";
import { SettingState } from "./type";

export function getSettingState(state: ReduxGlobalState): SettingState {
	return state.settingState;
}

export function isAutoSaveEnabled(state: ReduxGlobalState): boolean {
	return getSettingState(state).autoSave;
}
export function shouldOnlyShowChangedItem(state: ReduxGlobalState): boolean {
	return getSettingState(state).onlyShowChangedItems;
}

export function shouldHideEmptyItems(state: ReduxGlobalState): boolean {
	return getSettingState(state).hideEmptyItems;
}

export function getItemFilter(state: ReduxGlobalState): string {
	return getSettingState(state).itemFilter;
}
