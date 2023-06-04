import { getForegroundAndBackground } from "util/color";
import { ItemDelta } from "data/item";
import { ReduxGlobalState } from "store/store";
import { getItemColorByIndex, getItemNameByIndex } from "store/routing/selectors";
import { connect, ConnectedProps } from "react-redux";

type ExternalProps = {
	index: number,
	delta?: ItemDelta,
}

const mapStateToProps = (state: ReduxGlobalState, { index }: ExternalProps) => {
	const color = getItemColorByIndex(state, index);
	const [foreground, background] = getForegroundAndBackground(color);
	return {
		name: getItemNameByIndex(state, index),
		foreground,
		background,
	};
};

const connector = connect(mapStateToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

function deltaString(delta: ItemDelta): string {
	const { value, change } = delta;
	if (change === 0) {
		return `x${value}`;
	}
	return `x${value} (${change >= 0 ? "+" : ""}${change})`;
}

const ItemDisplay: React.FunctionComponent<Props> = ({ name, delta, foreground, background }: Props) => {
	const displayName = name || "[Unnamed Item]";
	return <td style={{ backgroundColor: background, color: foreground }}>
		<span className="item-span" >{displayName}</span>
		<span className="item-span" >{delta && deltaString(delta)}</span>
	</td>;
};

export default connector(ItemDisplay);