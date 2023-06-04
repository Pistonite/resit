import { connect, ConnectedProps } from "react-redux";
import {
	getActionCount,
	getActionName,
	isActionNote
} from "store/routing/selectors";
import { ReduxGlobalState } from "store/store";

type RenderExternalProps = {
	branchIndex: number,
	splitIndex: number,
	actionIndex: number,
}
const mapStateToPropsForActionSummaryItemRender = (state: ReduxGlobalState, ownProps: RenderExternalProps) => ({
	isNote: isActionNote(state, ownProps.branchIndex, ownProps.splitIndex, ownProps.actionIndex),
	name: getActionName(state, ownProps.branchIndex, ownProps.splitIndex, ownProps.actionIndex),
});

const renderConnector = connect(mapStateToPropsForActionSummaryItemRender);

type RenderProps = ConnectedProps<typeof renderConnector> & RenderExternalProps;

const ActionSummaryItemRender: React.FunctionComponent<RenderProps> = ({ isNote, name }: RenderProps) => {
	const displayName = name || "[Unnamed Action]";
	return <tr>
		<td />
		<td />
		<td className="icon-button-width" >&gt;</td>
		<td colSpan={8} >
			{isNote ? <em>{displayName}</em> : displayName}
		</td>
	</tr>;
};

const ActionSummaryItem = connect(mapStateToPropsForActionSummaryItemRender)(ActionSummaryItemRender);

type ExternalProps = {
	branchIndex: number,
	splitIndex: number,
}
const mapStateToProps = (state: ReduxGlobalState, ownProps: ExternalProps) => ({
	length: getActionCount(state, ownProps.branchIndex, ownProps.splitIndex),
});

const connector = connect(mapStateToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const ActionSummary: React.FunctionComponent<Props> = ({ length, branchIndex, splitIndex }: Props) => {
	const nodes = [];
	for (let i = 0; i < length; i++) {
		nodes.push(<ActionSummaryItem
			key={i}
			branchIndex={branchIndex}
			splitIndex={splitIndex}
			actionIndex={i}
		/>);
	}
	return <>{nodes}</>;
};

export default connector(ActionSummary);