import React from "react";
import "./App.css";
import SideNav from "sections/SideNav";
import Header from "sections/Header";
import Footer from "sections/Footer";
import Actions from "sections/Actions";
import {
	isHeaderCollapsed,
	isResourcesSectionCollapsed,
	isShowingHelp,
	isSideSectionCollapsed,
} from "store/application/selectors";
import {
	setInfo,
	markResourceDirtyAt,
} from "store/application/actions";
import {
	setRouteState,
} from "store/routing/actions";
import { setSettingState } from "store/setting/actions";
import { connect, ConnectedProps } from "react-redux";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import Alert from "dialog/Alert";
import Items from "sections/Items";
import { startResourceCalcClock, stopResourceCalcClock } from "data/resource";
import { loadfromLocalStorage } from "data/storage";
import { ReduxGlobalState } from "store/store";
import { startAutoSaveClock, stopAutoSaveClock } from "data/autosave";
import IODialog from "dialog/IODialog";
import Help from "sections/Help";
import { BoxLayout, SplitLayout, WindowLayout } from "components/Layout";

const mapStateToProps = (state: ReduxGlobalState) => ({
	headerCollapsed: isHeaderCollapsed(state),
	sideCollapsed: isSideSectionCollapsed(state),
	resourceCollapsed: isResourcesSectionCollapsed(state),
	showHelp: isShowingHelp(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setRouteState,
		setInfo,
		setSettingState,
		markResourceDirtyAt,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector>;
type State = {
	alertContent?: React.ReactNode,
	alertActions: AlertOption[],
	showIOAlert: boolean,
	windowWidth: number,
}

export type AlertOption = {
	name: string,
	execute?: () => void
}
export type AppAction = {
	showAlert: (content?: React.ReactNode, actions?: AlertOption[]) => void,
	showIODialog: (show?: boolean) => void,
}

class App extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			alertContent: undefined,
			alertActions: [],
			showIOAlert: false,
			windowWidth: window.innerWidth,
		};
	}

	componentDidMount() {
		window.addEventListener("resize", this.updateWindowWidth.bind(this));
		this.updateWindowWidth();
		const [storedState, settings] = loadfromLocalStorage();
		if (storedState) {
			this.props.actions.setRouteState({ routeState: storedState });
			this.props.actions.markResourceDirtyAt({ globalIndex: 0 });
			this.props.actions.setInfo({ info: "Loaded from local storage" });
		} else {
			this.props.actions.setInfo({ info: "Failed to load from local storage. Loaded empty project." });
		}
		if (settings) {
			this.props.actions.setSettingState({ settingState: settings });
		}
		startResourceCalcClock();
		startAutoSaveClock();
	}

	updateWindowWidth() {
		this.setState({ windowWidth: window.innerWidth });
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.updateWindowWidth.bind(this));
		stopResourceCalcClock();
		stopAutoSaveClock();
	}

	showAlert(content: React.ReactNode = undefined, actions: AlertOption[] = [{ name: "OK" }]): void {
		this.setState({
			alertContent: content,
			alertActions: actions,
		});
	}

	renderHeaderAndSide(headerCollapsed: boolean, appActions: AppAction): React.ReactNode {
		return (
			<SplitLayout size={headerCollapsed ? "3.5rem" : "10rem"}>
				<BoxLayout className="component border">
					<Header appActions={appActions} />
				</BoxLayout>
				<SideNav appActions={appActions} />
			</SplitLayout>
		);
	}

	render() {
		const appActions: AppAction = {
			showAlert: this.showAlert.bind(this),
			showIODialog: (show = true) => this.setState({ showIOAlert: show }),
		};

		const {
			showHelp,
			headerCollapsed,
			sideCollapsed,
			resourceCollapsed,
		} = this.props;

		const headerAndSideSection = this.renderHeaderAndSide(headerCollapsed, appActions);
		const mainSection = showHelp ? <Help /> : <Actions appActions={appActions} />;
		const itemSection = <Items appActions={appActions} />;
		let mainWindowLayout;
		if (this.state.windowWidth < 1000) {
			mainWindowLayout =
				<SplitLayout base="second" size={resourceCollapsed ? "1.8rem" : "30%"} min={resourceCollapsed ? undefined : "12rem"}>
					<SplitLayout
						direction="horizontal"
						size={sideCollapsed ? "2rem" : "30%"}
						min={sideCollapsed ? "2rem" : "16rem"}
						max={sideCollapsed ? "2rem" : "24rem"} >
						{headerAndSideSection}
						{mainSection}
					</SplitLayout>
					{itemSection}
				</SplitLayout>;
		} else {
			mainWindowLayout =
				<SplitLayout
					direction="horizontal"
					size={sideCollapsed ? "2rem" : "30%"}
					min={sideCollapsed ? "2rem" : "16rem"}
					max={sideCollapsed ? "2rem" : "24rem"} >
					{headerAndSideSection}
					<SplitLayout base="second" size={resourceCollapsed ? "1.8rem" : "30%"} min={resourceCollapsed ? undefined : "12rem"}>
						{mainSection}
						{itemSection}
					</SplitLayout>
				</SplitLayout>;
		}

		return (
			<>
				<WindowLayout>
					<SplitLayout base="second" size="1.5rem">
						{mainWindowLayout}
						<BoxLayout className="component border">
							<Footer />
						</BoxLayout>
					</SplitLayout>
				</WindowLayout>
				<Alert content={this.state.alertContent} alertActions={this.state.alertActions} actions={{
					hideAlert: () => this.showAlert()
				}} />
				<Alert content={this.state.showIOAlert ? <IODialog appActions={appActions} /> : undefined} alertActions={[{ name: "Close" }]} actions={{
					hideAlert: () => this.setState({ showIOAlert: false })
				}} />
			</>
		);
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
