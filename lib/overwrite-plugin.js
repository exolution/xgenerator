/**
 * Created by exolution on 17/2/15.
 */
const fs = require('fs')
const inquirer = require('inquirer')
const chalk = require('chalk')
const path = require('path')
module.exports = function _overwritePlugin(files, ms, done) {
    let fileNames = Object.keys(files)
    asyncEach(fileNames, (fileName, next)=> {

        let content = files[fileName].contents
        let targetPath = path.join(this.destPath, fileName)
        if (fs.existsSync(targetPath)) {
            let buffer = fs.readFileSync(targetPath)
            if (!buffer.compare(content)) {
                console.log(chalk.red('conflict:') + fileName + ' has been changed')
                inquirer.prompt({
                    type: 'confirm',
                    message: 'overwrite ' + fileName + '?',
                    name: 'overwrite'
                }).then((answers) => {
                    if (!answers.overwrite) {
                        delete files[fileName]
                    }
                    next()
                })
            }
            else {
                next()
            }

        }
    }, done)
}
function asyncEach(array, fn, callback, idx = 0) {
    fn(array[idx], ()=> {
        console.log(idx)
        idx++
        if (idx == array.length) {
            callback && callback()
        }
        else asyncEach(array, fn, callback, idx)
    })
}