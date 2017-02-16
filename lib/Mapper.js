/**
 * Created by exolution on 17/2/15.
 */
const path = require('path')
const _wildcardReplacer = {
    '*': '[^/]*?',
    '**': '.*'
}
class Mapper {
    constructor(src, target, ignore) {
        this.ignore = ignore
        if (typeof src === 'string') {
            src=src.replace(/^\.?\/+/,'')
            if (!path.extname(src)&&src[src.length-1]!=='*') {
                src = path.join(src, '**')
            }
            this.src = new RegExp('^'+src.replace(/\*{1,2}/g, (m)=>_wildcardReplacer[m])+'$')
        }
        else {
            this.src = src
        }
        this.target = target
    }

    filter(fileName, file) {
        if (typeof this.src === 'function') {
            return this.src.call(this, fileName, file)
        }
        else {
            this.match = this.src.exec(fileName)
            return !!this.match
        }

    }

    location(fileName, file) {
        this.match.name = fileName
        this.match.extname = path.extname(fileName)
        this.match.basename = path.basename(fileName, this.match.extname)
        this.match.dirname = path.dirname(fileName)
        if (typeof this.target === 'function') {
            return this.target.call(this, fileName, file)
        }
        else if (this.target) {
            return this.target.replace(/{(\w+?)}/g, (m, a)=>this.match[a] === undefined ? m : this.match[a])
        }
        return fileName
    }

    static plugin(files, ms, done) {
        let fileNames = Object.keys(files)
        fileNames.forEach((fileName)=> {
            let file = files[fileName];
            let targetFileName = fileName
            let hit = false
            for (let mapper of this.mappers) {
                if (mapper.filter(targetFileName, file)) {
                    if (mapper.ignore) {
                        targetFileName = null
                        break
                    }
                    else {
                        targetFileName = mapper.location(targetFileName, file)
                        hit = true
                    }
                }

            }
            if (targetFileName === null || this.options.mapMode && !hit) {
                delete files[fileName]
            }
            else if (targetFileName != fileName) {
                files[targetFileName] = files[fileName]
                delete files[fileName]
            }
        })
        done()
    }
}
module.exports=Mapper
