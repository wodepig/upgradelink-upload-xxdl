import * as fs from 'fs'
function readFile(path) {
  return fs.readdirSync(path, 'utf8')
}
// readFile('./')
console.log(readFile('./'));
