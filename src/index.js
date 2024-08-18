const core = require("@actions/core");
const path_module = require("node:path");
const fs = require("node:fs/promises");
const { parse_fields, parse_urls } = require("./parse");

async function main() {
	const fieldsStr = core.getInput("fields");
	const urlsStr = core.getInput("urls");

	const urls = parse_urls(urlsStr);
	const fields = parse_fields(fieldsStr);

	try {
		await upload(fields, urls);
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
	for (const key of fields.keys()) {
		const value = fields.get(key) ?? "";
		if (value[0] === "@") {
			const path = value.substring(1);
			const data = new Blob([await fs.readFile(path)]);
			form.set(key, data, path_module.basename(path));
		} else {
			form.set(key, value);
		}
	}
	return form;
}

/**
 *
 * @param {Map<string, string>} fields
 * @param {string[]} urls
 */
async function upload(fields, urls) {
	let failedAll = true;

	for (const url of urls) {
		const form = await getFormData(fields);
		try {
			const response = await fetch(new URL(url), {
				method: "POST",
				body: form,
				headers: {},
			});

			if (response.status === 200) {
				failedAll = false;
			}
		} catch (e) {
			console.error(e);
		}
	}

	if (failedAll) {
		throw Error("failed all fetch calls");
	}
}

main();
