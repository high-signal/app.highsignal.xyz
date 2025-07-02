/**
 * Strips HTML tags from a string
 * @param {string} html - The string containing HTML
 * @returns {string} - The string with HTML tags removed
 */
function stripHtml(html) {
    if (typeof html !== "string") return html;
    return html.replace(/<[^>]*>/g, "");
  }
  
  /**
   * Recursively processes an object to strip HTML from string values
   * @param {Object|Array|string|number|boolean} obj - The object to process
   * @returns {Object|Array|string|number|boolean} - The processed object
   */
  function processObjectForHtml(obj) {
    if (obj === null || obj === undefined) return obj;
  
    if (typeof obj === "string") {
      return stripHtml(obj);
    }
  
    if (Array.isArray(obj)) {
      return obj.map((item) => processObjectForHtml(item));
    }
  
    if (typeof obj === "object") {
      const result = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = processObjectForHtml(obj[key]);
        }
      }
      return result;
    }
  
    return obj;
  }
  
  module.exports = { processObjectForHtml };