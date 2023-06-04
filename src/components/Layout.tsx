type SplitLayoutProps = {
	direction?: "vertical" | "horizontal";
	base?: "first" | "second";
	size: string;
	min?: string;
	max?: string;
} & Record<string, unknown>;

export const SplitLayout: React.FunctionComponent<SplitLayoutProps> = ({ direction = "vertical", base = "first", size, min, max, children, ...other }) => {
	if (!Array.isArray(children) || children.length !== 2) {
		console.error("Layout must contain 2 children");
		return null;
	}
	const first = children[0];
	const second = children[1];
	const baseFirst = base === "first";
	let firstStyle: Record<string, unknown>;
	let secondStyle: Record<string, unknown>;
	let baseSize = min ? `max( ${min} , ${size} )` : size;
	baseSize = max ? `min( ${max} , ${baseSize})` : baseSize;
	const otherSize = `calc(100% - ${baseSize})`;

	if (direction === "horizontal") {
		firstStyle = {
			height: "100%",
			width: baseFirst ? baseSize : otherSize,
			overflow: "hidden",
			float: "left",
		};
		secondStyle = {
			height: "100%",
			width: baseFirst ? otherSize : baseSize,
			overflow: "hidden",
			float: "right",
		};
	} else {
		firstStyle = {
			height: baseFirst ? baseSize : otherSize,
			width: "100%",
			overflow: "hidden",
		};
		secondStyle = {
			height: baseFirst ? otherSize : baseSize,
			width: "100%",
			overflow: "hidden",
		};
	}
	return (
		<BoxLayout {...other}>
			<div style={firstStyle}>
				{first}
			</div>
			<div style={secondStyle}>
				{second}
			</div>
		</BoxLayout>
	);
};

type CenterLayoutProps = {
	width: string,
	height: string,
	minWidth?: string,
	maxWidth?: string,
	minHeight?: string,
	maxHeight?: string,
} & Record<string, unknown>;

export const CenterLayout: React.FunctionComponent<CenterLayoutProps> = ({
	width, height, minWidth, maxWidth, minHeight, maxHeight, children, ...other
}) => {
	const heightAfterMin = minHeight ? `max( ${height} , ${minHeight} )` : height;
	const heightAfterMinMax = maxHeight ? `min( ${heightAfterMin}, ${maxHeight} )` : heightAfterMin;

	const widthAfterMin = minWidth ? `max( ${width} , ${minWidth} )` : width;
	const widthAfterMinMax = maxWidth ? `min( ${widthAfterMin}, ${maxWidth} )` : widthAfterMin;

	const paddingVertical = `calc( ( 100% - ${heightAfterMinMax} ) / 2 )`;
	const paddingHorizontal = `calc( ( 100% - ${widthAfterMinMax} ) / 2 )`;
	return (
		<BoxLayout style={{
			position: "relative"
		}}>
			<div style={{
				position: "absolute",
				top: paddingVertical,
				paddingLeft: paddingHorizontal,
				width: widthAfterMinMax,
				height: heightAfterMinMax,
			}} {...other}>
				{children}
			</div>
		</BoxLayout>

	);
};

type AnyProps = {
	style?: Record<string, unknown>
} & Record<string, unknown>

export const BoxLayout: React.FunctionComponent<AnyProps> = ({ style, children, ...other }) => {
	return (
		<div style={{
			...style,
			width: "100%",
			height: "100%",
		}} {...other}>
			{children}
		</div>
	);
};

export const WindowLayout: React.FunctionComponent<AnyProps> = ({ style, children, ...other }) => {
	//console.log(other);
	return (
		<div style={{
			...style,
			position: "fixed",
			top: 0,
			left: 0,
			width: "100vw",
			height: "100vh"
		}} {...other}>
			{children}
		</div>
	);
};
