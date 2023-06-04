import { connect, ConnectedProps } from "react-redux";
import DeltaList from "./DeltaList";
import {
	getActiveSplitActionCount,
	getActiveSplitActionDeltaError,
	getActiveSplitActionDeltas,
	getActiveSplitActionDeltaString,
	getActiveSplitActionName,
	isActiveSplitActionExpanded
} from "store/routing/selectors";
import { AppAction } from "App";
import { ReduxGlobalState } from "store/store";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import React from "react";
import ExpandButton from "components/ExpandButton";
import { isEditingActions } from "store/application/selectors";
import { ACTION_LIMIT } from "data/limit";
import {
	setEditingActions,
	setInfo,
	markResourceDirtyAtSplit,
} from "store/application/actions";
import {
	createAction,
	setActionName,
	setActionExpanded,
	deleteAction,
	swapActions,
	setActionDeltaString,
	setActiveAction,
} from "store/routing/actions";
import { benchStart, benchEnd } from "util/benchmark";

type ExternalProps = {
	index: number,
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState, { index }: ExternalProps) => ({
	name: getActiveSplitActionName(state, index),
	expanded: isActiveSplitActionExpanded(state, index),
	length: getActiveSplitActionCount(state),
	deltaString: getActiveSplitActionDeltaString(state, index),
	deltaError: getActiveSplitActionDeltaError(state, index),
	deltas: getActiveSplitActionDeltas(state, index),
	editing: isEditingActions(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setInfo,
		createAction,
		setEditingActions,
		setActionName,
		setActionExpanded,
		deleteAction,
		swapActions,
		setActionDeltaString,
		markResourceDirtyAtSplit,
		setActiveAction,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type Props = ConnectedProps<typeof connector> & ExternalProps;

export const ActionItem: React.FunctionComponent<Props> = ({
	index, name = "", expanded = false, editing, actions, deltaString = "", length = 0, appActions,
}: Props) => {
	const displayName = name || "[Unnamed Action]";
	const isFirst = index === 0;
	const isLast = index === length - 1;
	const expandButton =
		<td className="icon-button-width">
			{deltaString &&
				<ExpandButton expanded={expanded} setExpanded={(expanded) => {
					actions.setActionExpanded({ actionIndex: index, expanded });
				}} />
			}
		</td>;
	let actionNode;
	if (editing) {
		actionNode =
			<tr>
				{expandButton}
				<td className="icon-button-width">
					{!isFirst &&
						<button className="icon-button" disabled={isFirst} title="Move up" onClick={() => {
							const startTime = benchStart();
							actions.swapActions({ i: index, j: index - 1 });
							actions.markResourceDirtyAtSplit({});
							actions.setInfo({ info: `Action moved. (${benchEnd(startTime)} ms)` });
						}}>&uarr;</button>
					}
				</td>
				<td className="icon-button-width">
					{!isLast &&
						<button className="icon-button" title="Move down" disabled={isLast} onClick={() => {
							const startTime = benchStart();
							actions.swapActions({ i: index, j: index + 1 });
							actions.markResourceDirtyAtSplit({});
							actions.setInfo({ info: `Action moved. (${benchEnd(startTime)} ms)` });
						}}>&darr;</button>
					}
				</td>
				<td className="icon-button-width">
					<button className="icon-button" title="Delete" onClick={() => {
						appActions.showAlert(
							`Delete action "${name}"? This is NOT reversible!`,
							[{
								name: "Cancel"
							}, {
								name: "Delete",
								execute: () => {
									const startTime = benchStart();
									actions.markResourceDirtyAtSplit({});
									actions.deleteAction({ actionIndex: index });
									actions.setInfo({ info: `Action deleted. (${benchEnd(startTime)} ms)` });
								}
							}]
						);

					}}>X</button>
				</td>
				<td className="icon-button-width">
					<button className="icon-button" title="New Action Below" onClick={() => {
						if (length >= ACTION_LIMIT) {
							const message = `You have reached the maximum number of actions per split (${ACTION_LIMIT})`;
							appActions.showAlert(message);
							actions.setInfo({ info: message });
						} else {
							const startTime = benchStart();
							actions.createAction({ actionIndex: index + 1 });
							actions.markResourceDirtyAtSplit({});
							actions.setEditingActions({ editing: true });
							actions.setInfo({ info: `Action created. (${benchEnd(startTime)} ms)` });
						}
					}}>*</button>
				</td>
				<td className="action-name-width">
					<input
						className="action-name-width"
						placeholder="Action Title/Notes"
						type="text"
						value={name}
						onChange={(e) => {
							actions.setActionName({ actionIndex: index, name: e.target.value });
						}} />
				</td>
				<td>
					<input
						className="full-width"
						placeholder="Delta String"
						type="text"
						value={deltaString}
						onChange={(e) => {
							actions.setActionDeltaString({ actionIndex: index, deltaString: e.target.value });
							actions.markResourceDirtyAtSplit({});
						}} />
				</td>

			</tr>;
	} else {
		actionNode =
			<tr>
				{expandButton}
				<td colSpan={6}>
					<span>{deltaString ? <u className="split-link" onClick={() => {
						actions.setActiveAction({ activeAction: index });
					}}>{displayName}</u> : <em>{displayName}</em>}
					</span>
					{!deltaString && <div className="action-note-spacer" />}
				</td>
			</tr>;
	}

	if (!expanded || !deltaString) {
		return actionNode;
	}

	return <>
		{actionNode}
		<DeltaList actionIndex={index} />
	</>;
};

export default connector(ActionItem);