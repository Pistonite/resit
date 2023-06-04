import ActionList from "components/action/ActionList";
import {
	getActiveSplitName,
} from "store/routing/selectors";
import { connect, ConnectedProps } from "react-redux";
import { AppAction } from "App";
import { ReduxGlobalState } from "store/store";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import {
	isEditingActions
} from "store/application/selectors";
import {
	setEditingActions
} from "store/application/actions";
import {
	changeActiveSplit,
	setActiveSplitName,
} from "store/routing/actions";
import { BoxLayout, SplitLayout } from "components/Layout";

type ExternalProps = {
	appActions: AppAction
}
const mapStateToProps = (state: ReduxGlobalState) => {
	return {
		splitName: getActiveSplitName(state),
		editing: isEditingActions(state),
	};
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setEditingActions,
		changeActiveSplit,
		setActiveSplitName,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps

export const Actions: React.FunctionComponent<Props> = ({
	editing, splitName, appActions, actions
}: Props) => {

	const buttonSection = splitName !== undefined &&
		<span>
			<button className="space-left-small" onClick={() => {
				actions.setEditingActions({ editing: !editing });
			}}>
				{editing ? "Finish" : "Edit"}
			</button>
			<button className="space-left-small" onClick={() => {
				actions.changeActiveSplit({ changeBy: -1 });
			}}>Previous Split</button>
			<button className="space-left-small" onClick={() => {
				actions.changeActiveSplit({ changeBy: 1 });
			}}>Next Split</button>
		</span>;

	let splitNameSection = undefined;
	if (splitName !== undefined && editing) {
		splitNameSection =
			<input
				type="text"
				placeholder="Split Name"
				value={splitName}
				onChange={(e) => {
					actions.setActiveSplitName({ name: e.target.value });
				}}
			/>;
	} else {
		splitNameSection = splitName && " - " + splitName;
	}

	return (
		<SplitLayout size="2rem" className="component border">
			<BoxLayout className="component header-border">
				<strong> Split Detail {splitNameSection}</strong>
				{buttonSection}
			</BoxLayout>
			<BoxLayout className="overflow-auto">
				<ActionList appActions={appActions} />
			</BoxLayout>
		</SplitLayout>
	);
};

export default connector(Actions);