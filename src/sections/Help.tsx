import { BoxLayout } from "components/Layout";
import React from "react";

const Help: React.FunctionComponent = () =>
	<BoxLayout className="component border overflow-auto">
		<div className="help-doc">
			<h1>Resource Routing Tool</h1>
			<p>
				This tool is very useful for tracking various resources needed in a speedrun.
			</p>
			<p>
				You might say: <em> "Why don't I just use a spreadsheet?" </em>
				This tool has some unique features that makes it better than a normal spreadsheet:
				<ul>
					<li>The robust algorithm keeps the route <strong>consistent</strong> while <strong>moving splits and branches around.</strong></li>
					<li>Easy-to-use syntax to define and organize your items. <strong>No complex formulas</strong></li>
					<li>Export your route as TXT, JSON, or to <strong>LiveSplit</strong> [WIP]</li>
				</ul>
			</p>
			<h2>Getting Started</h2>
			<p>
				The data structure of the tool is very intuitive: there are <strong>branches</strong>, <strong>splits</strong>, and <strong>actions</strong>.
			</p>
			<p>
				If you are into speedrun. You already know what a split is. Branches are basically groups of splits.
				Actions are what you do in the split that affects the resources you track.
			</p>
			<p>
				For example, a typical section of the run could be like this:
				<ul>
					<li>Tutorial Levels</li>
					<li>
						Main Area
						<ul>
							<li>Dungeon A</li>
							<li>
								Dungeon B
								<ul>
									<li>Pick up 5 of Item 1</li>
									<li>Fight Monster X</li>
								</ul>
							</li>
							<li>
								Dungeon C
								<ul>
									<li>Use 3 of Item 2</li>
									<li>Fight Monster Y</li>
								</ul>
							</li>
						</ul>
					</li>
					<li>Final Boss</li>
				</ul>
			</p>
			<h2>Branch and Splits</h2>
			<p>
				You can use the side panel to organize your branches and splits.
				Use the "Edit" button to enter editing mode, where you can move branches and splits, rename them, or delete them.
				When you click on a split, you will enter that split and can then edit the actions in the splits.
			</p>

			<h2>Items and Delta String</h2>
			<p>During the run, each action may affect the current resources the player possesses.
				This tool is organized in the same way.</p>
			<p>
				Each action in a split has a <strong>delta string</strong> that is used to define the resources changes as a result of that action.
			</p>
			<p>
				To define a delta string, you first must define the items. Follow the steps below to define an item:
				<ol>
					<li>Click on "New Item" under the "Resources" section</li>
					<li>Click on "Edit" next to "Resources"</li>
					<li>Enter the item name and press the "R" button next to the text box to rename the item</li>
					<li>Click on "Finish" to exit the editing mode</li>
				</ol>
				Now that you have defined your first item. It's time to write some delta strings.
			</p>
			<h2>Delta String Syntax</h2>
			<p>The basic syntax for the delta string is <code>[(item)](operator)(quantity)</code></p>
			<ol>
				<li><code>item</code>: The name of the item</li>
				<li><code>operator</code>: One of <code>+</code>, <code>-</code>, <code>=</code></li>
				<li><code>quantity</code>: How much to change</li>
			</ol>
			<p>For example, <code>[Apple]+5</code> means adding 5 apples to the resources during this action.
			(Given that <code>Apple</code> is defined in the Resources section)</p>
			<p>Similarly, <code>[Orange]-3</code> means subtracting 3 oranges, and <code>[Banana]=5</code> means setting the quantity of bananas to 5</p>
			<p>
				You can also use reference to the quantity of another item.
			</p>
			<p>
				For example, <code>[Rock]+[Wood]</code> means adding as many woods to rocks. If you have 5 woods and 8 rocks, you will now have 5 woods and 13 rocks.
			</p>
			<p>
				The reference is done in parallel. So, <code>[Rock]=[Wood], [Wood]=[Rock]</code> will swap the quantities of woods and rocks.
			</p>
			<p>(Oh yeah, if you haven't already realize, use <code>,</code> to separate multiple items like the example above)</p>
			<h2>Track Resources</h2>
			<p>
				You can use the Resources section to see all the resources defined.
				Use the filter text box to filter them.
				Multiple search word can be separated with comma (,). The search will give any item that contains any of the search words.
			</p>
			<p>
				When you click on an action. <strong>You are focused to that action. </strong> The Resources section will now also show how the items changed in during that action, as well as the quantity <strong>after</strong> the action is done.
			</p>
			<p>When your route gets longer. You may notice that the resource tracker takes time to finish calculating all the resources. When it's calculating, you can continue editing the route. However, the tracking result may not be accurate when it's not done calculating. Especially if it is something you just edited.</p>
			<h2>FAQ</h2>
			<p>I will put whatever questions people ask me here.</p>
			<p><strong>Q: Why are some buttons disabled?</strong></p>
			<p>A: I didn't finish implementing them</p>
			<h2>Other</h2>
			<p>Source on <a href="https://github.com/resource-routing/resource-routing.github.io">Github</a></p>
		</div>
	</BoxLayout>
	;

export default Help;