import { Parameter, Schema } from "../../types.mjs";
type Parameters = {
    pathParams: Parameter[];
    requestBody: Schema | undefined;
    queryParamsTypeName: string | false;
    supportsPagination: boolean;
    headerParams: string | Parameter[];
    override?: boolean;
};
declare const getParamsString: ({ pathParams, requestBody, queryParamsTypeName, supportsPagination, headerParams, override, }: Parameters) => string;
export { getParamsString };
//# sourceMappingURL=getParamsString.d.mts.map