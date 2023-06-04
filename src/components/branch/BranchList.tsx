import { connect, ConnectedProps } from "react-redux";
import Branch from "./Branch";

import {
	getBranchCount
} from "store/routing/selectors";
import {
	createBranch
} from "store/routing/actions";
import {
	setEditingNav,
	setInfo,
	markResourceDirtyAtSplit,
} from "store/application/actions";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { BRANCH_LIMIT } from "data/limit";
import { benchStart, benchEnd } from "util/benchmark";
import { AppAction } from "App";
import { ReduxGlobalState } from "store/store";

type ExternalProps = {
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState) => ({
	length: getBranchCount(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		createBranch,
		setEditingNav,
		setInfo,
		markResourceDirtyAtSplit,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const BranchList: React.FunctionComponent<Props> = ({ length, actions, appActions }: Props) => {
	// if (length === 0) {
	// 	return null;
	// }
	const branchNodes = [];
	for (let i = 0; i < length; i++) {
		branchNodes.push(<Branch
			index={i}
			key={i}
			appActions={appActions}
		/>);
	}
	return (
		<table>
			<tbody>
				{branchNodes}
				<tr key="new_branch_button">
					<td colSpan={11}>
						<button onClick={() => {
							if (length >= BRANCH_LIMIT) {
								const message = `You have reached the maximum number of branches (${BRANCH_LIMIT})`;
								appActions.showAlert(message);
								actions.setInfo({ info: message });
							} else {
								const startTime = benchStart();
								actions.createBranch({ branchIndex: length });
								actions.markResourceDirtyAtSplit({
									branchIndex: length,
									splitIndex: 0,
								});
								actions.setEditingNav({ editing: true });
								actions.setInfo({ info: `Branch created. (${benchEnd(startTime)} ms)` });
							}
						}}>New Branch</button>
					</td>
				</tr>

			</tbody>

		</table>
	);
};

export default connector(BranchList);