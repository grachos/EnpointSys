/**
 * Interpolates variables in a string (URL, headers, query params, or body).
 * Supports active environment variables and dynamic system macros:
 * {{$guid}} -> Random UUID
 * {{$timestamp}} -> Current unix timestamp (ms)
 * {{$randomInt}} -> Random integer between 1 and 1000
 * {{$randomEmail}} -> Random email
 */
export function interpolateVariables(text, activeEnvironment = null) {
  if (!text || typeof text !== 'string') return text;

  // Build variable map from active environment
  const varMap = {};
  if (activeEnvironment && Array.isArray(activeEnvironment.variables)) {
    activeEnvironment.variables.forEach(v => {
      if (v.enabled && v.key) {
        varMap[v.key.trim()] = v.value || '';
      }
    });
  }

  // Pattern matching for {{varName}}
  return text.replace(/\{\{\s*([@\$\w\.\-]+)\s*\}\}/g, (match, varName) => {
    // Check dynamic macros first
    if (varName === '$guid') {
      return 'f' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
    }
    if (varName === '$timestamp') {
      return Date.now().toString();
    }
    if (varName === '$randomInt') {
      return Math.floor(Math.random() * 1000 + 1).toString();
    }
    if (varName === '$randomEmail') {
      return `user_${Math.floor(Math.random() * 10000)}@example.com`;
    }

    // Check environment variables
    if (Object.prototype.hasOwnProperty.call(varMap, varName)) {
      return varMap[varName];
    }

    // Return original string if variable not found
    return match;
  });
}
