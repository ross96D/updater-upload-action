const core = require("@actions/core");
const process = require("node:process");
const path_module = require("node:path");
const fs = require("node:fs/promises");
const { parse_fields, parse_urls, UrlEntry } = require("./parse");
const { request } = require("node:https");

async function main() {
	let argFields = "";
	let argUrls = "";
	let argInsecure = "";
	if (process.argv.length === 5) {
		argFields = process.argv[2];
		argUrls = process.argv[3];
		argInsecure = process.argv[4] === "false" ? "" : "true";
	}

	const fieldsStr = core.getInput("fields") || argFields;
	const urlsStr = core.getInput("urls") || argUrls;
	const insecure = core.getInput("insecure") ? true : false;

	console.log("fields", fieldsStr);
	console.log("urls", urlsStr);
	console.log("insecure", insecure)

	const urls = parse_urls(urlsStr);
	const fields = parse_fields(fieldsStr);

	try {
		await upload(fields, urls, insecure);
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
			// TODO do not read all the file into memory
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
 * @param {UrlEntry[]} urls
 * @param { boolean } insecure
 */
async function upload(fields, urls, insecure) {
	let failedAll = true;

	for (const url of urls) {
		const form = await getFormData(fields);
		try {
			let uri = new URL(url.url);
			console.log(uri);
			if (uri.protocol == "https:" && insecure) {
				request({
					method: "POST",
					host: uri.host,
					port: uri.port,
					path: uri.pathname,
					search: uri.search,
					rejectUnauthorized: false,
					checkServerIdentity: (hostname, cert) => undefined,
				}, (res) => {
					let data;
					if (res.statusCode === 200) {
						failedAll = false;
						return;
					}
					res.on("data", (d) => data + d);
					res.on("close", () => {
						const resp =new TextDecoder().decode(data);
						console.error(`${url} status code ${res.statusCode} ${resp}`);	
					})
				});
				continue;
			}

			const response = await fetch(uri, {
				method: "POST",
				body: form,
				headers: {
					Authorization: url.password,
				},
			});

			if (response.status === 200) {
				failedAll = false;
			} else {
				const data = await response.body?.getReader().read();
				const resp = new TextDecoder().decode(data?.value);
				console.error(`${url} status code ${response.status} ${resp}`);
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
