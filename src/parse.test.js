import { expect, assert, test } from "vitest";
import { UrlEntry, parse_fields, parse_urls } from "./parse";
import { group } from "@actions/core";

group("parse fields", async () => {
	test("parse several edge case line", () => {
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

	test("no quotes", () => {
		const text = "dist=12";
		expect(parse_fields(text)).toStrictEqual(new Map([["dist", "12"]]));
	});

	test("fail", () => {});
});

group("parse urls", async () => {
	test("basic examples", () => {
		const text = "http://example.com/path;https://192.168.0.1:32/path";
		expect(parse_urls(text)).toStrictEqual([
			new UrlEntry("", "http://example.com/path"),
			new UrlEntry("", "https://192.168.0.1:32/path"),
		]);
	});

	test("parse with token", () => {
		const text =
			"http://password123@example.com/path;https://pass@192.168.0.1:32/path";
		expect(parse_urls(text)).toStrictEqual([
			new UrlEntry("password123", "http://example.com/path"),
			new UrlEntry("pass", "https://192.168.0.1:32/path"),
		]);
	});
});
