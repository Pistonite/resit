import ItemList from "components/item/ItemList";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { AppAction } from "App";
import { ReduxGlobalState } from "store/store";
import {
	getResourceCalcError,
	getResourceCalcProgress,
	isResourcesSectionCollapsed,
	isEditingItems,
} from "store/application/selectors";
import { setItemFilter } from "store/setting/actions";
import { getItemFilter } from "store/setting/selectors";
import {
	setEditingItems,
	setResourcesCollapsed,
} from "store/application/actions";
import { connect, ConnectedProps } from "react-redux";
import {
	getTotalActionCount,
	getActiveActionName,
} from "store/routing/selectors";
import {
	shouldOnlyShowChangedItem,
	shouldHideEmptyItems,
} from "store/setting/selectors";
import {
	setOnlyShowChangedItems,
	setHideEmptyItems,
} from "store/setting/actions";
import React from "react";
import ExpandButton from "components/ExpandButton";
import { BoxLayout, SplitLayout } from "components/Layout";

type ExternalProps = {
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState) => ({
	activeActionName: getActiveActionName(state),
	resourcesCollapsed: isResourcesSectionCollapsed(state),
	editing: isEditingItems(state),
	progress: getResourceCalcProgress(state),
	total: getTotalActionCount(state),
	error: getResourceCalcError(state),
	filterString: getItemFilter(state),
	onlyShowChanging: shouldOnlyShowChangedItem(state),
	hideEmpty: shouldHideEmptyItems(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setEditingItems,
		setItemFilter,
		setOnlyShowChangedItems,
		setResourcesCollapsed,
		setHideEmptyItems,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

const Items: React.FunctionComponent<Props> = ({
	resourcesCollapsed, editing, actions, appActions, filterString, progress, total, error, onlyShowChanging, activeActionName, hideEmpty
}: Props) => {
	const expandButton = <ExpandButton
		expanded={!resourcesCollapsed} setExpanded={(expanded) => actions.setResourcesCollapsed({ collapsed: !expanded })}
	/>;
	const buttonSection =
		<>
			<button className="space-left-small" onClick={() => actions.setEditingItems({ editing: !editing })}>{editing ? "Finish" : "Edit"}</button>

			<input
				className="space-left-small"
				type="text"
				value={filterString}
				placeholder="Filter (use , to separate)"
				onChange={(e) => actions.setItemFilter({ filter: e.target.value })}
			/>
			<button className="space-left-small icon-button" title="Clear" onClick={() => actions.setItemFilter({ filter: "" })}>X</button>
			{activeActionName !== undefined && <>
				<input
					id="show_only_changed_checkbox"
					className="space-left-small"
					type="checkbox"
					checked={onlyShowChanging}
					onChange={(e) => {
						actions.setOnlyShowChangedItems({ showOnlyChanged: e.target.checked });
					}} />
				<label htmlFor="show_only_changed_checkbox">Show Only Changed</label>
				<input
					id="hide_empty_checkbox"
					className="space-left-small"
					type="checkbox"
					checked={hideEmpty}
					onChange={(e) => {
						actions.setHideEmptyItems({ hideEmpty: e.target.checked });
					}} />
				<label htmlFor="hide_empty_checkbox">Hide Empty</label>
			</>

			}
		</>;

	let resourceInfo;
	if (error === null) {
		if (progress === total || total === 0) {
			resourceInfo = <span>Resource up to date</span>;
		} else {
			resourceInfo = <span>Updating Resources... ({progress}/{total})</span>;
		}
	} else {
		resourceInfo = <span className="deltastr-error" title={error.message}>{error.message}</span>;
	}
	const title = <strong>Resources {activeActionName && ` - ${activeActionName}`}</strong>;
	if (resourcesCollapsed) {
		return (
			<BoxLayout className="component border">
				{expandButton}
				{title}

			</BoxLayout>
		);
	} else {
		return (
			<SplitLayout size="3.2rem" className="component border">
				<BoxLayout className="component header-border overflow-hidden">
					<div>
						{expandButton}
						{title}

						{buttonSection}
					</div>
					<div>
						{resourceInfo}
					</div>
				</BoxLayout>
				<BoxLayout className="overflow-auto">
					<ItemList appActions={appActions} />
				</BoxLayout>
			</SplitLayout>
		);
	}

};

export default connector(Items);