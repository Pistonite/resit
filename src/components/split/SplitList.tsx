import { connect, ConnectedProps } from "react-redux";
import Split from "./Split";
// import { createSplitAt, mergeNextBranchWithCurrentBranch } from "../../data";
import {
	getBranchCount,
	getBranchName,
	getSplitCount
} from "store/routing/selectors";
import { getSplitClipboard, isEditingNav } from "store/application/selectors";
import {
	createSplit,
	mergeNextIntoBranch,
} from "store/routing/actions";
import {
	setInfo,
	markResourceDirtyAtSplit,
	setEditingNav,
} from "store/application/actions";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { benchEnd, benchStart } from "util/benchmark";
import { SPLIT_LIMIT } from "data/limit";
import { RouteSplit } from "data/split";
import { AppAction } from "App";
import { ReduxGlobalState } from "store/store";

type ExternalProps = {
	branchIndex: number,
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState, { branchIndex }: ExternalProps) => ({
	length: getSplitCount(state, branchIndex),
	editing: isEditingNav(state),
	isLastBranch: getBranchCount(state) === branchIndex + 1,
	currentBranchName: getBranchName(state, branchIndex),
	nextBranchName: branchIndex === getBranchCount(state) - 1 ? undefined : getBranchName(state, branchIndex + 1),
	copiedSplit: getSplitClipboard(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		createSplit,
		setInfo,
		mergeNextIntoBranch,
		markResourceDirtyAtSplit,
		setEditingNav,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const SplitList: React.FunctionComponent<Props> = ({
	branchIndex, isLastBranch, length, editing, copiedSplit, currentBranchName, nextBranchName, actions, appActions
}: Props) => {
	const splitNodes = [];
	for (let i = 0; i < length; i++) {
		splitNodes.push(<Split
			key={`split_${i}_`}
			branchIndex={branchIndex}
			splitIndex={i}
			appActions={appActions}
		/>);
	}
	const handleCreateSplit = (templateSplit?: RouteSplit) => {
		if (length >= SPLIT_LIMIT) {
			const message = `You have reached the maximum number of splits per branch (${SPLIT_LIMIT})`;
			appActions.showAlert(message);
			actions.setInfo({ info: message });
		} else {
			const startTime = benchStart();
			actions.createSplit({
				branchIndex: branchIndex,
				splitIndex: length,
				templateSplit: templateSplit,
			});
			actions.markResourceDirtyAtSplit({
				branchIndex: branchIndex,
				splitIndex: length,
			});
			actions.setEditingNav({ editing: true });
			actions.setInfo({ info: `Split created. (${benchEnd(startTime)} ms)` });
		}
	};
	return <>
		{splitNodes}
		<tr>
			<td className="icon-button-width">
				{editing && !isLastBranch &&
					<button className="icon-button" title="Merge branch" disabled={isLastBranch} onClick={() => {
						appActions.showAlert(
							`Merge branch "${nextBranchName}" into "${currentBranchName}"?`,
							[{
								name: "Cancel"
							}, {
								name: "Merge",
								execute: () => {
									const startTime = benchStart();
									actions.mergeNextIntoBranch({ branchIndex });
									actions.setInfo({ info: `Branch merged. (${benchEnd(startTime)} ms)` });
								}
							}]
						);
					}}>^</button>
				}
			</td>
			<td colSpan={10}>
				<button onClick={() => {
					handleCreateSplit(undefined);
				}}>New Split</button>
				<button className="space-left-small" disabled={copiedSplit === undefined} onClick={() => {
					handleCreateSplit(copiedSplit);
				}}>Paste Split</button>
			</td>
		</tr>
	</>;
};

export default connector(SplitList);