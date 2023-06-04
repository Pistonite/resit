import { connect, ConnectedProps } from "react-redux";
import {
	getActiveSplitActionDeltaError,
	getActiveSplitActionDeltas,
	getItemColorByName,
} from "store/routing/selectors";
import {
	setItemFilter
} from "store/setting/actions";
import { DeltaType, typeToOperator } from "data/delta";
import { getForegroundAndBackground } from "util/color";
import { ReduxGlobalState } from "store/store";
import React from "react";
import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";

const mapStateToPropsForDeltaItemRender = (state: ReduxGlobalState, ownProps: { name: string }) => {
	const color = getItemColorByName(state, ownProps.name) ?? "";
	const [foreground, background] = getForegroundAndBackground(color);
	return {
		foreground, background
	};
};

const mapDispatchToPropsForDeltaItemRender = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setItemFilter
	}, dispatch)
});

const connectorForDeltaItemRender = connect(mapStateToPropsForDeltaItemRender, mapDispatchToPropsForDeltaItemRender);

type RenderProps = {
	name: string,
	type: DeltaType,
	value: number | string,
	foreground: string,
	background: string,
} & ConnectedProps<typeof connectorForDeltaItemRender>

const DeltaItemRender: React.FunctionComponent<RenderProps> = ({ name, type, value, foreground, background, actions }) => {
	const displayName = name;
	const [op, displayValue] = typeToOperator(type, value);
	let displayValueRef;
	if (type.startsWith("ref")) {
		displayValueRef = `[${displayValue}]`;
	} else {
		displayValueRef = displayValue;
	}
	return (
		<><span className="cursor-pointer" style={{ backgroundColor: background, color: foreground }} onClick={() => {
			actions.setItemFilter({ filter: name });
		}}>[{displayName}]</span>{op}{displayValueRef}</>
	);
};

const DeltaItem = connectorForDeltaItemRender(DeltaItemRender);

type ExternalProps = {
	actionIndex: number
}

const mapStateToProps = (state: ReduxGlobalState, { actionIndex }: ExternalProps) => ({
	deltaError: getActiveSplitActionDeltaError(state, actionIndex),
	deltas: getActiveSplitActionDeltas(state, actionIndex),
});

const connector = connect(mapStateToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

export const DeltaList: React.FunctionComponent<Props> = ({ deltas, deltaError }) => {
	const deltaItems = [];
	if (deltaError === undefined) {
		for (const name in deltas) {
			deltaItems.push(
				<React.Fragment key={name}><DeltaItem name={name} {...deltas[name]} />, </React.Fragment>
			);
		}
	}

	return (
		<tr key="delta">
			<td className="icon-button-width align-right">
				&#916;
			</td>
			<td colSpan={6}>
				{deltaError !== undefined ?
					<span className="deltastr-error">{deltaError}</span>
					:
					deltaItems
				}

			</td>

		</tr>
	);
};

export default connector(DeltaList);