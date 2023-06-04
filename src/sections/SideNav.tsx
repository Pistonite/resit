import BranchList from "components/branch/BranchList";
import ExpandButton from "components/ExpandButton";
import { connect, ConnectedProps } from "react-redux";
import {
	isEditingNav,
	isSideSectionCollapsed
} from "store/application/selectors";
import {
	setSideCollapsed,
	setEditingNav
} from "store/application/actions";
import {
	setAllCollapsed
} from "store/routing/actions";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { AppAction } from "App";
import { ReduxGlobalState } from "store/store";
import { BoxLayout, SplitLayout } from "components/Layout";

type ExternalProps = {
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState) => ({
	sideCollapsed: isSideSectionCollapsed(state),
	editing: isEditingNav(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setSideCollapsed,
		setEditingNav,
		setAllCollapsed,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const SideNav: React.FunctionComponent<Props> = ({
	sideCollapsed,
	actions,
	appActions,
	editing,
}: Props) => {
	const buttonSection =
		<span>
			<button className="space-left-small" onClick={() => actions.setEditingNav({ editing: !editing })} >{editing ? "Finish" : "Edit"}</button>
			<button className="space-left-small" onClick={() => actions.setAllCollapsed({ collapsed: true })} >Collapse All</button>
			<button className="space-left-small" onClick={() => actions.setAllCollapsed({ collapsed: false })} >Expand All</button>
		</span>;

	return (
		<SplitLayout base="first" size="2rem" className="component border overflow-hidden">
			<BoxLayout className=" component header-border">
				<ExpandButton expanded={!sideCollapsed} setExpanded={(expanded) => {
					actions.setSideCollapsed({ collapsed: !expanded });
				}} />
				{!sideCollapsed && buttonSection}
			</BoxLayout>
			<BoxLayout className="overflow-auto">
				{!sideCollapsed && <BranchList appActions={appActions} />}
			</BoxLayout>
		</SplitLayout>
	);
};

export default connector(SideNav);