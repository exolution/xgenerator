/**
 * Created by exolution on 17/2/14.
 */
const Metalsmith = require('metalsmith')
const path = require('path')
const Mapper = require('./lib/Mapper')
const Render = require('./lib/Render')
const overwritePlugin = require('./lib/overwrite-plugin.js')
const chalk = require('chalk')
class Generator {
    constructor({overwrite=true,mapMode=false,verbose=false}={}) {
        this.renderEngines = []
        this.options = {
            overwrite,
            mapMode,
            verbose
        }
        this.mappers = []
        this.plugins = []
        this.mapperAdded = false
        this.renderAdded = false
    }

    _applyMapperPlugin() {
        if (!this.mapperAdded) {
            this.mapperAdded = true
            this.plugins.push(Mapper.plugin.bind(this))

        }
    }

    _applyRenderPlugin() {
        if (!this.renderAdded) {
            this.renderAdded = true
            this.plugins.push(Render.plugin.bind(this))
        }
    }

    ignore(...ignoredPaths) {
        this._applyMapperPlugin()
        for (let i = 0; i < ignoredPaths.length; i++) {
            this.mappers.push(new Mapper(ignoredPaths[i], null, true))
        }
        return this
    }

    src(srcPath) {
        this.srcPath = srcPath
        return this
    }

    data(data) {
        this.metadata = data
        return this
    }

    dest(destPath) {
        this.destPath = destPath
        return this
    }

    map(src, dest) {
        this._applyMapperPlugin()
        this.mappers.push(new Mapper(src, dest))
        return this
    }

    render(renderEngine) {
        this._applyRenderPlugin()
        this.renderEngines.push(renderEngine)
        return this
    }

    use(plugin) {
        this.plugins.push(plugin)
        return this
    }

    start() {
        this.metalsmith = Metalsmith(this.srcPath)
        this.metalsmith
            .source('.')
            .destination(this.destPath)

        if (this.metadata) {
            this.metalsmith.metadata(this.metadata)
        }
        if (!this.options.overwrite) {
            this.metalsmith.clean(false)
            this.plugins.push(overwritePlugin.bind(this))
        }
        for (let plugin of this.plugins) {
            this.metalsmith.use(plugin)
        }
        let generator = this
        return new Promise((resolve, reject)=> {

            this.metalsmith.build(function (err, files) {
                if (err) {
                    return reject(err)
                }
                if (generator.options.verbose) {
                    Object.keys(files).forEach(fileName=>console.log(chalk.grey('created:' + path.join(generator.destPath, fileName))))
                }
            })
        })


    }


}

module.exports = Generator

Generator.Render = Render