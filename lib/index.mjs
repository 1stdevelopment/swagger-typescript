import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { getJson } from "./getJson.mjs";
import { generateJavascriptService } from "./javascript/index.mjs";
import { getCurrentUrl, majorVersionsCheck } from "./utils.mjs";
import { swaggerToOpenApi } from "./utilities/swaggerToOpenApi.mjs";
import chalk from "chalk";
import { partialUpdateJson } from "./updateJson.mjs";
import { default as postmanToOpenApi } from "postman-ke-openapi";
import yaml from "js-yaml";
import path from "path";
import { generateKotlinService } from "./kotlin/index.mjs";
/** @param config If isn't defined will be use swagger.config.json instead */
async function generate(config, cli) {
    config = config !== null && config !== void 0 ? config : getSwaggerConfig(cli);
    const configs = Array.isArray(config) ? config : [config];
    for (const con of configs) {
        await generateService(con, cli);
    }
}
const generateService = async (_config, cli) => {
    var _a, _b, _c;
    const config = Object.assign(Object.assign({}, _config), { tag: (_a = cli === null || cli === void 0 ? void 0 : cli.tag) !== null && _a !== void 0 ? _a : _config.tag, local: (_b = cli === null || cli === void 0 ? void 0 : cli.local) !== null && _b !== void 0 ? _b : _config.local, branch: (_c = cli === null || cli === void 0 ? void 0 : cli.branch) !== null && _c !== void 0 ? _c : _config.branch, config: cli === null || cli === void 0 ? void 0 : cli.config });
    const { url, dir, tag, keepJson, local } = config;
    if (!existsSync(dir)) {
        mkdirSync(dir);
    }
    try {
        const swaggerJsonPath = `${dir}/swagger.json`;
        let input;
        if (local) {
            input = getLocalJson(dir);
        }
        else {
            if (!url) {
                throw new Error("Add url in swagger.config.json ");
            }
            if (typeof url === "string") {
                input = await getJson(url);
            }
            else {
                input = await getJson(await getCurrentUrl(config));
            }
            if (input.swagger) {
                majorVersionsCheck("2.0.0", input.swagger);
                // convert swagger v2 to openApi v3
                input = await swaggerToOpenApi(input);
            }
            else if (input.openapi) {
                majorVersionsCheck("3.0.0", input.openapi);
            }
            else {
                input = yaml.load(await postmanToOpenApi(JSON.stringify(input), undefined));
            }
        }
        if (keepJson) {
            try {
                if (!(tag === null || tag === void 0 ? void 0 : tag.length)) {
                    writeFileSync(swaggerJsonPath, JSON.stringify(input));
                }
                else {
                    const oldJson = getLocalJson(dir);
                    input = partialUpdateJson(oldJson, input, tag);
                    writeFileSync(swaggerJsonPath, JSON.stringify(input));
                }
            }
            catch (error) {
                console.log(chalk.red(error));
                console.log(chalk.red("keepJson failed"));
            }
        }
        switch (config.language) {
            case "kotlin": {
                await generateKotlinService(config, input);
                break;
            }
            default:
                await generateJavascriptService(config, input);
                break;
        }
    }
    catch (error) {
        console.log(chalk.redBright(error));
        console.log(chalk.redBright("failed"));
    }
};
function getSwaggerConfig(cli) {
    var _a;
    try {
        const isAbsolutePath = (_a = cli === null || cli === void 0 ? void 0 : cli.config) === null || _a === void 0 ? void 0 : _a.startsWith("/");
        let rawPath = (cli === null || cli === void 0 ? void 0 : cli.config) || "";
        rawPath = rawPath.endsWith(".json")
            ? rawPath
            : path.join(rawPath, "swagger.config.json");
        const configPath = path.join(isAbsolutePath ? "" : process.cwd(), rawPath);
        console.log(chalk.grey(`Your config path: ${configPath}`));
        const config = JSON.parse(readFileSync(configPath).toString());
        if (!config) {
            throw "";
        }
        return config;
    }
    catch (error) {
        throw new Error("Please define swagger.config.json");
    }
}
function getLocalJson(dir) {
    const swaggerJsonPath = `${dir}/swagger.json`;
    try {
        return readJson(swaggerJsonPath);
    }
    catch (error) {
        console.log(chalk.red("swagger.json file not found. You should set keepJson true to save json then run swag-ts without tag to save that"));
        throw error;
    }
}
function readJson(path) {
    const old = readFileSync(path).toString();
    return JSON.parse(old);
}
export { generate };
//# sourceMappingURL=index.mjs.map