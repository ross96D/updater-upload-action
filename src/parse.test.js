import { expect, assert, test } from "vitest";
import { parse_fields } from "./parse";

test("parse fields", () => {
	const text =
		'"field with space first"="@path/to/file with space" " field_space front"=val  field1=value field2=@path/to/file field3="@path/to/file with space" "field with space"="@path/to/file with space"';
	expect(parse_fields(text)).toStrictEqual({
		"field with space first": "@path/to/file with space",
		field1: "value",
		" field_space front": "val",
		field2: "@path/to/file",
		field3: "@path/to/file with space",
		"field with space": "@path/to/file with space",
	});
});
