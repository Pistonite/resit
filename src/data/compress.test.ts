import { RouteState } from "store/routing/type";
import { encodeLengthPrepended, decodeLengthPrepended, encodeBoolean, decodeBoolean, encodeArray, decodeArray, decompressState, compressState, deflateCompressedState, inflateEncodedState } from "./compress";
import { compressedStringToDelta } from "./delta";
import { deflateRouteState, inflateRouteData } from "./storage";

const routeState: RouteState = {
	projectName: "Test Project Name",
	activeBranch: -1,
	activeSplit: -1,
	activeAction: -1,
	branches: [{
		name: "Test Branch 1",
		expanded: true,
		splits: [{
			name: "Test B1 Split 1",
			expanded: true,
			actions: [{
				name: "B1S1 Action1",
				deltaString: "",
				expanded: false,
				deltas: {},
				deltaError: null,
			}, {
				name: "B1S1 Action2",
				deltaString: "",
				expanded: false,
				deltas: {},
				deltaError: null,
			}],
		}, {
			name: "Test B1 Split 2",
			expanded: true,
			actions: [{
				name: "B1S2 Action1",
				deltaString: "[hello]+1",
				expanded: true,
				deltas: {
					"hello": {
						type: "add",
						value: 1,
					}
				},
				deltaError: null,
			}],
		}]
	}, {
		name: "Test Branch 2",
		expanded: true,
		splits: [{
			name: "Test B2 Split 1",
			expanded: false,
			actions: [],
		}, {
			name: "Test B2 Split 2",
			expanded: true,
			actions: [],
		}]
	}],
	items: [{
		name: "hello",
		color: "orange",
	}, {
		name: "item2",
		color: "blue",
	}],
};

describe("data/compress", () => {
	describe("length prepend", () => {
		it("should encode", () => {
			const str = "hello";
			expect(encodeLengthPrepended(str)).toBe("5:hello");
		});
		it("should encode empty", () => {
			const str = "";
			expect(encodeLengthPrepended(str)).toBe(":");
		});
		it("should decode at beginning", () => {
			const encoded = "5:hello";
			expect(decodeLengthPrepended(encoded, 0)).toStrictEqual(["hello", 7, null]);
		});
		it("should decode in middle", () => {
			const encoded = "7:hahahaa5:hello";
			expect(decodeLengthPrepended(encoded, 9)).toStrictEqual(["hello", 16, null]);
		});
		it("should decode error", () => {
			const encoded = "abc";
			let [str, index, error] = decodeLengthPrepended(encoded, 0);
			expect(error).not.toBeNull();
			[str, index, error] = decodeLengthPrepended("10:a", 0);
			expect(error).not.toBeNull();
			[str, index, error] = decodeLengthPrepended("a:a", 0);
			expect(error).not.toBeNull();
		});
	});
	describe("boolean", () => {
		it("should encode true", () => {
			expect(encodeBoolean(true)).toBe("T");
		});
		it("should encode false", () => {
			expect(encodeBoolean(false)).toBe("F");
		});
		it("should decode true", () => {
			expect(decodeBoolean("T", 0)).toStrictEqual([true, 1, null]);
		});
		it("should decode false", () => {
			expect(decodeBoolean("F", 0)).toStrictEqual([false, 1, null]);
		});
		it("should report error", () => {
			expect(decodeBoolean("123", 0)[2]).not.toBeNull();
		});
	});
	describe("array", () => {
		it("should encode", () => {
			const array = ["item1", "item2", "item3"];
			const output = "[123]";
			expect(encodeArray(array, str => str[4])).toStrictEqual(output);
		});
		it("should decode", () => {
			const array = ["item1", "item2", "item3"];
			const output = "[123]";
			expect(decodeArray(output, 0, (str: string, idx: number) => ["item" + str[idx], idx + 1, null])).toStrictEqual([array, 5, null]);
		});
		it("should report error", () => {
			const output = "[123";
			expect(decodeArray(output, 0, (str: string, idx: number) => ["item" + str[idx], idx + 1, null])[2]).not.toBeNull();
		});
	});
	it("should compress and decompress", () => {
		const data = deflateRouteState(routeState);
		expect(decompressState(compressState(routeState))).toStrictEqual([inflateRouteData(data), null]);
	});
	it("should compress encode and decode decompress", () => {
		const data = deflateRouteState(routeState);
		const compressed = compressState(routeState);
		const encoded = deflateCompressedState(compressed);
		const decoded = inflateEncodedState(encoded)
		expect(decoded).toStrictEqual(compressed);
		expect(decompressState(decoded)).toStrictEqual([inflateRouteData(data), null]);
	})
});