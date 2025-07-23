import { writeFileSync, existsSync, readFileSync, rmdirSync } from "fs";
import { format } from "prettier";
import { generator } from "./generator.mjs";
import { build } from "tsc-prog";
import { signalRGenerator } from "./signalR/generator.mjs";
import { generateMock } from "./mock/index.mjs";
import chalk from "chalk";
//@ts-ignore
import recursive from "recursive-readdir";
import { getJson } from "../getJson.mjs";
import getConfigFile from "./files/config.mjs";
import getHttpRequestFile from "./files/httpRequest.mjs";
import getHooksConfigFile from "./files/hooksConfig.mjs";
const generateJavascriptService = async (config, input) => {
    var _a, _b;
    const { url, hub, dir, prettierPath, language, mock, reactHooks, local } = config;
    const isToJs = language === "javascript";
    try {
        const prettierOptions = getPrettierOptions(prettierPath);
        const { code, hooks, type } = generator(input, config);
        if (mock) {
            generateMock(input, config);
        }
        writeFileSync(`${dir}/services.ts`, code);
        console.log(chalk.yellowBright("services Completed"));
        writeFileSync(`${dir}/types.ts`, type);
        console.log(chalk.yellowBright("types Completed"));
        if (reactHooks && hooks) {
            writeFileSync(`${dir}/hooks.ts`, hooks);
            if (!existsSync(`${dir}/hooksConfig.${isToJs ? "js" : "ts"}`)) {
                writeFileSync(`${dir}/hooksConfig.ts`, getHooksConfigFile());
            }
            console.log(chalk.yellowBright("hooks Completed"));
        }
        writeFileSync(`${dir}/httpRequest.ts`, getHttpRequestFile());
        console.log(chalk.yellowBright("httpRequest Completed"));
        if (!existsSync(`${dir}/config.${isToJs ? "js" : "ts"}`)) {
            writeFileSync(`${dir}/config.ts`, getConfigFile({ baseUrl: ((_b = (_a = input.servers) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || "" }));
            console.log(chalk.yellowBright("config Completed"));
        }
        // signalR hub definition
        let hubCode = null;
        if (hub) {
            const hubJson = hub ? await getJson(hub) : null;
            hubCode = signalRGenerator(hubJson, config);
            hubCode && writeFileSync(`${dir}/hub.ts`, hubCode);
            console.log(chalk.yellowBright("hub Completed"));
        }
        if (isToJs) {
            const files = [
                hubCode && "hub",
                ...(url || local
                    ? [
                        ...(reactHooks ? ["hooks", "hooksConfig"] : []),
                        "config",
                        "httpRequest",
                        "services",
                        "types",
                    ]
                    : []),
            ].filter(Boolean);
            convertTsToJs(dir, files);
        }
        recursive(dir, function (err, files) {
            if (err) {
                console.log(chalk.redBright(Error));
                return;
            }
            for (const file of files) {
                if (file.endsWith(".ts") || file.endsWith(".js")) {
                    formatFile(file, prettierOptions);
                }
                if (file.endsWith(".json")) {
                    formatFile(file, Object.assign(Object.assign({}, prettierOptions), { parser: "json" }));
                }
            }
        });
        console.log(chalk.greenBright("All Completed"));
    }
    catch (error) {
        console.log(chalk.redBright(error));
        console.log(chalk.redBright("failed"));
    }
};
async function formatFile(filePath, prettierOptions) {
    const code = readFileSync(filePath).toString();
    writeFileSync(filePath, await format(code, prettierOptions));
}
function convertTsToJs(dir, files) {
    build({
        basePath: ".",
        compilerOptions: {
            listFiles: true,
            outDir: dir,
            declaration: true,
            skipLibCheck: true,
            module: "esnext",
            target: "esnext",
            lib: ["esnext"],
        },
        files: files.map((file) => `${dir}/${file}.ts`),
    });
    files.forEach((file) => {
        if (existsSync(`${dir}/${file}.ts`)) {
            rmdirSync(`${dir}/${file}.ts`, { recursive: true });
        }
    });
}
function getPrettierOptions(prettierPath) {
    let prettierOptions = {};
    if (prettierPath && existsSync(prettierPath)) {
        prettierOptions = JSON.parse(readFileSync(prettierPath).toString());
    }
    else {
        if (existsSync(".prettierrc")) {
            prettierOptions = JSON.parse(readFileSync(".prettierrc").toString());
        }
        else if (existsSync("prettier.json")) {
            prettierOptions = JSON.parse(readFileSync("prettier.json").toString());
        }
    }
    if (!prettierOptions.parser) {
        prettierOptions.parser = "typescript";
    }
    return prettierOptions;
}
export { generateJavascriptService };
//# sourceMappingURL=index.mjs.map