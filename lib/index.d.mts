import { SwaggerConfig, CLIConfig } from "./types.mjs";
/** @param config If isn't defined will be use swagger.config.json instead */
declare function generate(config?: SwaggerConfig, cli?: Partial<CLIConfig>): Promise<void>;
export { generate };
//# sourceMappingURL=index.d.mts.map