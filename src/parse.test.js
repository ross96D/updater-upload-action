import { expect, test } from "vitest";
import { UrlEntry, parse_fields, parse_urls } from "./parse";
import { group } from "@actions/core";
import { readStream, setLastLine } from "./utils";
import { Readable } from "node:stream";

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

    test("fail", () => { });
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

    test("regression", () => {
        const text = "https://K]wkjca!6bC4>XL%/y:`mH~W5+u@cutrans.perezycia.com/updater/update"
        expect(parse_urls(text)).toStrictEqual([
            new UrlEntry("K]wkjca!6bC4>XL%/y:`mH~W5+u", "https://cutrans.perezycia.com/updater/update"),
        ]);
    })
});

test("setLastLine", () => {
    expect(setLastLine("", [""])).toStrictEqual("");
    expect(setLastLine("prev line", [""])).toStrictEqual("prev line");
    expect(setLastLine("prev line\n", ["more lines"])).toStrictEqual("more lines");
    expect(setLastLine("prev line ", ["more lines"])).toStrictEqual("prev line more lines");
    expect(setLastLine("prev line ", ["more lines", ""])).toStrictEqual("prev line more lines\n");
    expect(setLastLine("prev line ", ["more lines", "newline"])).toStrictEqual("newline");
    expect(setLastLine("prev line\n", ["more lines", "newline"])).toStrictEqual("newline");
    expect(setLastLine("", ["newline"])).toStrictEqual("newline");
    expect(setLastLine("", ["newline", "newline2"])).toStrictEqual("newline2");
    expect(setLastLine("", ["newline", "newline2", ""])).toStrictEqual("newline2\n");
});

group("read stream", async () => {
    test("read_stream.basic", async () => {
        const input = `line 1
line 2
line 3`
        let stream = Readable.from(input)
        await readStream(stream)
    });


    test("read_stream.error", async () => {
        const input = `[90m12:57PM[0m [32mINF[0m [36mdry-run=[0mfalse
	[90m12:57PM[0m [31mERR[0m [36merror=[0m[31m[1m"no github repo configured"[0m[0m [36mreqID=[0mcs7v111thaoqvb0k07c0
	`
        let stream = Readable.from(input);
        try {
            // @ts-ignore
            await readStream(stream)
        } catch (e) {
            expect(e).toStrictEqual(`fail: 12:57PM ERR error="no github repo configured" reqID=cs7v111thaoqvb0k07c0`)
        }
    })
});
