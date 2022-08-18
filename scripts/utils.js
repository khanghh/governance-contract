
const fs = require('fs')

function largeToString(num) {
  return num.toLocaleString('fullwid', { useGrouping: false });
}

function loadJSONSync(filepath) {
  if (fs.existsSync(filepath)) {
    try {
      return JSON.parse(fs.readFileSync(filepath))
    } catch (err) {
      console.log(err)
    }
  }
}


module.exports = { largeToString, loadJSONSync }