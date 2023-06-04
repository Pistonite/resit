import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { getForegroundAndBackground } from "util/color";

import {
	getItemColorByIndex,
	getItemCount,
	getItemNameByIndex
} from "store/routing/selectors";
import {
	createItem,
	setItemName,
	setItemColor,
	deleteItem,
	swapItems,
	reparseAllDeltaStrings,
} from "store/routing/actions";
import {
	setInfo,
	markResourceDirtyAt,
} from "store/application/actions";
import { ReduxGlobalState } from "store/store";
import { connect, ConnectedProps } from "react-redux";
import { AppAction } from "App";
import { benchEnd, benchStart } from "util/benchmark";
import { ITEM_LIMIT } from "data/limit";
import { useState } from "react";

type ExternalProps = {
	index: number,
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState, ownProps: ExternalProps) => {
	const color = getItemColorByIndex(state, ownProps.index);
	const [foreground, background] = getForegroundAndBackground(color);
	return {
		name: getItemNameByIndex(state, ownProps.index),
		color,
		background,
		foreground,
		itemCount: getItemCount(state),
	};
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		createItem,
		setItemName,
		setItemColor,
		setInfo,
		deleteItem,
		swapItems,
		markResourceDirtyAt,
		reparseAllDeltaStrings,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

const ItemEdit: React.FunctionComponent<Props> = ({ name, color, foreground, background, index, itemCount, actions, appActions }) => {
	const isLast = index === itemCount - 1;
	const isFirst = index === 0;
	const [renamed, setRenamed] = useState("");
	return (
		<tr>
			<td className="icon-button-width">
				{!isFirst &&
					<button className="icon-button" disabled={isFirst} title="Move up" onClick={() => {
						const startTime = benchStart();
						actions.swapItems({ i: index, j: index - 1 });
						actions.setInfo({ info: `Item moved. (${benchEnd(startTime)} ms)` });
					}}>&uarr;</button>
				}

			</td>

			<td className="icon-button-width">
				{!isLast &&
					<button className="icon-button" title="Move down" disabled={isLast} onClick={() => {
						const startTime = benchStart();
						actions.swapItems({ i: index, j: index + 1 });
						actions.setInfo({ info: `Item moved. (${benchEnd(startTime)} ms)` });
					}}>&darr;</button>
				}

			</td>

			<td className="icon-button-width">
				<button className="icon-button" title="Delete" onClick={() => {
					appActions.showAlert(
						`Delete item "${name}"? This item will also be removed from actions that currently have it. This is NOT reversible!`,
						[{
							name: "Cancel"
						}, {
							name: "Delete",
							execute: () => {
								const startTime = benchStart();
								actions.deleteItem({ index });
								actions.reparseAllDeltaStrings();
								actions.markResourceDirtyAt({ globalIndex: 0 });
								actions.setInfo({ info: `Item deleted. (${benchEnd(startTime)} ms)` });
							}
						}]
					);
				}}>X</button>
			</td>

			<td className="icon-button-width">
				<button className="icon-button" title="New Item Below" onClick={() => {
					if (itemCount >= ITEM_LIMIT) {
						const message = `You have reached the maximum number of items (${ITEM_LIMIT})`;
						appActions.showAlert(message);
						actions.setInfo({ info: message });
					} else {
						const startTime = benchStart();
						actions.createItem({
							index: index + 1
						});
						actions.setInfo({ info: `Item created. (${benchEnd(startTime)} ms)` });
					}
				}}>*</button>
			</td>
			<td className="icon-button-width"
				style={{
					backgroundColor: background,
					color: foreground
				}}>
				{index + 1}.
			</td>
			<td className="icon-button-width">
				<button disabled={!renamed || renamed === name} className="icon-button" title="Apply rename" onClick={() => {
					const startTime = benchStart();
					actions.setItemName({ index, name: renamed });
					actions.reparseAllDeltaStrings();
					actions.markResourceDirtyAt({ globalIndex: 0 });

					setRenamed("");
					actions.setInfo({ info: `Item renamed. (${benchEnd(startTime)} ms)` });
				}}>R</button>
			</td>
			<td>
				<input
					className="full-width"
					placeholder={name || "Unnamed"}
					type="text"
					value={renamed}
					onChange={(e) => {
						setRenamed(e.target.value);
					}} />

			</td>

			<td>
				<input

					className="full-width"
					placeholder="Color (e.g, red, #FF0000, rgb(255, 0, 0)"
					type="text"
					value={color}
					onChange={(e) => {
						actions.setItemColor({ index, color: e.target.value });
					}} />
			</td>

		</tr>
	);
};

export default connector(ItemEdit);