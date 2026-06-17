
// Returns a short, human-readable customer identifier in the form "CDP-XXXXXXX"
function generateCdpId() {
  const hex = Math.random().toString(16).substring(2, 9).toUpperCase();
  return `CDP-${hex}`;
}

module.exports = { generateCdpId };
