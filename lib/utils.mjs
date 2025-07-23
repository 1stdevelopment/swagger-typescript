import { exec } from "child_process";
function isAscending(a, b) {
    if (a > b) {
        return 1;
    }
    if (b > a) {
        return -1;
    }
    return 0;
}
function majorVersionsCheck(expectedV, inputV) {
    if (!inputV) {
        throw new Error(`Swagger-Typescript working with openApi v3/ swagger v2, seem your json is not openApi openApi v3/ swagger v2`);
    }
    const expectedVMajor = expectedV.split(".")[0];
    const inputVMajor = inputV.split(".")[0];
    function isValidPart(x) {
        return /^\d+$/.test(x);
    }
    if (!isValidPart(expectedVMajor) || !isValidPart(inputVMajor)) {
        throw new Error(`Swagger-Typescript working with openApi v3/ swagger v2 your json openApi version is not valid "${inputV}"`);
    }
    const expectedMajorNumber = Number(expectedVMajor);
    const inputMajorNumber = Number(inputVMajor);
    if (expectedMajorNumber <= inputMajorNumber) {
        return;
    }
    throw new Error(`Swagger-Typescript working with openApi v3/ swagger v2 your json openApi version is ${inputV}`);
}
function isMatchWholeWord(stringToSearch, word) {
    return new RegExp("\\b" + word + "\\b").test(stringToSearch);
}
async function getCurrentUrl({ url, branch: branchName }) {
    var _a, _b;
    const urls = url;
    if (!branchName) {
        branchName = await execAsync("git branch --show-current");
        branchName = branchName === null || branchName === void 0 ? void 0 : branchName.split("/")[0];
        branchName = (_a = urls.find((item) => branchName === item.branch)) === null || _a === void 0 ? void 0 : _a.branch;
    }
    if (!branchName) {
        branchName = (await getSourceBranch()).find((treeItem) => urls.find((item) => treeItem === item.branch));
    }
    const currentUrl = ((_b = urls.find((item) => branchName === item.branch)) === null || _b === void 0 ? void 0 : _b.url) || urls[0].url;
    return currentUrl;
}
async function getSourceBranch() {
    const result = await execAsync('git log --format="%D"');
    const branchesTree = result
        .split("\n")
        .flatMap((item) => item.split(", "))
        .map((branch) => {
        branch = branch.trim();
        branch = branch.replace("HEAD -> ", "");
        branch = branch.trim();
        return branch;
    });
    return branchesTree;
}
async function execAsync(command) {
    return new Promise((resolve, reject) => {
        const child = exec(command, (error, stdout) => {
            child.kill();
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}
export { getCurrentUrl, majorVersionsCheck, isAscending, isMatchWholeWord };
//# sourceMappingURL=utils.mjs.map