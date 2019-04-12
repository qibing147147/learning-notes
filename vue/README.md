## vue

##### 计算属性和方法的区别
两种方法得到的结果是完全相同的，但是计算属性会基于他们的响应式依赖进行缓存，只有在相关的响应式依赖发生改变的时候他们才会重新执行 ，这就意味着当响应式依赖没有变话的时候，计算属性会立即返回之前缓存的结果而不会重新执行函数。
##### v-if和v-show
v-if只有在第一次为true的时候渲染，而v-show会无如何都会渲染，但是v-if在切换的时候会销毁组件，而v-show只会给组件添加display:none，所以如果状态变化的少就用v-if，变化的多就用v-show
##### 动态组件&异步组件
动态组件可以用v-bind:is来实现，值可以是已注册的组件的名字或者是一个组件选项对象，可以使用keep-alive来实现缓存
异步组件是指在需要使用的时候使用webpack的import加载，最长使用的是vue的路由懒加载
##### 给元素添加过渡状态
可以添加的元素类型：
1. 条件渲染（v-if）
2. 条件展示（v-show）
3. 动态组件
4. 组件根节点

6个class：v-enter，v-enter-active，v-enter-to，v-leave，v-leave-active，v-leave-to

8个JavaScript钩子：beforEnter，enter,afterEnter,enterCancelled,beforeLeave,leave,afterLeave,leaveCancelled

##### 自定义指令
钩子函数：
1. bind 只调用一次，在指令绑定元素时调用
2. insert 被绑定的元素插入父节点时调用
3. update 在组件更新的时候调用 也可能在更新之前调用
4. componentUpdated 指令所在组件的VNode以及子VNode全部更新后调用
5. unbind 指令与元素解绑时调用

钩子函数的参数
- el：指令绑定的元素
- binding 一个对象，包含以下属性
  - name 指令名
  - value 指令绑定的值
  - oldValue 指令绑定的前一个值
  - expression 字符串形式的指令表达式
  - arg 传给指令的参数
  - modifiers 一个包含修饰符的对象
- vnode 
- oldVnode

##### 自定义过滤器
用于一些常见的文本格式化

```
<!-- 在双花括号中 -->
{{ message | capitalize }}

<!-- 在 `v-bind` 中 -->
<div v-bind:id="rawId | formatId"></div>
```
可以串联

## vue-router

#### 导航守卫
##### beforeEach 全局前置守卫
守卫接受3个参数
 - to 即将要进入的目标的路由对象
 - from 当前正要离开的路由对象
 - next 一定要调用这个方法来resolve这个钩子，否则路由不会跳转
   - next()
   - next(false)中断 返回from
   - next('/') 跳转到任意路径
   - next(error)

##### beforeResolve 全局解析守卫
类似于全局前置守卫，只是在路由被解析之后就会被调用

##### beforeAfter 全局后置钩子
在跳转完成以后调用，参数只有to和from

##### 路由独享守卫
beforeEnter 与beforeEach类似，只是可以在每个路由对象内单独定义

##### 组件内的守卫
beforeRouteEnter，beforeRouteUpdate，beforeRouteLeave，参数都为to，from和next

beforeRouteEnter不能访问this，但是可以吧组件实力作为回调函数的参数

#### 完整的导航解析流程
1. 导航被触发。
2. 在失活的组件里调用离开守卫。
3. 调用全局的 beforeEach 守卫。
4. 在重用的组件里调用 beforeRouteUpdate 守卫 (2.2+)。
5. 在路由配置里调用 beforeEnter。
6. 解析异步路由组件。
7. 在被激活的组件里调用 beforeRouteEnter。
8. 调用全局的 beforeResolve 守卫 (2.5+)。
9. 导航被确认。
10. 调用全局的 afterEach 钩子。
11. 触发 DOM 更新。
12. 用创建好的实例调用 beforeRouteEnter 守卫中传给 next 的回调函数。

导航守卫仅仅应用在路由的跳转目标上，如果对路由a添加导航守卫，但是a却重定向到了b，那么不会触发路由守卫。

vue-router默认hash模式，使用URL的hash来模拟一个完整的URL，于是当URL改变时，页面不会重新加载。（有#号的是hash，否则是history）。
history模式下，如果后端对路由缺少解析，那么就容易返回404，所以就需要在服务器端增加一个资源不存在的候选资源。

hash模式下仅hash符号之前的内容会被包含在请求中。


## vuex

##### mutations
mutations的参数是state和payload

##### actions
这是store的根对象
actions接收一个与store实例具有相同方法和属性的context对象，但是却并不是store实例本身

分发形式如下：
```
// 以载荷形式分发
store.dispatch('incrementAsync', {
  amount: 10
})

// 以对象形式分发
store.dispatch({
  type: 'incrementAsync',
  amount: 10
})
```

##### module
对于模块局部的mutation和getter，接受的第一个参数是模块局部的状态对象，即state
而actions的context包括了state，commit，rootState三个属性