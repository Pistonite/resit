import { bindActionCreators, Dispatch } from "@reduxjs/toolkit";
import { AppAction } from "App";
import { downloadToFile, exportAsEncoded, exportAsJson, exportAsTxt, importAsEncoded, importAsJson, readFromFile } from "data/storage";
import { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import { setRouteState } from "store/routing/actions";
import { getProjectName, getRouteState } from "store/routing/selectors";
import { ReduxGlobalState } from "store/store";
import { setInfo, markResourceDirtyAt } from "store/application/actions";
import { RouteState } from "store/routing/type";

type ExternalProps = {
	appActions: AppAction,
}

const mapStateToProps = (state: ReduxGlobalState) => ({
	routeState: getRouteState(state),
	downloadName: getProjectName(state) || "Routing",
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	actions: bindActionCreators({
		setRouteState,
		setInfo,
		markResourceDirtyAt,
	}, dispatch)
});

const connector = connect(mapStateToProps, mapDispatchToProps);

type Props = ConnectedProps<typeof connector> & ExternalProps;

const IODialog: React.FunctionComponent<Props> = ({ routeState, downloadName, appActions, actions }) => {
	const [file, setFile] = useState<FileList | null>(null);

	const importFunc = (theFile: File, importer: (str: string) => [RouteState | null, string | null]): void => {
		readFromFile(theFile, result => {
			const [state, error] = importer(result);
			if (error !== null || state === null) {
				appActions.showIODialog(false);
				appActions.showAlert(`Error on import: ${error}`);
				return;
			}
			actions.setRouteState({ routeState: state });
			actions.markResourceDirtyAt({ globalIndex: 0 });
			appActions.showIODialog(false);
			actions.setInfo({ info: "Imported." });
		});
	};

	return <div>
		<div>
			<p><strong>Export</strong></p>
			<hr />
			Export As:
			<button className="space-left-small" onClick={() => {
				const string = exportAsEncoded(routeState);
				downloadToFile(downloadName, string, "txt");
			}}>Base64 (.txt)</button>
			<button className="space-left-small" disabled>Compressed (.txt)</button>
			<button className="space-left-small" onClick={() => {
				const string = exportAsJson(routeState);
				downloadToFile(downloadName, string, "json");
			}}>JSON (.json) [Recommended]</button>
			<button className="space-left-small" onClick={() => {
				const string = exportAsTxt(routeState);
				downloadToFile(downloadName, string, "txt");
			}}>Text (.txt)</button>
			<button className="space-left-small" disabled>LiveSplit (.lss)</button>

			<hr />
			<p><strong>Import</strong></p>
			<hr />
			<input className="vertical-center space-left-small" type="file" onChange={(e) => {
				setFile(e.target.files);
			}} />
			<br />
			Import As:
			<button className="space-left-small" disabled={file === null} onClick={() => {
				if (file === null) {
					return;
				}
				importFunc(file[0], importAsEncoded);
			}}>Base64 (.txt)</button>
			<button className="space-left-small" disabled>Compressed (.txt)</button>
			<button className="space-left-small" disabled={file === null} onClick={() => {
				if (file === null) {
					return;
				}
				importFunc(file[0], importAsJson);
			}}>JSON (.json)</button>
		</div>
	</div>;
};

export default connector(IODialog);