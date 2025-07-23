import { Config } from "./types.mjs";
declare function isAscending(a: string, b: string): 1 | -1 | 0;
declare function majorVersionsCheck(expectedV: string, inputV?: string): void;
declare function isMatchWholeWord(stringToSearch: string, word: string): boolean;
declare function getCurrentUrl({ url, branch: branchName }: Config): Promise<string>;
export { getCurrentUrl, majorVersionsCheck, isAscending, isMatchWholeWord };
//# sourceMappingURL=utils.d.mts.map