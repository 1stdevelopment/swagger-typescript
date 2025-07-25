import { writeFileSync, } from "fs";
import { generator } from "./generator.mjs";
import chalk from "chalk";
const generateKotlinService = async (config, input) => {
    const { url, hub, dir, prettierPath, language, mock, reactHooks, local } = config;
    try {
        const { code, type } = generator(input, config);
        writeFileSync(`${dir}/IApis.kt`, code);
        console.log(chalk.yellowBright("IApis Completed"));
        writeFileSync(`${dir}/Models.kt`, type);
        console.log(chalk.yellowBright("Models Completed"));
        console.log(chalk.greenBright("All Completed"));
    }
    catch (error) {
        console.log(chalk.redBright(error));
        console.log(chalk.redBright("failed"));
    }
};
export { generateKotlinService };
//# sourceMappingURL=index.mjs.map