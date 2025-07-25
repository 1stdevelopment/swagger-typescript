import { getRefName } from "../utils.mjs";
import { DataType, isObject, isArray, isAllOf, isOneOf, isAnyOf, isReferenceObject, } from "./dataType.mjs";
export const REF = "$ref";
export const mergeAllOf = (properties, schemas) => {
    let ret = {};
    properties.forEach((property) => {
        if (isReferenceObject(property)) {
            const schemaName = getRefName(property.$ref);
            if (schemaName) {
                const schemaData = getSchemaData(schemas, schemaName);
                ret = Object.assign({}, ret, schemaData);
            }
        }
        else {
            const parsed = parseObject(property, schemas);
            ret = Object.assign({}, ret, parsed);
        }
    });
    return ret;
};
export const pickOneOf = (properties, schemas) => {
    const property = properties[0];
    if (isReferenceObject(property)) {
        const schemaName = getRefName(property.$ref);
        if (schemaName) {
            const schemaData = getSchemaData(schemas, schemaName);
            return schemaData;
        }
    }
    const parsed = parseObject(property, schemas);
    return Object.assign({}, parsed);
};
// Retrieve mock data of schema.
export const getSchemaData = (schemas, name) => {
    const schema = schemas[name];
    if (isReferenceObject(schema)) {
        const schemaName = getRefName(schema.$ref);
        return schemaName ? getSchemaData(schemas, schemaName) : {};
    }
    if (isAllOf(schema)) {
        return mergeAllOf(schema.allOf, schemas);
    }
    else if (isArray(schema)) {
        return parseArray(schema, schemas);
    }
    else if (isObject(schema)) {
        return parseObject(schema, schemas);
    }
    else if (schema.type) {
        return DataType.defaultValue(schema);
    }
    return schema;
};
export const parseObject = (obj, schemas) => {
    if (obj.example)
        return obj.example;
    if (!obj.properties) {
        return {};
    }
    return Object.keys(obj.properties).reduce((acc, key) => {
        const property = obj.properties[key];
        if (isReferenceObject(property)) {
            const schemaName = getRefName(property[REF]);
            if (schemaName) {
                const schema = getSchemaData(schemas, schemaName);
                acc[key] = schema;
            }
            return acc;
        }
        if (isAllOf(property)) {
            acc[key] = mergeAllOf(property.allOf, schemas);
        }
        else if (isOneOf(property)) {
            acc[key] = pickOneOf(property.oneOf, schemas);
        }
        else if (isAnyOf(property)) {
            acc[key] = pickOneOf(property.anyOf, schemas);
        }
        else if (isObject(property)) {
            acc[key] = parseObject(property, schemas);
        }
        else if (isArray(property)) {
            acc[key] = parseArray(property, schemas);
        }
        else if (property.type) {
            acc[key] = DataType.defaultValue(property);
        }
        return acc;
    }, {});
};
export const parseArray = (arr, schemas) => {
    if (isReferenceObject(arr.items)) {
        const schemaName = getRefName(arr.items[REF]);
        if (schemaName) {
            const schema = getSchemaData(schemas, schemaName);
            return [schema];
        }
        return [];
    }
    else if (arr.example) {
        return arr.example;
    }
    else if (arr.items.type) {
        return [parseObject(arr.items, schemas)];
    }
    return [];
};
//# sourceMappingURL=parse.mjs.map