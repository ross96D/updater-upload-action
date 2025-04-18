export class UrlEntry {
    #input = "";

    /**
     *
     * @param {string} password
     * @param {string} fullUrl
     */
    constructor(password, fullUrl) {
        this.#input = fullUrl;
        this.password = password;
        if (password) {
            this.url = fullUrl.replace(`${password}@`, "");
        } else {
            this.url = fullUrl;
        }
    }

    toString() {
        return this.url;
    }
}

/**
 *
 * @param {string} urls
 * @returns {UrlEntry[]}
 */
export function parse_urls(urls) {
    const urlsArray = urls.trim().split(";");
    const result = [];
    for (const url of urlsArray) {
        const splited = url.split("@");
        if (splited.length === 1) {
            result.push(new UrlEntry("", url));
            continue;
        }

        const password = splited[0].split("//")[1];
        result.push(new UrlEntry(password, url));
    }
    return result;
}

/**
 *
 * @param {string} fields
 *
 * @returns {Map<string, string>}
 */
export function parse_fields(fields) {
    const trimedFields = fields.trim();

    const result = new Map();
    let value = "";
    let inKey = true;

    let { index: i, key } = parse_key(0, trimedFields);
    inKey = false;
    while (i < trimedFields.length) {
        const char = trimedFields[i];
        if (char === " ") {
            i += 1;
            continue;
        }
        if (inKey) {
            const key_result = parse_key(i, trimedFields);
            i = key_result.index;
            key = key_result.key;
            inKey = false;
        } else {
            const value_result = parse_value(i, trimedFields);
            i = value_result.index;
            value = value_result.value;

            result.set(key, value);
            inKey = true;
        }
    }

    return result;
}

/**
 *
 * @param {number} start
 * @param {string} fields
 *
 *
 */
function parse_key(start, fields) {
    let index = start;
    if (fields.length === 0) throw Error("parse key fields with length 0");
    if (fields[0] === " ")
        throw Error("parse key found space at first character");
    if (fields[0] === "=") throw Error("parse value found = at first character");

    let charToSearch = "";
    if (fields[start] === '"') {
        charToSearch = '"';
        index += 1;
    } else {
        charToSearch = "=";
    }

    while (index < fields.length) {
        if (fields[index] === charToSearch) {
            break;
        }
        index += 1;
    }

    let key = "";
    if (charToSearch === '"') {
        index += 1;
        key = fields.substring(start + 1, index - 1);
    } else {
        key = fields.substring(start, index);
    }
    index += 1;
    return { index, key };
}

/**
 *
 * @param {number} start
 * @param {string} fields
 */
function parse_value(start, fields) {
    let index = start;
    if (fields.length === 0) throw Error("parse value fields with length 0");
    if (fields[0] === " ")
        throw Error("parse value found space at first character");
    if (fields[0] === "=") throw Error("parse value found = at first character");

    let charToSearch = "";
    if (fields[start] === '"') {
        charToSearch = '"';
        index += 1;
    } else {
        charToSearch = " ";
    }

    while (index < fields.length) {
        const char = fields[index];
        if (char === charToSearch) {
            break;
        }
        index += 1;
    }

    let value = "";
    if (charToSearch === '"') {
        index += 1;
        value = fields.substring(start + 1, index - 1);
    } else {
        value = fields.substring(start, index);
    }
    index += 1;
    return { index, value };
}
