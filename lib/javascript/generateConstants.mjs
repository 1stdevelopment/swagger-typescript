import { isAscending } from "../utils.mjs";
function generateConstants(types) {
    try {
        return types
            .sort(({ name }, { name: _name }) => isAscending(name, _name))
            .reduce((prev, { name, value }) => {
            prev += `export const ${name} = ${value};`;
            return prev;
        }, "");
    }
    catch (error) {
        console.error({ error });
        return "";
    }
}
export { generateConstants };
//# sourceMappingURL=generateConstants.mjs.map