import { createRequire } from "module";
import getLatestVersion from "./bin/core/getLatestVersion.js";

const require = createRequire(import.meta.url);

const startFunc = (options = {}) => {
    const v = options.version || getLatestVersion();

    const mod = require(`./bin/${v}/index.js`);

    return mod.default(options);
};

export default startFunc;
