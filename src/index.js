const core = require("@actions/core");
const process = require("node:process");
const path_module = require("node:path");
const fs = require("node:fs/promises");
const { parse_fields, parse_urls, UrlEntry } = require("./parse");
const { Agent, setGlobalDispatcher } = require("undici");
const { parseArgs } = require("node:util");

async function main() {
	let argFields = "";
	let argUrls = "";
	let argInsecure = null;
	let argDryRun = false;
	if (process.argv.length >= 5) {
		const { values, positionals } = parseArgs({
			strict: true,
			options: {
				urls: {
					type: "string",
					short: "u",
				},
				fields: {
					type: "string",
					short: "f",
				},
				insecure: {
					type: "boolean",
					short: "i"
				},
				"dry-run": {
					type: "boolean"
				}
			}
		})

		argFields = values.fields ?? ""
		argUrls = values.urls ?? ""
		argInsecure = values.insecure
		argDryRun = values["dry-run"] ?? false
	}

	const fieldsStr = core.getInput("fields") || argFields;
	const urlsStr = core.getInput("urls") || argUrls;
	const insecure = !!(core.getInput("insecure") || argInsecure);
	const dryRun = !!(core.getInput("dry-run") || argDryRun);

	console.log("fields", fieldsStr);
	console.log("urls", urlsStr);
	console.log("insecure", insecure);
	console.log("dryRun", dryRun);

	const urls = parse_urls(urlsStr);
	const fields = parse_fields(fieldsStr);

	try {
		await upload({ fields, urls, insecure, dryRun });
	} catch (e) {
		console.error(e);
		core.setFailed(e);
	}
}

/**
 *
 * @param {Map<string, string>} fields
 * @returns
 */
async function getFormData(fields) {
	const form = new FormData();
	let foundField = false
	for (const key of fields.keys()) {
		const value = fields.get(key) ?? "";
		if (value[0] === "@") {
			const path = value.substring(1);
			try {
				const file = await fs.readFile(path)
				const data = new Blob([file]);
				console.log(data)
				form.set(key, data, path_module.basename(path));
			} catch (e) {
				console.error(`${path} ${e}`);
				continue
			}
			foundField = true
		} else {
			foundField = true
			form.set(key, value);
		}
	}
	if (!foundField) {
		throw Error("empty form body")
	}
	return form;
}

/**
 * @param {ReadableStreamDefaultReader<Uint8Array>} stream
 */
async function readStream(stream) {
	while (true) {
		const { done, value } = await stream.read()
		if (done) {
			break
		}
		const decoder = new TextDecoder("utf8")
		console.log(decoder.decode(value))
	}
}


/**
 *
 */
async function upload({ fields, urls, insecure, dryRun }) {
	let failedAll = true;

	for (const url of urls) {
		const form = await getFormData(fields);
		try {
			const uri = new URL(url.url);
			if (uri.protocol === "https:" && insecure) {
				const agent = new Agent({
					connect: {
						rejectUnauthorized: false,
					},
				});
				setGlobalDispatcher(agent);
			}

			const response = await fetch(uri, {
				method: "POST",
				body: form,
				headers: {
					Authorization: url.password,
					"dry-run": dryRun,
				},
			});

			if (response.status !== 200) {
				const data = await response.body?.getReader().read();
				// TODO check for is done. This can miss incoming values
				const resp = new TextDecoder().decode(data?.value);
				console.error(`${url} status code ${response.status} ${resp}`);
				continue
			}

			const stream = response.body?.getReader()
			if (!stream) {
				console.error(`${url} empty body on 200 status code`);
				continue
			}
			try {
				await readStream(stream)
			} catch (err) {
				console.error(`${url} reading body: ${err}`)
				continue
			}
			failedAll = false;
		} catch (e) {
			console.error(e);
		}
	}

	if (failedAll) {
		throw Error("failed all fetch calls");
	}
}

main();
