import { compressItem, decompressItem } from "./item";

describe("data/item", () => {
	describe("compressItem", () => {
		it("should compress empty", () => {
			const item = {
				name: "",
				color: "",
			};
			const output = "::";
			expect(compressItem(item)).toEqual(output);
		});
		it("should compress name", () => {
			const item = {
				name: "iName",
				color: "",
			};
			const output = "5:iName:";
			expect(compressItem(item)).toEqual(output);
		});
		it("should compress color", () => {
			const item = {
				name: "",
				color: "some color",
			};
			const output = ":10:some color";
			expect(compressItem(item)).toEqual(output);
		});
		it("should compress name and color", () => {
			const item = {
				name: "iName",
				color: "some color",
			};
			const output = "5:iName10:some color";
			expect(compressItem(item)).toEqual(output);
		});
		it("should replace colons", () => {
			const item = {
				name: "i:love:colons",
				color: "some color",
			};
			const output = "13:i_love_colons10:some color";
			expect(compressItem(item)).toEqual(output);
		});
	});
	describe("decompressItem", () => {
		it("should decompress empty", () => {
			const item = {
				name: "",
				color: "",
			};
			const output = "::";
			expect(decompressItem(output, 0)).toEqual([item, 2, null]);
		});
		it("should decompress name", () => {
			const item = {
				name: "what",
				color: "",
			};
			const output = "4:what:";
			expect(decompressItem(output, 0)).toEqual([item, output.length, null]);
		});
		it("should decompress color", () => {
			const item = {
				name: "",
				color: "another color",
			};
			const output = ":13:another color";
			expect(decompressItem(output, 0)).toEqual([item, output.length, null]);
		});
		it("should decompress name and color", () => {
			const item = {
				name: "another name",
				color: "another color",
			};
			const output = "12:another name13:another color";
			expect(decompressItem(output, 0)).toEqual([item, output.length, null]);
		});
		it("should report error", () => {
			const output = "12:another name213:another color";
			expect(decompressItem(output, 0)[2]).not.toBeNull();
		})
	});
});