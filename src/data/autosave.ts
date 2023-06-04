import { setInfo } from "store/application/actions";
import store from "store/store";
import { storeToLocalStorage } from "./storage";

let handle: NodeJS.Timeout | undefined = undefined;

export function startAutoSaveClock(): void {
	stopAutoSaveClock();
	handle = setInterval(save, 20000);
}

export function stopAutoSaveClock(): void {
	if (handle !== undefined) {
		clearInterval(handle);
	}
}

function save() {
	if (!store.getState()) {
		return;
	}
	const state = store.getState();
	if (state.settingState.autoSave) {
		storeToLocalStorage(state.routeState, state.settingState);
		store.dispatch(setInfo({ info: `Last saved to local storage: ${new Date()}` }));
	}
}