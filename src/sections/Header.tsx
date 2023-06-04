import { connect, ConnectedProps } from "react-redux";
import ExpandButton from "components/ExpandButton";
import {
	isEditingNav,
	isHeaderCollapsed,
	isSideSectionCollapsed
} from "store/application/selectors";
import {
	getProjectName, getRouteState
} from "store/routing/selectors";
import {
	getSettingState,
	isAutoSaveEnabled,
} from "store/setting/selectors";
import {
	setHeaderCollapsed,
	setInfo,
	setShowingHelp,
	setEditingActions,
	setEditingItems,
	setEditingNav,
} from "store/application/actions";
import {
	setAutoSaveEnabled
} from "store/setting/actions";
import {
	setProjectName,
	setRouteState,
} from "store/routing/actions";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { AppAction } from "App";
import { ReduxGlobalState } from "store/store";
import { benchEnd, benchStart } from "util/benchmark";
import { newEmptyRouteState, saveSettings, storeToLocalStorage } from "data/storage";

type ExternalProps = {
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState) => ({
	projectName: getProjectName(state),
	autoSaveEnabled: isAutoSaveEnabled(state),
	sideCollapsed: isSideSectionCollapsed(state),
	headerCollapsed: isHeaderCollapsed(state),
	routeState: getRouteState(state),
	settingState: getSettingState(state),
	editing: isEditingNav(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setHeaderCollapsed,
		setInfo,
		setAutoSaveEnabled,
		setProjectName,
		setShowingHelp,
		setEditingActions,
		setEditingItems,
		setEditingNav,
		setRouteState,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const Header: React.FunctionComponent<Props> = ({
	autoSaveEnabled, projectName, headerCollapsed, sideCollapsed, actions, routeState, settingState, editing, appActions,
}) => {

	const exportButton = <button className="vertical-center space-left-small" onClick={() => appActions.showIODialog()}>Import/Export</button>;

	const saveButton = <button className="vertical-center space-left-small" onClick={() => {
		const start = benchStart();
		storeToLocalStorage(routeState, settingState);
		actions.setEditingActions({ editing: false });
		actions.setEditingItems({ editing: false });
		actions.setEditingNav({ editing: false });
		actions.setInfo({ info: `Project saved to local storage. (${benchEnd(start)} ms)` });
	}}>Save</button>;

	const helpButton = <button className="vertical-center space-left-small" onClick={() => {
		actions.setShowingHelp({ showHelp: true });
	}}>Help</button>;

	const buttonSection =
		<span>
			{exportButton}
			{saveButton}
			{helpButton}
			<button className="vertical-center space-left-small" onClick={() => {
				const enabled = !autoSaveEnabled;
				actions.setAutoSaveEnabled({ enabled });
				const settings = { ...settingState, autoSave: enabled };
				saveSettings(settings);
			}}>{autoSaveEnabled ? "Auto Save: Enabled" : "Auto Save: Disabled"}</button>
			<button className="vertical-center space-left-small" disabled>Force Update Resources</button>

			<button className="vertical-center space-left-small" onClick={() => {
				appActions.showAlert("Do you really want to delete everything? This is not reversible!!!", [
					{
						name: "Cancel"
					}, {
						name: "Reset",
						execute: () => {
							const start = benchStart();
							const state = newEmptyRouteState();
							actions.setRouteState({ routeState: state });
							actions.setInfo({ info: `Reset completed. (${benchEnd(start)} ms)` });
						}
					}
				]);
			}}>Reset</button>
		</span>;

	const allButtons =
		<span>
			{!headerCollapsed && buttonSection}
			{headerCollapsed && <>{exportButton}{saveButton}{helpButton}</>}
		</span>;
	let projectNameSection;
	if (editing) {
		projectNameSection =
			<input
				type="text"
				value={projectName}
				onChange={(e) => {
					actions.setProjectName({ projectName: e.target.value });
				}}
			/>;
	} else {
		projectNameSection = projectName;
	}

	return (
		<div className="overflow-hidden">

			{
				!sideCollapsed && <h3 className="overflow-hidden">
					{projectNameSection}

				</h3>
			}

			<ExpandButton expanded={!headerCollapsed} setExpanded={(expanded) => actions.setHeaderCollapsed({ collapsed: !expanded })} />

			{!sideCollapsed && allButtons}

		</div>

	);
};

export default connector(Header);