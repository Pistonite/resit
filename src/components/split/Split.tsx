import { connect, ConnectedProps } from "react-redux";
import ActionSummary from "components/action/ActionSummary";
import ExpandButton from "components/ExpandButton";
import {
	getBranchCount,
	getSplitCount,
	getSplitName,
	isSplitExpanded,
	getSplit,
	getActionCount,
} from "store/routing/selectors";
import { isEditingNav } from "store/application/selectors";
import {
	setSplitExpanded,
	setSplitName,
	deleteSplit,
	breakBranchAt,
	createSplit,
	swapSplits,
	moveFirstSplitToPreviousBranch,
	moveLastSplitToNextBranch,
	setActiveBranchAndSplit,
} from "store/routing/actions";
import {
	setInfo,
	setSplitClipboard,
	setEditingActions,
	setEditingNav,
	markResourceDirtyAtSplit,
	setShowingHelp,
} from "store/application/actions";
import { getSplitClipboard } from "store/application/selectors";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { benchStart, benchEnd } from "util/benchmark";
import { SPLIT_LIMIT } from "data/limit";
import { AppAction } from "App";
import { RouteSplit } from "data/split";
import { ReduxGlobalState } from "store/store";

type ExternalProps = {
	branchIndex: number,
	splitIndex: number,
	appActions: AppAction,
}
const mapStateToProps = (state: ReduxGlobalState, { branchIndex, splitIndex }: ExternalProps) => ({
	name: getSplitName(state, branchIndex, splitIndex),
	expanded: isSplitExpanded(state, branchIndex, splitIndex),
	isLastBranch: getBranchCount(state) === branchIndex + 1,
	editing: isEditingNav(state),
	copiedSplit: getSplitClipboard(state),
	splitToCopy: getSplit(state, branchIndex, splitIndex),
	splitCount: getSplitCount(state, branchIndex),
	actionInSplitCount: getActionCount(state, branchIndex, splitIndex),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setSplitExpanded,
		setSplitName,
		breakBranchAt,
		setInfo,
		deleteSplit,
		createSplit,
		setSplitClipboard,
		swapSplits,
		moveFirstSplitToPreviousBranch,
		moveLastSplitToNextBranch,
		setActiveBranchAndSplit,
		setEditingActions,
		markResourceDirtyAtSplit,
		setShowingHelp,
		setEditingNav,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const Split: React.FunctionComponent<Props> = ({
	branchIndex, splitIndex, name, expanded, isLastBranch, editing, actions, appActions, copiedSplit, splitToCopy, splitCount, actionInSplitCount,
}: Props) => {
	const isLast = splitIndex === splitCount - 1;
	const isFirstBranch = branchIndex === 0;
	const isFirst = splitIndex === 0;
	const displayName = name || "[Unnamed Split]";
	const expandButtonCell =
		<td className="icon-button-width">
			{actionInSplitCount > 0 &&
				<ExpandButton expanded={expanded} setExpanded={(expanded: boolean) => {
					actions.setSplitExpanded({ branchIndex, splitIndex, expanded });
				}} />
			}

		</td>;
	const handleCreateSplit = (templateSplit?: RouteSplit) => {
		if (splitCount >= SPLIT_LIMIT) {
			const message = `You have reached the maximum number of splits per branch (${SPLIT_LIMIT})`;
			appActions.showAlert(message, undefined);
			actions.setInfo({ info: message });
		} else {
			const startTime = benchStart();
			actions.createSplit({
				branchIndex: branchIndex,
				splitIndex: splitIndex + 1,
				templateSplit: templateSplit,
			});
			actions.markResourceDirtyAtSplit({
				branchIndex: branchIndex,
				splitIndex: splitIndex,
			});
			actions.setEditingNav({ editing: true });
			actions.setInfo({ info: `Split created. (${benchEnd(startTime)} ms)` });
		}
	};
	let splitNode;
	if (editing) {
		splitNode =
			<tr>
				<td className="icon-button-width">
					<button className="icon-button" title="Break branch" onClick={() => {
						const startTime = benchStart();
						actions.breakBranchAt({ branchIndex, splitIndex });
						actions.setInfo({ info: `Branch broken. (${benchEnd(startTime)} ms)` });
					}}>{"/"}</button>
				</td>
				<td colSpan={4}>
					<input
						className="full-width"
						placeholder="Split Name"
						type="text"
						value={name}
						onChange={(e) => {
							actions.setSplitName({ branchIndex, splitIndex, name: e.target.value });
						}} />
				</td>

				<td className="icon-button-width">
					{!(isFirst && isFirstBranch) &&
						<button className="icon-button" disabled={isFirst && isFirstBranch} title="Move up" onClick={() => {
							const startTime = benchStart();
							if (isFirst) {
								actions.moveFirstSplitToPreviousBranch({ branchIndex });
								actions.setInfo({ info: `Split moved into previous branch. (${benchEnd(startTime)} ms)` });
							} else {
								actions.swapSplits({ branchIndex, i: splitIndex, j: splitIndex - 1 });
								actions.markResourceDirtyAtSplit({
									branchIndex: branchIndex,
									splitIndex: splitIndex - 1,
								});
								actions.setInfo({ info: `Split moved. (${benchEnd(startTime)} ms)` });
							}
						}} >&uarr;</button>
					}

				</td>
				<td className="icon-button-width">
					{!(isLast && isLastBranch) &&
						<button className="icon-button" title="Move down" disabled={isLast && isLastBranch} onClick={() => {
							const startTime = benchStart();
							if (isLast) {
								actions.moveLastSplitToNextBranch({ branchIndex });
								actions.setInfo({ info: `Split moved into next branch. (${benchEnd(startTime)} ms)` });
							} else {
								actions.swapSplits({ branchIndex, i: splitIndex, j: splitIndex + 1 });
								actions.markResourceDirtyAtSplit({
									branchIndex: branchIndex,
									splitIndex: splitIndex,
								});
								actions.setInfo({ info: `Split moved. (${benchEnd(startTime)} ms)` });
							}
						}} >&darr;</button>
					}

				</td>
				<td className="icon-button-width">
					<button className="icon-button" title="Copy" onClick={() => {
						const startTime = benchStart();
						actions.setSplitClipboard({ split: splitToCopy });
						actions.setInfo({ info: `Split copied. (${benchEnd(startTime)} ms)` });
					}} >c</button>
				</td>
				<td className="icon-button-width">
					{copiedSplit !== undefined &&
						<button className="icon-button" title="Paste Split Below" disabled={copiedSplit === undefined} onClick={() => {
							handleCreateSplit(copiedSplit);
						}} >p</button>
					}

				</td>
				<td className="icon-button-width">
					<button className="icon-button" title="Delete" onClick={() => {
						appActions.showAlert(
							`Delete split "${name}"? All actions inside this split will also be deleted. This is NOT reversible!`,
							[{
								name: "Cancel"
							}, {
								name: "Delete",
								execute: () => {
									const startTime = benchStart();
									actions.deleteSplit({ branchIndex, splitIndex });
									actions.markResourceDirtyAtSplit({
										branchIndex: branchIndex,
										splitIndex: splitIndex,
									});
									actions.setInfo({ info: `Split deleted. (${benchEnd(startTime)} ms)` });
								}
							}]
						);
					}}>X</button>
				</td>
				<td className="icon-button-width">
					<button className="icon-button" title="New Split Below" onClick={() => {
						handleCreateSplit(undefined);
					}}>*</button>
				</td>
			</tr>;
	} else {
		splitNode =
			<tr>
				<td className="icon-button-width" />
				{expandButtonCell}
				<td colSpan={9}>
					<u className="split-link" onClick={() => {
						actions.setActiveBranchAndSplit({
							activeBranch: branchIndex,
							activeSplit: splitIndex,
						});
						actions.setEditingActions({ editing: false });
						actions.setShowingHelp({ showHelp: false });
					}}>{displayName}</u>
				</td>
			</tr>;
	}
	if (!expanded || editing) {
		return splitNode;
	}

	return <>{splitNode}<ActionSummary branchIndex={branchIndex} splitIndex={splitIndex} /></>;
};

export default connector(Split);