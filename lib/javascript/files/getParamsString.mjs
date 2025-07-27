const getParamsString = ({ pathParams, requestBody, queryParamsTypeName, supportsPagination, headerParams, override = false, }) => ` ${pathParams.length ? `${pathParams.map(({ name }) => name)},` : ""}
      ${requestBody ? "requestBody," : ""}
      ${queryParamsTypeName
    ? supportsPagination && override
        ? `{
                  ..._param,
                  ...queryParams,
                },`
        : "queryParams,"
    : ""}
      ${headerParams ? "headerParams," : ""}`;
export { getParamsString };
//# sourceMappingURL=getParamsString.mjs.map