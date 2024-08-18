import { expect, assert, test } from "vitest";
import { parse_fields, parse_urls } from "./parse";

test("parse fields", () => {
	const text =
		'"field with space first"="@path/to/file with space" " field_space front"=val  field1=value field2=@path/to/file field3="@path/to/file with space" "field with space"="@path/to/file with space"';
	expect(parse_fields(text)).toStrictEqual(
		new Map([
			["field with space first", "@path/to/file with space"],
			["field1", "value"],
			[" field_space front", "val"],
			["field2", "@path/to/file"],
			["field3", "@path/to/file with space"],
			["field with space", "@path/to/file with space"],
		]),
	);
});

test("parse urls", () => {
	const text = "http://example.com/path;https://192.168.0.1:32/path";
	expect(parse_urls(text)).toStrictEqual([
		"http://example.com/path",
		"https://192.168.0.1:32/path",
	]);
});
