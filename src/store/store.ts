import { createSlice, configureStore } from "@reduxjs/toolkit";
import { RouteState } from "store/routing/type";
import routingReducers from "store/routing/reducers";
import applicationReducers from "store/application/reducers";
import settingReducers from "store/setting/reducers";
import testInitialState from "store/initial";
import { SettingState } from "store/setting/type";
import { ApplicationState } from "store/application/type";

export type ReduxGlobalState = {
	routeState: RouteState,
	settingState: SettingState,
	applicationState: ApplicationState,
};

const initialState = testInitialState as ReduxGlobalState;

const slice = createSlice({
	name: "state",
	initialState,
	reducers: {
		...routingReducers,
		...applicationReducers,
		...settingReducers,
	},
});

export const actions = slice.actions;

const store = configureStore({
	reducer: slice.reducer
});

export default store;
