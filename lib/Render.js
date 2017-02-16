/**
 * Created by exolution on 17/2/15.
 */
const path = require('path')
class Render {
    constructor(handler) {
        this.handler = handler
    }

    setData(data, meta) {
        this.data = data
        Object.setPrototypeOf(this.data, meta)
    }

    static plugin(files, ms, done) {
        let fileNames = Object.keys(files)
        fileNames.forEach((fileName)=> {
            let renderedContent = files[fileName].contents.toString()

            for (let renderEngine of this.renderEngines) {
                renderEngine.setData({_context: {fileName, files}}, ms.metadata())
                renderEngine._generator = this
                renderedContent = renderEngine.handler.call(renderEngine, renderedContent, fileName, files)
            }
            files[fileName].contents = new Buffer(renderedContent)
        })
        done()
    }
}
const _regKeyword = /[}{.$^)(]/g
class SimpleRender extends Render {
    constructor(delimiter = '{{ }}', replacer) {
        super((renderedContent, fileName, files)=> {
            return renderedContent.replace(this.replacement, (m, express)=> {
                let fn = new Function('data', `with(data){return ${express};}`)
                let ret
                try {
                    ret = fn.call(this, this.data)
                } catch (e) {
                    let stack = e.stack.split('\n')
                    stack.splice(1,0,'    at ' + m + ' (' + path.join(this._generator.srcPath, fileName) + ')')
                    e.stack = stack.join('\n')
                    throw e
                }
                return ret
            })
        })
        if (typeof delimiter === 'string') {
            let delimiters = delimiter.split(/ +/)
            if (delimiters.length < 2) {
                throw new Error('unsupported delimiter:' + delimiter + '.must be separated by whitespace')
            }
            this.replacement = new RegExp(delimiters[0].replace(_regKeyword, '\\$&') + `([^\\n]+?)` + delimiters[1].replace(_regKeyword, '\\$&'), 'g')
        }
        else if (delimiter instanceof RegExp && typeof replacer === 'function') {
            this.replacement = delimiter
            this.handler = (renderedContent, fileName, files)=> {
                return renderedContent.replace(this.replacement, (m, express)=> {
                    return replacer.apply(this, Array.prototype.slice.call(arguments))
                })
            }
        }


    }
}
module.exports = Render
Render.SimpleRender = SimpleRender