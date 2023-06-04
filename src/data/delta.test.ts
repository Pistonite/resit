import { deltaToString, stringToDelta, deltaToCompressedString, compressedStringToDelta, renameItemInDelta, ActionDelta } from "./delta";

const inputEmptyDelta: ActionDelta = {};
const inputSampleDelta: ActionDelta = {
	"sample1": {
		type: "add",
		value: 1
	}, "sample2": {
		type: "add",
		value: -2
	}, "sample3": {
		type: "set",
		value: 3
	}, "sample4": {
		type: "ref_add",
		value: "ref1"
	}, "sample5": {
		type: "ref_sub",
		value: "ref2"
	}, "sample6": {
		type: "ref_set",
		value: "ref3"
	}
};
const outputSampleString = "[sample1]+1, [sample2]-2, [sample3]=3, [sample4]+[ref1], [sample5]-[ref2], [sample6]=[ref3]";
const sampleItemMap = {
	"sample1": 3,
	"sample2": 2,
	"sample3": 1,
	"sample4": 4,
	"sample5": 0,
	"ref1": 5,
	"ref3": 6
};
const sampleInverseItemMap = ["sample5", "sample3", "sample2", "sample1", "sample4", "ref1", "ref3"];
const outputCompressedSampleString = "3:+1,2:-2,1:=3,4:+:5,0:-:ref2,sample6:=:6";
const renameInputSampleDelta: () => ActionDelta = () => ({
	"sample4": {
		type: "ref_add",
		value: "sample6"
	}, "sample5": {
		type: "ref_sub",
		value: "sample4"
	}, "sample6": {
		type: "ref_set",
		value: "sample5"
	}
});
const renameOutputSampleDelta: ActionDelta = {
	"renamed4": {
		type: "ref_add",
		value: "renamed6"
	}, "renamed5": {
		type: "ref_sub",
		value: "renamed4"
	}, "renamed6": {
		type: "ref_set",
		value: "renamed5"
	}
};

describe("sections/components/util/delta", () => {
	describe("deltaToString", () => {
		it("processed delta", () => {
			expect(deltaToString(inputSampleDelta)).toEqual(outputSampleString);
		});
		it("processed empty delta", () => {
			expect(deltaToString(inputEmptyDelta)).toEqual("");
		});
	});
	describe("stringToDelta", () => {
		it("processed delta string", () => {
			expect(stringToDelta(outputSampleString)).toEqual([inputSampleDelta, null]);
		});
		it("processed empty delta string", () => {
			expect(stringToDelta("")).toEqual([inputEmptyDelta, null]);
		});
		it("error on invalid name", () => {
			expect(stringToDelta("hello")[1]).not.toBeNull();
			expect(stringToDelta("[hello")[1]).not.toBeNull();
			expect(stringToDelta("hello]")[1]).not.toBeNull();
		});
		it("error on invalid operator", () => {
			expect(stringToDelta("[hello]")[1]).not.toBeNull();
			expect(stringToDelta("[hello]m")[1]).not.toBeNull();
		});
		it("error on invalid value/ref", () => {
			expect(stringToDelta("[hello]=")[1]).not.toBeNull();
			expect(stringToDelta("[hello]=wah")[1]).not.toBeNull();
			expect(stringToDelta("[hello]=[wah")[1]).not.toBeNull();
			expect(stringToDelta("[hello]=wah]")[1]).not.toBeNull();
		});
	});
	describe("deltaToCompressedString", () => {
		it("processed delta", () => {
			expect(deltaToCompressedString(inputSampleDelta, sampleItemMap)).toEqual(outputCompressedSampleString);
		});
		it("processed empty delta", () => {
			expect(deltaToCompressedString(inputEmptyDelta, {})).toEqual("");
		});
	});
	describe("compressedStringToDelta", () => {
		it("processed delta", () => {
			expect(compressedStringToDelta(outputCompressedSampleString, sampleInverseItemMap)).toEqual([inputSampleDelta, null]);
		});
		it("processed empty delta string", () => {
			expect(compressedStringToDelta("", [])).toEqual([inputEmptyDelta, null]);
		});
		it("error on invalid name", () => {
			expect(compressedStringToDelta("hello", [])[1]).not.toBeNull();
		});
		it("error on invalid operator", () => {
			expect(compressedStringToDelta("hello:", [])[1]).not.toBeNull();
			expect(compressedStringToDelta("hello:m", [])[1]).not.toBeNull();
		});
		it("error on invalid value/ref", () => {
			expect(compressedStringToDelta("hello:=", [])[1]).not.toBeNull();
			expect(compressedStringToDelta("hello:=wah", [])[1]).not.toBeNull();
		});
	});
	describe("renameItemInDelta", () => {
		it("renamed correctly", () => {
			const renamed = { ...renameInputSampleDelta() };
			renameItemInDelta(renamed, "sample4", "renamed4");
			renameItemInDelta(renamed, "sample5", "renamed5");
			renameItemInDelta(renamed, "sample6", "renamed6");
			expect(renamed).toEqual(renameOutputSampleDelta);
		});
	});
});