
/**
 * Generates a unique CDP identifier in the format "CDP-XXXXXXX".
 * Usage: Assigned to new customers on first import or registration
 * @returns {string} A unique 7-character uppercase alphanumeric CDP ID prefixed with "CDP-"
 */
function generateCdpId() {
  const hex = Math.random().toString(16).substring(2, 9).toUpperCase();
  return `CDP-${hex}`;
}

module.exports = { generateCdpId };
