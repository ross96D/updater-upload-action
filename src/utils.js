import { stdout } from "node:process"


/**
 * @param {NodeJS.ReadableStream} stream
 * @param {((text: string) => void) | undefined} [write]
 */
export async function readStream(stream, write) {
    write ??= (text) => {
        stdout.write(text);
    };
    let lastLine = "";
    for await (const chunk of stream) {
        const text = chunk.toString();
        write(text);
        const split = text.split('\n');
        lastLine = setLastLine(lastLine, split)
    }
    lastLine = lastLine.trimEnd();
    lastLine = stripAnsi(lastLine);
    let matchRegex = /\d{1,2}:\d{1,2}[A,P]M (?<Level>[^\s]+)/;
    let matches = lastLine.match(matchRegex)
    if (matches?.groups?.Level === "ERR") {
        throw "fail: " + lastLine;
    }
}

/**
 * @param {string} text
 */
function stripAnsi(text) {
    let regex = /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PRZcf-ntqry=><~]))/g
    return text.replaceAll(regex, "");
}

/**
 * @param {string} line
 * @param {string[]} newLines
 * 
 * @returns {string}
 */
export function setLastLine(line, newLines) {
    if (newLines.length == 0) {
        return line;
    }
    let spl = line.split('\n')
    let sanitizedLine = spl[spl.length - 1]

    let { lastLine, newLine } = validLastLine(newLines)
    if (newLine) {
        return lastLine;
    } else {
        return sanitizedLine + lastLine;
    }
}

/**
 * @param {string[]} newLines
 * 
 * @returns { {lastLine: string, newLine: boolean} }
 */
function validLastLine(newLines) {
    if (newLines.length == 0) {
        return { lastLine: "", newLine: false };
    }
    if (newLines.length == 1) {
        return { lastLine: newLines[0], newLine: false };
    }
    for (let index = newLines.length - 1; index >= 0; index--) {
        let line = newLines[index];
        if (line != "") {
            if (index != newLines.length - 1) {
                line = line + "\n"
            }
            return { lastLine: line, newLine: index != 0 }
        }
    }
    return { lastLine: "", newLine: false };
}