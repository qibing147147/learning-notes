## js面试题的一些笔记


##### 关于+运算

```
'a' + + 'b' // -> "aNaN"
```
因为+ 'b'等于NaN，所以结果为"aNaN"


##### 深拷贝

###### 利用JSON.parse(JSON.stringify(object))的弊端

- 会忽略 undefined
- 会忽略 symbol
- 不能序列化函数
- 不能解决循环引用的对象

##### 原型原型链

```
function foo() {}
let f1 = new foo();
console.log(f1.constructor === foo); // true
console.log(foo.prototype === f1.__proto__);//true
```

##### 变量提升

函数的提升先于变量的提升

#### 继承

##### 组合继承
```
function Parent(value) {
  this.val = value
}
Parent.prototype.getValue = function() {
  console.log(this.val)
}
function Child(value) {
  Parent.call(this, value)
}
Child.prototype = new Parent()

const child = new Child(1)

child.getValue() // 1
child instanceof Parent // true

```

这里通过call使得在即将创建的Child的实例的环境下（即child）调用了Parent构造函数，就会在所有的Child对象上执行Parent函数中定义的代码，就能实现将Parent的属性继承到child上了。然后通过改变子类的prototype对象来继承父类的函数。
缺点是导致子类上多了不需要的父类属性。

##### 寄生组合继承

```
function Parent(value) {
  this.val = value
}
Parent.prototype.getValue = function() {
  console.log(this.val)
}

function Child(value) {
  Parent.call(this, value)
}
Child.prototype = Object.create(Parent.prototype, {
  constructor: {
    value: Child,
    enumerable: false,
    writable: true,
    configurable: true
  }
})

const child = new Child(1)

child.getValue() // 1
child instanceof Parent // true
```
组合继承在继承父类的方法的时候调用了构造函数，而寄生组合继承优化了这一点。
###### Object.create
Object.create创建一个新对象，使用现有的对象来提供新创建的对象的__proto__。 
第一个参数就是要作为__proto__的对象。第二个参数为要添加到新创建对象上的可枚举属性。

而例子中就是把Parent的prototype作为Child.prototype.__ proto __，即让Child来继承Parent。再给其添加构造函数方法，即Child函数。

###### class

```
class Parent {
  constructor(value) {
    this.val = value
  }
  getValue() {
    console.log(this.val)
  }
}
class Child extends Parent {
  constructor(value) {
    super(value)
  }
}
let child = new Child(1)
child.getValue() // 1
child instanceof Parent // true
```
class利用extends来进行继承，super()相当于Parent.call(this)。

class的本质是构造函数的语法糖。


##### es6的proxy



#### 回调函数

回调函数就是一个通过函数指针调用的函数。如果你把函数的指针（地址）作为参数传递给另一个函数，当这个指针被用来调用其所指向的函数时，我们就说这是回调函数。回调函数不是由该函数的实现方直接调用，而是在特定的事件或条件发生时由另外的一方调用的，用于对该事件或条件进行响应。

#### 常用定时器函数（setTimeout,setInterval,requestAnimationFrame)

##### 避免setTimeout不能按期执行

在执行前代码记录时间，在执行完后，下一次循环的时间就是传入的时间减去执行代码消耗的时间。

#### instance of的原理

通过判断对象的原型链中是否能找到类型的prototype。


#### 垃圾回收机制

##### 新生代算法
新生代算法中的对象中一般存活时间比较短。在新生代空间中，内存空间被分为两部分，from和to，这两个中必定有一个是使用的，一个是空闲的，新分配的对象会被放入from空间，当from空间占满的时候，就会启动gc算法，算法会检查from空间中存活的对象并且移动到to空间中，有失活的对象就销毁。当复制完成后，将from空间和to空间互换。

##### 老生代算法

老生代中的对象一般存活时间较长且数量也多，使用了两个算法，分别是标记清除算法和标记压缩算法。

在讲算法前，先来说下什么情况下对象会出现在老生代空间中：

- 新生代中的对象是否已经经历过一次 Scavenge 算法，如果经历过的话，会将对象从新生代空间移到老生代空间中。
- To 空间的对象占比大小超过 25 %。在这种情况下，为了不影响到内存分配，会将对象从新生代空间移到老生代空间中。

老生代中的空间很复杂，有如下几个空间
```
enum AllocationSpace {
  // TODO(v8:7464): Actually map this space's memory as read-only.
  RO_SPACE,    // 不变的对象空间
  NEW_SPACE,   // 新生代用于 GC 复制算法的空间
  OLD_SPACE,   // 老生代常驻对象空间
  CODE_SPACE,  // 老生代代码对象空间
  MAP_SPACE,   // 老生代 map 对象
  LO_SPACE,    // 老生代大空间对象
  NEW_LO_SPACE,  // 新生代大空间对象

  FIRST_SPACE = RO_SPACE,
  LAST_SPACE = NEW_LO_SPACE,
  FIRST_GROWABLE_PAGED_SPACE = OLD_SPACE,
  LAST_GROWABLE_PAGED_SPACE = MAP_SPACE
};
```

在老生代中，以下情况会先启动标记清除算法：

- 某一个空间没有分块的时候
- 空间中被对象超过一定限制
- 空间不能保证新生代中的对象移动到老生代中

在这个阶段中，会遍历堆中的所有的对象，然后标记活的对象，在标记完成以后销毁所有没被标记的对象。这是标记清除法。

清除对象后会造成堆内存出现碎片的情况，当碎片超过一定的限制后会启动压缩算法。压缩过程中，将活的对象像一端移动，直到所有对象都移动完成然后清理掉不需要的内存。

#### 事件机制（事件触发的过程是怎么样的？知道什么是事件代理吗？）

##### 事件触发三阶段

1. window往事件触发处传播，遇到注册的捕获事件会触发
2. 传播到事件触发处时触发注册的事件
3. 从事件触发处往window传播，遇到注册的冒泡事件会触发

如果给body中的子节点添加冒泡事件和捕获事件，会按照注册的顺序执行。

##### 注册事件
addEventListener注册事件的第三个参数可以是布尔值或者对象。对于布尔值来说就是useCapture，默认为false，这决定了注册的事件是捕获事件还是冒泡事件。对于对象参数来说，有以下几个属性：

- capture：布尔值，和 useCapture 作用一样
- once：布尔值，值为 true 表示该回调只会调用一次，调用后会移除监听
- passive：布尔值，表示永远不会调用 preventDefault

##### 事件代理
给父元素绑定点击事件，然后使用event.target获取目标元素。

#### 跨域

如果协议，域名和端口有一个不同就会出现跨域问题。

为了防止csrf攻击，csrf攻击就是利用用户的登录态发起恶意请求。

跨域是拦截了响应，而不是拦截请求，请求其实是发出去了的。

#### 跨域解决方案

##### jsonp

jsonp的原理是利用script标签没有跨域限制的漏洞。通过script标签指向一个需要访问的地址并提供一个回调函数来接受数据当需要通讯时。jsonp使用简单且兼容性不错，但是只限于get请求。

##### CORS（跨域资源共享）

CORS 需要浏览器和后端同时支持。IE 8 和 9 需要通过 XDomainRequest 来实现。

浏览器会自动进行 CORS 通信，实现 CORS 通信的关键是后端。只要后端实现了 CORS，就实现了跨域。

服务端设置 Access-Control-Allow-Origin 就可以开启 CORS。 该属性表示哪些域名可以访问资源，如果设置通配符则表示所有网站都可以访问资源。

虽然设置 CORS 和前端没什么关系，但是通过这种方式解决跨域问题的话，会在发送请求时出现两种情况，分别为简单请求和复杂请求。

###### 简单请求
以 Ajax 为例，当满足以下条件时，会触发简单请求

1. 使用下列方法之一：

- GET

- HEAD

- POST

2. Content-Type 的值仅限于下列三者之一：

- text/plain

- multipart/form-data

- application/x-www-form-urlencoded

请求中的任意 XMLHttpRequestUpload 对象均没有注册任何事件监听器； XMLHttpRequestUpload 对象可以使用 XMLHttpRequest.upload 属性访问。

###### 复杂请求

那么很显然，不符合以上条件的请求就肯定是复杂请求了。

对于复杂请求来说，首先会发起一个预检请求，该请求是 option 方法的，通过该请求来知道服务端是否允许跨域请求。

对于预检请求来说，如果你使用过 Node 来设置 CORS 的话，可能会遇到过这么一个坑。

以下以 express 框架举例：

```
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials'
  )
  next()
})
```

该请求会验证你的 Authorization 字段，没有的话就会报错。

当前端发起了复杂请求后，你会发现就算你代码是正确的，返回结果也永远是报错的。因为预检请求也会进入回调中，也会触发 next 方法，因为预检请求并不包含 Authorization 字段，所以服务端会报错。

想解决这个问题很简单，只需要在回调中过滤 option 方法即可

```
res.statusCode = 204
res.setHeader('Content-Length', '0')
res.end()
```

##### document.domain

如果二级域名相同，就可以给页面添加document.domain 表示二级域名相同实现跨域。

##### postMessage

这种方式通常用于获取嵌入页面中的第三方页面数据。一个页面发送消息，另一个页面判断来源并接收消息；

```
// 发送消息端
window.parent.postMessage('message', 'http://test.com')
// 接收消息端
var mc = new MessageChannel()
mc.addEventListener('message', event => {
  var origin = event.origin || event.originalEvent.origin
  if (origin === 'http://test.com') {
    console.log('验证通过')
  }
})
```

#### 浏览器存储功能

cookie localStorage sessionStorage indexDB



**特性** | **cookie** | **localStorage** |	**sessionStorage** |	**indexDB**
---|---|---|---|---
数据生命周期	 | 一般由服务器生成，可以设置过期时间 |	除非被清理，否则一直存在	 | 页面关闭就清理 | 	除非被清理，否则一直存在
数据存储大小	 | 4K | 5M | 	5M |	无限
与服务端通信 | 	每次都会携带在 header 中，对于请求性能影响 | 	不参与 | 不参与 | 不参与

特性 | cookie | localStorage | sessionStorage | indexDB
---|---|---|---|---
数据生命周期	 | 一般由服务器生成，可以设置过期时间 |	除非被清理，否则一直存在	 | 页面关闭就清理 | 	除非被清理，否则一直存在
数据存储大小	 | 4K | 5M | 	5M |	无限
与服务端通信 | 	每次都会携带在 header 中，对于请求性能影响 | 	不参与 | 不参与 | 不参与