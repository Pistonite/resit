
export default {
	routeState: {
		projectName: "Unnamed Project",
		activeBranch: -1,
		activeSplit: -1,
		activeAction: -1,
		branches: [],
		items: [],
	},
	settingState: {
		autoSave: true,
		onlyShowChangedItems: false,
		hideEmptyItems: true,
		itemFilter: "",
	},
	applicationState: {
		sideCollapsed: false,
		headerCollapsed: true,
		resourcesCollapsed: false,
		noResources: false,
		shrinkSide: false,
		editingNav: false,
		editingActions: false,
		editingItems: false,
		info: "",
		splitClipboard: undefined,
		resources: {
			error: null,
			content: [],
			progress: -1,
		},
		showOnlyChangedResources: false,
		showHelp: false,
	}
};