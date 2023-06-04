import { connect, ConnectedProps } from "react-redux";
import {
	getInfo
} from "store/application/selectors";
import { ReduxGlobalState } from "store/store";

const mapStateToProps = (state: ReduxGlobalState) => ({
	text: getInfo(state),
});

const connector = connect(mapStateToProps);

type Props = ConnectedProps<typeof connector>;

export const Footer: React.FunctionComponent<Props> = ({ text }: Props) => {
	return (
		<span className="vertical-center">{text}</span>
	);
};

export default connector(Footer);