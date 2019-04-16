let fs = require('fs');
let path = require('path');
let babylon = require('babylon');
let traverse = require('@babel/traverse').default;
let t = require('@babel/types');
let generator = require('@babel/generator').default;
let ejs = require('ejs');
let {SyncHook} = require('tapable');
//babylon 主要把源码转化成AST
//@babel/traverse 
//@babel/types
//@babel/generator
class Compiler {
    constructor(config) {
        //entry, output
        this.config = config;
        //保存入口文件的路径
        this.entryId;
        //保存所有模块的依赖
        this.modules = {};
        this.entry = config.entry;//入口路径
        this.root = process.cwd();//工作路径
        this.hooks = {
            entryOption: new SyncHook(),
            compile: new SyncHook(),
            afterCompile: new SyncHook(),
            afterPlugins: new SyncHook(),
            run: new SyncHook(),
            emit: new SyncHook(),
            done: new SyncHook(),
        }
        // 如果传递了plugins参数
        let plugins = this.config.plugins;
        if(Array.isArray(plugins)) {
            plugins.forEach(plugin => {
                plugin.apply(this);
            })
        }
        this.hooks.afterPlugins.call();
    }
    //解析源码
    parse(source, parentPath) { //AST解析语法树
        let ast = babylon.parse(source);
        let dependencies = [];
        traverse(ast, {
            CallExpression(p) { //a() require()
                let node = p.node;
                if (node.callee.name === 'require') {
                    node.callee.name = '__webpack_require__';
                    let moduleName = node.arguments[0].value; // 取到的就是模块的引用名字
                    moduleName = moduleName + (path.extname(moduleName)? '' : '.js');
                    moduleName = './' + path.join(parentPath, moduleName);   'src/a.js';
                    dependencies.push(moduleName);
                    node.arguments = [t.stringLiteral(moduleName)];
                }
            }
        });
        let sourceCode = generator(ast).code;
        return {sourceCode, dependencies};
    }
    getSource(modulePath) {
        let rules = this.config.module.rules;
        let content = fs.readFileSync(modulePath, 'utf8');
        for (let i = 0; i < rules.length; i++) {
            //拿到每个规则来处理
            let rule = rules[i];
            let {test, use} = rule;
            let len = use.length - 1;
            if (test.test(modulePath)) {  //这个模块需要loader来转化
                function normalLoader() {
                    // 获取对应的loader函数
                    let loader = require(use[len--]);
                    content = loader(content);
                    // 递归调用loader实现转化功能
                    if(len >= 0) {
                        normalLoader();
                    }
                }
                normalLoader();
            }
        }
        return content;
    }
    buildModule(modulePath, isEntry) {
        //拿到模块的内容
        let source = this.getSource(modulePath);
        //模块的id modulePath = modulePath - this.root 得到相对路径 因为打包webpack打包以后的模块的解析是以相对路径来作为属性名的
        let moduleName = './' +  path.relative(this.root, modulePath);
        
        if(isEntry) {
            this.entryId = moduleName; //保存入口的名字
        }

        // 解析需要吧source源码进行改造，返回一个依赖列表，并且在属性名上加上./src
        let {sourceCode, dependencies} = this.parse(source, path.dirname(moduleName));  
        // console.log(sourceCode, dependencies);
        // 把相对路径和解析对应起来
        this.modules[moduleName] = sourceCode;
        dependencies.forEach(dep => {   //父模块的附属 递归加载
            this.buildModule(path.join(this.root, dep), false);
        })

    }
    emitFile() {
        // 用数据渲染我们的模板
        // 输出到那个目录下      输出路径
        let main = path.join(this.config.output.path, this.config.output.filename);
        // 模版路径
        let templateStr = this.getSource(path.join(__dirname, 'main.ejs'));
        let code = ejs.render(templateStr, {entryId: this.entryId, modules: this.modules});
        this.assets = {};
        // 资源中路径对应的代码
        this.assets[main] = code;
        fs.writeFileSync(main, this.assets[main]);
    }
    run() {
        this.hooks.run.call();
        this.hooks.compile.call();
        //执行 并且创建模块的依赖关系
        this.buildModule(path.resolve(this.root, this.entry), true);
        this.hooks.afterCompile.call();
        // console.log(this.modules, this.entryId);
        //发射打包以后的文件
        this.emitFile();
        this.hooks.emit.call();
        this.hooks.done.call();
    }
}

module.exports = Compiler;