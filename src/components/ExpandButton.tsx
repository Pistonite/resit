type Props = {
	expanded: boolean,
	setExpanded: (expanded: boolean) => void,
}

const ExpandButton: React.FunctionComponent<Props> = ({ expanded, setExpanded }: Props) => {
	return (
		<button className="icon-button" onClick={() => setExpanded(!expanded)}>{expanded ? "-" : "+"}</button>
	);
};

export default ExpandButton;