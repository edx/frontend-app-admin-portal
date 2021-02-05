import { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import qs from 'query-string';

export const getPrefixedKeys = (obj, prefix) => {
  const deprefixedObj = {};
  Object.keys(obj)
    .filter(key => key.startsWith(`${prefix}__`))
    .forEach(key => {
      const deprefixedKey = key.split('__').pop();
      deprefixedObj[deprefixedKey] = obj[key];
    });
  return deprefixedObj;
};

export const excludeKeys = (obj, keysToExclude) => {
  const sanitizedObj = {};
  Object.keys(obj)
    .filter(key => !keysToExclude.includes(key))
    .forEach(key => { sanitizedObj[key] = obj[key]; });
  return sanitizedObj;
};

export const prefixKeys = (obj, prefix) => {
  const prefixedObj = {};
  Object.keys(obj).forEach(key => { prefixedObj[`${prefix}__${key}`] = obj[key]; });
  return prefixedObj;
};

export const getQueryString = ({ prefix = '', excludedParams = [] } = {}) => () => {
  const { search } = useLocation();
  const relaventQueries = useMemo(
    () => {
      const queries = qs.parse(search);
      let filteredQueries = { ...queries };
      if (prefix) {
        filteredQueries = getPrefixedKeys(queries, prefix);
      }
      if (excludedParams.length > 0) {
        filteredQueries = excludeKeys(filteredQueries, excludedParams);
      }

      return filteredQueries;
    },
    [search],
  );
  return relaventQueries;
};

export const setQueryString = ({ prefix = '', excludedParams = [] } = {}) => (paramsToSet) => {
  const { push } = useHistory();
  const { url } = useLocation();
  // get the whole querystring
  const { search } = useLocation();

  const queriesToKeep = useMemo(() => {
    const qToKeep = {};
    const currentQuery = qs.parse(search);
    if (excludedParams) {
      // don't overwrite these params
      Object.keys(currentQuery)
        // exclude non-prefixed keys and any excluded params
        .filter(key => excludedParams.includes(key) || (prefix && !key.startsWith(`${prefix}__`)))
        .forEach(key => { qToKeep[key] = currentQuery[key]; });
    }
    return qToKeep;
  }, [search]);

  let queriesToSet = {};
  if (prefix) {
    queriesToSet = { ...prefixKeys(paramsToSet, prefix), ...queriesToKeep };
  } else {
    queriesToSet = { ...paramsToSet, ...queriesToKeep };
  }

  push(`${url}?${qs.stringify(queriesToSet)}`);
};

const useQueryString = (prefix = '', excludedParams = []) => {
  const getPrefixedQuery = useMemo(() => getQueryString({ prefix, excludedParams }), [prefix, excludedParams]);
  const query = getPrefixedQuery();
  const setPrefixedQueryString = useMemo(() => setQueryString({ prefix, excludedParams }), [prefix, excludedParams]);
  return [query, setPrefixedQueryString];
};

/**
 * Returns the current query string and setter for query strings
 * @param {object} options
 * @param {string} options.prefix - the prefix will determine which portions of the querystring are gotten and set.
 * The getter will return non-prefixed keys, and the setter will expect non-prefixed keys.
 * @param {array}  options.excludedParams - queries that will be excluded from getting and setting. If using a prefix,
 * any non-prefixed queries will not be modified by the setter, they do not need to be included here.
 *
 * @returns {array} with fields:
 * [query, setQueryString]
 */

export default useQueryString;
