import ItemEdit from "./ItemEdit";
import ItemDisplay from "./ItemDisplay";
import { AppAction } from "App";
import {
	getActiveGlobalIndex,
	getFilteredItemIndices,
	getItemCount,
	getItemNameByIndex,
} from "store/routing/selectors";
import { ReduxGlobalState } from "store/store";
import { getItemFilter } from "store/setting/selectors";
import {
	getActionResourceByGlobalIndex,
	isEditingItems
} from "store/application/selectors";
import {
	shouldOnlyShowChangedItem,
	shouldHideEmptyItems,
} from "store/setting/selectors";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { connect, ConnectedProps } from "react-redux";
import { ITEM_LIMIT } from "data/limit";
import {
	setInfo,
} from "store/application/actions";
import { createItem } from "store/routing/actions";
import { benchStart, benchEnd } from "util/benchmark";

type ExternalProps = {
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState) => {
	const filterString = getItemFilter(state);
	const filter = !filterString ? [] : filterString.split(",").map(s => s.trim());

	const globalIndex = getActiveGlobalIndex(state);
	const deltas = globalIndex !== undefined ? getActionResourceByGlobalIndex(state, globalIndex) : undefined;

	let filteredIndices = getFilteredItemIndices(state, filter);
	const showOnlyChanged = shouldOnlyShowChangedItem(state);

	if (showOnlyChanged && deltas && Object.keys(deltas).length !== 0) {
		filteredIndices = filteredIndices.filter(i => {
			const name = getItemNameByIndex(state, i);
			return name in deltas && deltas[name].change !== 0;
		});
	}
	const hideEmpty = shouldHideEmptyItems(state);
	if (hideEmpty && deltas && Object.keys(deltas).length !== 0) {
		filteredIndices = filteredIndices.filter(i => {
			const name = getItemNameByIndex(state, i);
			return name in deltas && deltas[name].value !== 0;
		});
	}

	return {
		itemIndices: filteredIndices,
		editing: isEditingItems(state),
		itemCount: getItemCount(state),
		getItemNameByIndex: (i: number) => getItemNameByIndex(state, i),
		deltas,
	};
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setInfo,
		createItem,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

const ItemList: React.FunctionComponent<Props> = ({ itemIndices, deltas, getItemNameByIndex, editing, actions, appActions, itemCount }) => {
	let itemSection;

	if (editing) {
		itemSection = itemIndices.map(i =>
			<ItemEdit
				key={i}
				index={i}
				appActions={appActions}
			/>
		);
	} else {
		itemSection = [];
		for (let i = 0; i < itemIndices.length; i += 4) {
			const row =
				<tr key={i}>
					{[i, i + 1, i + 2, i + 3].map(i => {
						if (i >= itemIndices.length) {
							return null;
						}
						const index = itemIndices[i];
						const name = getItemNameByIndex(index);
						const delta = deltas ? deltas[name] : undefined;
						return <ItemDisplay key={i} index={itemIndices[i]} delta={delta} />;
					})}
				</tr>;
			itemSection.push(row);
		}
	}
	return (
		<table>
			<tbody>
				{itemSection}
				<tr key="new_item_button">
					<td colSpan={5}>
						<button onClick={() => {
							if (itemCount >= ITEM_LIMIT) {
								const message = `You have reached the maximum number of items (${ITEM_LIMIT})`;
								appActions.showAlert(message);
								actions.setInfo({ info: message });
							} else {
								const startTime = benchStart();
								actions.createItem({
									index: itemCount
								});
								actions.setInfo({ info: `Item created. (${benchEnd(startTime)} ms)` });
							}
						}}>New Item</button>
					</td>
				</tr>
			</tbody>

		</table>
	);
};

export default connector(ItemList);