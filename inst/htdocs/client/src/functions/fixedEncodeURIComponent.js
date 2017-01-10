/**
 * @see EXPRESSIONPLOT-451
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
 *
 * @param {String} str
 * @returns {String}
 */
export default function(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return "%" + c.charCodeAt(0).toString(16);
    });
};
