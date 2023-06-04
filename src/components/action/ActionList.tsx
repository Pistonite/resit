import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { AppAction } from "App";
import { connect, ConnectedProps } from "react-redux";
import {
	getActiveSplit,
	getActiveSplitActionCount
} from "store/routing/selectors";
import {
	createAction,
} from "store/routing/actions";
import {
	setEditingActions,
	setInfo,
	markResourceDirtyAtSplit,
} from "store/application/actions";
import { ReduxGlobalState } from "store/store";

import ActionItem from "./ActionItem";
import { ACTION_LIMIT } from "data/limit";
import { benchStart, benchEnd } from "util/benchmark";

type ExternalProps = {
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState) => ({
	active: getActiveSplit(state) >= 0,
	length: getActiveSplitActionCount(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		createAction,
		setEditingActions,
		setInfo,
		markResourceDirtyAtSplit,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const ActionList: React.FunctionComponent<Props> = ({ length, active, actions, appActions }: Props) => {
	if (!active || length === undefined) {
		return <span>Click on a split to view its details</span>;
	}
	const actionNodes = [];
	for (let i = 0; i < length; i++) {
		actionNodes.push(<ActionItem
			key={i}
			index={i}
			appActions={appActions}
		/>);
	}
	return (
		<table>
			<tbody>
				{actionNodes}
				<tr key="new_action_button">
					<td colSpan={7}>
						<button onClick={() => {
							if (length >= ACTION_LIMIT) {
								const message = `You have reached the maximum number of actions per split (${ACTION_LIMIT})`;
								appActions.showAlert(message);
								actions.setInfo({ info: message });
							} else {
								const startTime = benchStart();
								actions.createAction({ actionIndex: length });
								actions.markResourceDirtyAtSplit({});
								actions.setEditingActions({ editing: true });
								actions.setInfo({ info: `Action created. (${benchEnd(startTime)} ms)` });
							}
						}}>Add Action/Notes</button>
					</td>
				</tr>
			</tbody>
		</table>
	);
};

export default connector(ActionList);