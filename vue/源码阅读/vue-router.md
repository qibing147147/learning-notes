# Vue Router

## 路由注册

### Vue.use

就是执行`use`传入参数中的`install`方法

### 路由安装

1. `Vue-router`的`install`函数为`Vue`混入了`beforeCreate`和`destroyed`函数，都会执行`registerInstance`方法。
2. 给`Vue`原型上定义了`$router`和`$route`两个属性的`get`方法。
3. 注册全局组件`router-link`和`router-view`

## VueRouter对象

构造函数定义了一些属性，其中 `this.app` 表示根 `Vue` 实例，`this.apps` 保存持有 `$options.router` 属性的 `Vue` 实例，`this.options` 保存传入的路由配置，`this.beforeHooks`、 `this.resolveHooks`、`this.afterHooks` 表示一些钩子函数，我们之后会介绍，`this.matcher` 表示路由匹配器，我们之后会介绍，`this.fallback` 表示在浏览器不支持 `history.pushState` 的情况下，根据传入的 `fallback` 配置参数，决定是否回退到hash模式，`this.mode` 表示路由创建的模式，`this.history` 表示路由历史的具体的实现实例，它是根据 `this.mode` 的不同实现不同，它有 `History` 基类，然后不同的 `history` 实现都是继承 `History`。

在混入的`beforeCreate`函数中执行了`_init`方法，`init` 的逻辑很简单，它传入的参数是 `Vue` 实例，然后存储到 `this.apps` 中；只有根 `Vue` 实例会保存到 `this.app` 中，并且会拿到当前的 `this.history`，根据它的不同类型来执行不同逻辑，由于我们平时使用 `hash` 路由多一些，所以我们先看这部分逻辑，先定义了 `setupHashListener` 函数，接着执行了 `history.transitionTo` 方法，实际上是调用了 `this.matcher.match` 方法去做匹配。



# 路由导航守卫

