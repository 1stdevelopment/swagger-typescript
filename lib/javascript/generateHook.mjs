import { getDefineParam, getParamString, getSchemaName, getTsType, toPascalCase } from "./utils.mjs";
import { DEPRECATED_WARM_MESSAGE, getHooksFunctions, getHooksImports } from "./strings.mjs";
import { getJsdoc } from "../utilities/jsdoc.mjs";
import { isAscending, isMatchWholeWord } from "../utils.mjs";
import { getParamsString } from "./files/getParamsString.mjs";
const allowedPageParametersNames = ["page", "pageno", "pagenumber", "offset"];
const INFINITY_PARAMS = "infinite";
function generateHook(apis, types, config) {
    var _a, _b, _c;
    let code = getHooksImports({
        hasInfinity: !!((_a = config.useInfiniteQuery) === null || _a === void 0 ? void 0 : _a.length),
    });
    const showSwitchPaginationTypes = (_b = config.useInfiniteQuery) === null || _b === void 0 ? void 0 : _b.find((item) => typeof item !== "string" && item.keepUseQuery === true);
    const getUseInfiniteQueryMeta = (hookName, serviceName) => {
        const meta = (config.useInfiniteQuery || []).find((item) => {
            if (typeof item === "string") {
                return (item.toLowerCase() === serviceName.toLowerCase() ||
                    item.toLowerCase() === hookName.toLowerCase());
            }
            return item.keys.some((key) => key.toLowerCase() === serviceName.toLowerCase() ||
                key.toLowerCase() === hookName.toLowerCase());
        });
        if (!meta)
            return { supportsPagination: false, keepUseQuery: false };
        if (typeof meta === "string")
            return { supportsPagination: true, keepUseQuery: false };
        return {
            supportsPagination: true,
            keepUseQuery: !!meta.keepUseQuery,
        };
    };
    apis.sort(({ serviceName }, { serviceName: _serviceName }) => isAscending(serviceName, _serviceName));
    const apisCode = apis.reduce((prev, api) => {
        var _a;
        const { summary, deprecated, serviceName, queryParamsTypeName, pathParams, requestBody, headerParams, isQueryParamsNullable, isHeaderParamsNullable, responses, method, queryParameters, } = api;
        const hookName = `use${toPascalCase(serviceName)}`;
        const { supportsPagination, keepUseQuery } = getUseInfiniteQueryMeta(hookName, serviceName);
        const isGet = supportsPagination ||
            method === "get" ||
            ((_a = config.useQuery) === null || _a === void 0 ? void 0 : _a.some((name) => name.toLowerCase() === serviceName.toLowerCase() ||
                name.toLowerCase() === hookName.toLowerCase()));
        const TData = `${responses ? getTsType(responses, config) : "any"}`;
        const TQueryFnData = `SwaggerResponse<${TData}>`;
        const TError = "RequestError | Error";
        const getQueryParamName = (name, nullable = isQueryParamsNullable, isPartial) => queryParamsTypeName
            ? `${getParamString(name, !nullable, queryParamsTypeName, undefined, isPartial)},`
            : "";
        const TVariables = `
      ${pathParams
            .map(({ name, required, schema, description }) => getDefineParam(name, required, schema, config, description))
            .join(",")}
      ${pathParams.length > 0 ? "," : ""}
      ${requestBody ? `${getDefineParam("requestBody", true, requestBody, config)},` : ""}
      ${getQueryParamName("queryParams")}
      ${headerParams
            ? `${getParamString("headerParams", !isHeaderParamsNullable, headerParams)},`
            : ""}
    `
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .join("\n");
        const deps = `[${serviceName}.key,${pathParams.length ? `${pathParams.map(({ name }) => name)},` : ""}${requestBody ? "requestBody," : ""}${queryParamsTypeName ? "queryParams," : ""}${headerParams ? "headerParams," : ""}]`;
        const hasSwitchablePagination = supportsPagination && keepUseQuery;
        const getOptionsType = () => {
            if (!isGet) {
                return TVariables
                    ? `SwaggerTypescriptUseMutationOptions<${TData}, {${TVariables}}, TExtra>`
                    : `SwaggerTypescriptUseMutationOptionsVoid<${TData}, TExtra>`;
            }
            if (hasSwitchablePagination) {
                return `({
          ${INFINITY_PARAMS}?: TInf;
        } & (TInf extends false ?
          SwaggerTypescriptUseQueryOptions<${TData}> :
          UseInfiniteQueryOptions<${TQueryFnData}, ${TError}>
        ))`;
            }
            if (supportsPagination) {
                return `UseInfiniteQueryOptions<${TQueryFnData}, ${TError}>`;
            }
            return `SwaggerTypescriptUseQueryOptions<${TData}>`;
        };
        const returnType = () => {
            if (hasSwitchablePagination)
                return `: TInf extends false ? UseQueryResult<T, RequestError | Error> : InfiniteQueryResult<T>`;
            return "";
        };
        const params = [
            `${isGet ? TVariables : ""}`,
            `options?: ${getOptionsType()},`,
            `${isGet ? `configOverride?: AxiosRequestConfig,` : ""}`,
        ];
        let result = prev + `\n${getJsdoc({
            description: summary,
            deprecated: deprecated ? DEPRECATED_WARM_MESSAGE : undefined,
        })}`;
        result += `export const ${hookName} = ${hasSwitchablePagination ? `<T = ${TData}, TInf extends boolean = false>` : ""}${!isGet ? `<TExtra>` : ""}(
      ${params.join("\n      ")}
    )${returnType()} => {`;
        if (isGet) {
            result += `
      const { key, fun } = ${hookName}.info(${getParamsString({
                override: false,
                pathParams,
                requestBody,
                queryParamsTypeName,
                supportsPagination,
                headerParams,
            })} configOverride);`;
            const infiniteBlock = (hasEnable) => {
                var _a, _b;
                return `
        const {
          data: { pages } = {},
          data,
          ...rest
        } = useInfiniteQuery({
          ${hasEnable ? `enabled: options?.${INFINITY_PARAMS},` : ""}
          queryKey: key,
          queryFn: ({ pageParam }) =>
            fun({
              ${(_b = (_a = queryParameters.find(({ name }) => allowedPageParametersNames.includes(name.toLowerCase()))) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "page"}: pageParam,
            }),
          initialPageParam: 1,
          getNextPageParam: (_lastPage, allPages) => allPages.length + 1,
          ...options,
        });

        const list = useMemo(() => paginationFlattenData(pages), [pages]);
        const total = getTotal(pages);
        const hasMore = useHasMore(pages, list, queryParams);
        ${hasEnable ? `if (options?.${INFINITY_PARAMS})` : ""} return { ...rest,data, list, hasMore, total  };
      `;
            };
            if (hasSwitchablePagination) {
                result += `
        const useQueryReturn = useQuery({ enabled: !options?.${INFINITY_PARAMS}, queryKey: key, queryFn: fun, ...options });
        ${infiniteBlock(true)}
        return useQueryReturn;
      `;
            }
            else if (supportsPagination) {
                result += infiniteBlock(false);
            }
            else {
                result += `
        return useQuery({ queryKey: key, queryFn: fun, ...options });
      `;
            }
        }
        else {
            result += `
        return useMutation({
          mutationFn: (_o) => {
            const { ${getParamsString({
                pathParams,
                requestBody,
                queryParamsTypeName,
                supportsPagination,
                headerParams,
                override: false,
            })} configOverride } = _o || {};
            return ${serviceName}(${getParamsString({
                pathParams,
                requestBody,
                queryParamsTypeName,
                supportsPagination,
                headerParams,
                override: false,
            })} configOverride);
          },
          ...options
        });
      `;
        }
        result += `
    };`;
        if (isGet) {
            const infoParams = params
                .filter((p) => !p.trim().startsWith("options?:"))
                .join("");
            result += `
      ${hookName}.info = (${infoParams}) => {
        return {
          key: ${deps} as QueryKey,
          fun: (${supportsPagination
                ? getQueryParamName("_param", true, true).replace(/,$/, "")
                : ""}) =>
            ${serviceName}(${getParamsString({
                pathParams,
                requestBody,
                queryParamsTypeName,
                supportsPagination,
                headerParams,
                override: true,
            })} configOverride),
        } as const;
      };

      ${hookName}.prefetch = (
        client: QueryClient,
        ${params.join("\n  ")}
      ) => {
        const { key, fun } = ${hookName}.info(${getParamsString({
                pathParams,
                requestBody,
                queryParamsTypeName,
                supportsPagination,
                headerParams,
                override: false,
            })} configOverride);

        return client.getQueryData(key)
          ? Promise.resolve()
          : client.prefetchQuery({ queryKey: key, queryFn: () => fun(), ...options });
      };
    `;
        }
        return result;
    }, "");
    code += types
        .sort(({ name }, { name: _name }) => isAscending(name, _name))
        .reduce((prev, { name: _name }) => {
        const name = getSchemaName(_name);
        if (!isMatchWholeWord(apisCode, name))
            return prev;
        return prev + ` ${name},`;
    }, "import type {") + ` } from "./types"\n`;
    code += apis.reduce((prev, { serviceName }) => {
        return prev + ` ${serviceName},`;
    }, "import {") + ` } from "./services"\n`;
    code += getHooksFunctions({ hasInfinity: !!((_c = config.useInfiniteQuery) === null || _c === void 0 ? void 0 : _c.length) });
    code += `
import type { UseQueryResult, UseMutationOptions, UseInfiniteQueryOptions, QueryKey } from "@tanstack/react-query";

export type SwaggerTypescriptMutationDefaultParams<TExtra> = {
  _extraVariables?: TExtra;
  configOverride?: AxiosRequestConfig;
};

type SwaggerTypescriptUseQueryOptions<TData> = UseQueryOptions<
  SwaggerResponse<TData>,
  RequestError | Error
>;

export type SwaggerTypescriptUseMutationOptions<TData, TRequest, TExtra> = UseMutationOptions<
  SwaggerResponse<TData>,
  RequestError | Error,
  TRequest & SwaggerTypescriptMutationDefaultParams<TExtra>
>;

export type SwaggerTypescriptUseMutationOptionsVoid<TData, TExtra> = UseMutationOptions<
  SwaggerResponse<TData>,
  RequestError | Error,
  SwaggerTypescriptMutationDefaultParams<TExtra> | void
>;

${showSwitchPaginationTypes ? `export type StandardQueryResult<TData> = UseQueryResult<TData, RequestError | Error>;


export type InfiniteQueryResult<
  TData extends { data: Array<unknown>; }
> = UseInfiniteQueryResult<TData, RequestError | Error> & {
  list: TData['data'];
  hasMore: boolean;
  total: number;
  hasNextPage:boolean,
  isLoading:boolean,
}

export type QueryResult<TData, TInf extends boolean> = TInf extends true
  ? InfiniteQueryResult<TData>
  : StandardQueryResult<TData>;` : ""}
`;
    code += apisCode;
    return code;
}
export { generateHook };
//# sourceMappingURL=generateHook.mjs.map