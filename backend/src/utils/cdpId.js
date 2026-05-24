//cdp-bulk-upload\cdp-backend\src\utils\cdpId.js
function generateCdpId() {
  const hex = Math.random().toString(16).substring(2, 9).toUpperCase();
  return `CDP-${hex}`;
}

module.exports = { generateCdpId };
