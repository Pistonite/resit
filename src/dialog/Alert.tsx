import { ReactNode } from "react";
import { AlertOption } from "App";
import { CenterLayout, WindowLayout } from "components/Layout";
type Props = {
	content: ReactNode | undefined,
	alertActions: AlertOption[],
	actions: {
		hideAlert: () => void
	}
}

const Alert: React.FunctionComponent<Props> = ({ content, alertActions, actions }: Props) => {
	if (content === undefined) {
		return null;
	}

	return (
		<WindowLayout style={{
			backgroundColor: "rgb( 0 , 0 , 0 , 0.6 )"
		}}>
			<CenterLayout width="60%" height="15rem">
				<div className="component border" style={{ backgroundColor: "white", height: "100%", padding: "1rem" }}>
					{content}
					<div style={{
						position: "absolute",
						bottom: "1rem",
						right: "1rem"
					}}
					>
						{alertActions.map((alertAction, i) => <button
							key={i}
							className="margin-small"
							onClick={() => {
								if (alertAction.execute) {
									alertAction.execute();
								}
								actions.hideAlert();
							}}>
							{alertAction.name}
						</button>)}
					</div>
				</div>
			</CenterLayout>
		</WindowLayout>
	);
};

export default Alert;