import { ActionData, compressAction, decompressAction } from "./action";

describe("data/action", () => {
	describe("compressAction", () => {
		it("should compress empty", () => {
			const sampleAction: ActionData = {
				name: "",
				deltaString: "",
			};
			const output = ":F:";
			expect(compressAction(sampleAction, {})).toStrictEqual(output);
		});
		it("should compress name", () => {
			const sampleAction: ActionData = {
				name: "sample",
				deltaString: "",
			};
			const output = "6:sampleF:";
			expect(compressAction(sampleAction, {})).toStrictEqual(output);
		});
		it("should compress delta, not replacing item", () => {
			const sampleAction: ActionData = {
				name: "",
				deltaString: "[item1]+1",
			};
			const output = ":F8:item1:+1";
			expect(compressAction(sampleAction, { item2: 1 })).toStrictEqual(output);
		});
		it("should compress delta, replacing item", () => {
			const sampleAction: ActionData = {
				name: "",
				deltaString: "[item1]=4",
			};
			const output = ":F4:2:=4";
			expect(compressAction(sampleAction, { item1: 2 })).toStrictEqual(output);
		});
		it("should compress both name and delta", () => {
			const sampleAction: ActionData = {
				name: "sam",
				deltaString: "[item1]=4",
			};
			const output = "3:samF4:2:=4";
			expect(compressAction(sampleAction, { item1: 2 })).toStrictEqual(output);
		});
		it("should compress error delta", () => {
			const sampleAction: ActionData = {
				name: "err",
				deltaString: "error delta string",
			};
			const output = "3:errT18:error delta string";
			expect(compressAction(sampleAction, { item1: 2 })).toStrictEqual(output);
		});
	});
	describe("decompressAction", () => {
		it("should decompress empty", () => {
			const sampleAction: ActionData = {
				name: "",
				deltaString: "",
			};
			const output = ":F:";
			expect(decompressAction(output, 0, [])).toStrictEqual([sampleAction, 3, null]);
		});
		it("should decompress name", () => {
			const sampleAction: ActionData = {
				name: "sample",
				deltaString: "",
			};
			const output = "6:sampleF:";
			expect(decompressAction(output, 0, [])).toStrictEqual([sampleAction, output.length, null]);
		});
		it("should decompress delta, not replacing item", () => {
			const sampleAction: ActionData = {
				name: "",
				deltaString: "[item1]+1",
			};
			const output = ":F8:item1:+1";
			expect(decompressAction(output, 0, [])).toStrictEqual([sampleAction, output.length, null]);
		});
		it("should decompress delta, replacing item", () => {
			const sampleAction: ActionData = {
				name: "",
				deltaString: "[item1]+1",
			};
			const output = ":F4:2:+1";
			expect(decompressAction(output, 0, ["", "", "item1"])).toStrictEqual([sampleAction, output.length, null]);
		});
		it("should decompress both name and delta", () => {
			const sampleAction: ActionData = {
				name: "sam",
				deltaString: "[item1]=4",
			};
			const output = "3:samF4:0:=4";
			expect(decompressAction(output, 0, ["item1"])).toStrictEqual([sampleAction, output.length, null]);
		});
		it("should report error", () => {
			const output = "2:samF4:0:=4";
			expect(decompressAction(output, 0, ["item1"])[2]).not.toBeNull();
		});
	});
});