import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function getLatestVersion() {
    const versions = fs.readdirSync(path.join(__dirname, ".."))
        .filter(n => /^v\d+$/.test(n))
        .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

    return versions.at(-1);
};
