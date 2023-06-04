import { connect, ConnectedProps } from "react-redux";
import ExpandButton from "../ExpandButton";
import SplitList from "components/split/SplitList";
import {
	isBranchExpanded,
	getBranchName,
	getBranchCount
} from "store/routing/selectors";
import {
	createBranch,
	setBranchName,
	setBranchExpanded,
	deleteBranch,
	swapBranches,
} from "store/routing/actions";
import { isEditingNav } from "store/application/selectors";
import {
	setInfo,
	setEditingNav,
	markResourceDirtyAtSplit,
} from "store/application/actions";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { benchEnd, benchStart } from "util/benchmark";
import { AppAction } from "App";
import { ReduxGlobalState } from "store/store";
import { BRANCH_LIMIT } from "data/limit";

type ExternalProps = {
	index: number,
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState, { index }: ExternalProps) => ({
	name: getBranchName(state, index),
	expanded: isBranchExpanded(state, index),
	editing: isEditingNav(state),
	branchCount: getBranchCount(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		createBranch,
		setBranchName,
		setBranchExpanded,
		deleteBranch,
		setInfo,
		swapBranches,
		setEditingNav,
		markResourceDirtyAtSplit,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const Branch: React.FunctionComponent<Props> = ({ index, name, expanded, editing, actions, branchCount, appActions }: Props) => {
	const displayName = name || "[Unnamed Branch]";
	const isFirst = index === 0;
	const isLast = index === branchCount - 1;
	const expandButtonCell =
		<td className="icon-button-width">
			<ExpandButton expanded={expanded} setExpanded={(expanded) => {
				actions.setBranchExpanded({ branchIndex: index, expanded });
			}} />
		</td>;
	let branchNode;
	const nameField =
		<input
			className="full-width"
			placeholder="Branch Name"
			type="text"
			value={name}
			onChange={(e) => {
				actions.setBranchName({ branchIndex: index, name: e.target.value });
			}}
		/>;
	if (editing && !expanded) {
		branchNode =
			<tr>
				{expandButtonCell}
				<td colSpan={6}>
					{nameField}
				</td>
				<td className="icon-button-width">
					{!isFirst &&
						<button className="icon-button" title="Move up" disabled={isFirst} onClick={() => {
							const startTime = benchStart();
							actions.swapBranches({ i: index, j: index - 1 });
							actions.markResourceDirtyAtSplit({
								branchIndex: index - 1,
								splitIndex: 0,
							});
							actions.setInfo({ info: `Branch moved. (${benchEnd(startTime)} ms)` });
						}}>&uarr;</button>
					}
				</td>
				<td className="icon-button-width">
					{!isLast &&
						<button className="icon-button" title="Move down" disabled={isLast} onClick={() => {
							const startTime = benchStart();
							actions.swapBranches({ i: index, j: index + 1 });
							actions.markResourceDirtyAtSplit({
								branchIndex: index,
								splitIndex: 0,
							});
							actions.setInfo({ info: `Branch moved. (${benchEnd(startTime)} ms)` });
						}}>&darr;</button>
					}
				</td>
				<td className="icon-button-width">
					<button className="icon-button" title="Delete" onClick={() => {
						appActions.showAlert(
							`Delete branch "${name}"? All splits inside this branch will also be deleted. This is NOT reversible!`,
							[{
								name: "Cancel"
							}, {
								name: "Delete",
								execute: () => {
									const startTime = benchStart();
									actions.deleteBranch({ branchIndex: index });
									actions.markResourceDirtyAtSplit({
										branchIndex: index,
										splitIndex: 0,
									});
									actions.setInfo({ info: `Branch deleted. (${benchEnd(startTime)} ms)` });
								}
							}]
						);
					}}>X</button>
				</td>
				<td className="icon-button-width">
					<button className="icon-button" title="New Branch Below" onClick={() => {
						if (branchCount >= BRANCH_LIMIT) {
							const message = `You have reached the maximum number of branches (${BRANCH_LIMIT})`;
							appActions.showAlert(message);
							actions.setInfo({ info: message });
						} else {
							const startTime = benchStart();
							actions.createBranch({ branchIndex: index + 1 });
							actions.markResourceDirtyAtSplit({
								branchIndex: index + 1,
								splitIndex: 0,
							});
							actions.setEditingNav({ editing: true });
							actions.setInfo({ info: `Branch created. (${benchEnd(startTime)} ms)` });
						}
					}}>*</button>
				</td>
			</tr>;
	} else if (editing) {
		branchNode =
			<tr>
				{expandButtonCell}
				<td colSpan={6}>
					{nameField}
				</td>
				<td colSpan={4}>
					<em>collapse to edit</em>
				</td>
			</tr>;
	} else {
		branchNode =
			<tr>
				{expandButtonCell}
				<td colSpan={10}>
					<strong>{displayName}</strong>
				</td>
			</tr>;
	}
	if (!expanded) {
		return branchNode;
	}
	return <>
		{branchNode}
		<SplitList
			branchIndex={index}
			appActions={appActions}
		/>
	</>;

};

export default connector(Branch);