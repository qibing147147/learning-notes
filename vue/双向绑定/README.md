#### 这个问题最近面试都被问到很多，其实我一直都是一知半解，所以今天还是好好记录一下，免得下次又被问到。

### vue数据双向绑定原理

vue数据双向绑定是通过数据劫持结合发布-订阅者模式的方式来实现的。

vue会对data里面的属性添加get和set方法，而对象属性本身携带的set和get方法我们是没有办法直接修改的，所以这个时候object.defineProperty就派上用场了，它能够重新定义对象属性的set和get方法。其中set方法就是属性值被修改的时候会触发的方法，而get方法是在使用这个属性的值的时候会触发的方法。

而这就是vue为对象属性添加的数据劫持。

#### 思路分析

双向绑定的意思就是数据（data）变化更新视图（view），视图的变化也更新数据。而view更新data是比较容易的，比如input框可以通过监听input事件来更新data，所以我们的着重点在于data如何更新view。

根据上面说到的，我们只要在set方法中放入可以实现更新view的方法就可以了。

#### 实现过程
首先我们需要对数据进行劫持监听，所以我们需要设置一个observer来监听所有属性。如果属性发生变化，就通知订阅者watcher看是否需要更新，因为订阅者是有很多歌的，所以我们需要一个消息订阅器Dep来统一收集订阅者，并且对observer和watcher进行统一的管理。接着，我们需要一个指令解析器Compile，对每个节点元素进行扫描和解析，将相关指令对应初始化成一个订阅者watcher，并替换模板数据或者绑定相应的函数，此时当订阅者watcher接收到相应属性的变化，就会执行对应的更新函数，从而更新视图。
主要是以下3部分
1. 实现一个监听器Observer，用来劫持并且监听所有属性，如果有变动的就通知订阅者。
2. 实现一个订阅者watcher，可以收到属性的变化通知并执行相应的函数，从而更新视图。
3. 实现一个解析器Compile，可以扫描和解析每个节点的香瓜指令，并根据初始化模板数据以及初始化相应的订阅器。

##### 1. 实现一个observer

Observer是一个数据监听器，核心方法就是Object.defineProperty()，如果对所有属性都进行监听的话，那么可以通过递归方法遍历所有的属性值，并对其进行object.defineProperty()处理。


```
function defineReactive(data, key, val) {
    observe(val); // 递归遍历所有子属性
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get: function() {
            return val;
        },
        set: function(newVal) {
            val = newVal;
            console.log('属性' + key + '已经被监听了，现在值为：“' + newVal.toString() + '”');
        }
    });
}
 
function observe(data) {
    if (!data || typeof data !== 'object') {
        return;
    }
    Object.keys(data).forEach(function(key) {
        defineReactive(data, key, data[key]);
    });
};
 
var library = {
    book1: {
        name: ''
    },
    book2: ''
};
observe(library);
library.book1.name = 'vue权威指南'; // 属性name已经被监听了，现在值为：“vue权威指南”
library.book2 = '没有此书籍';  // 属性book2已经被监听了，现在值为：“没有此书籍”
```

接下来就是订阅器Dep的实现 改造上面的observer，加入Dep

```
function defineReactive(data, key, val) {
    observe(val); // 递归遍历所有子属性
    var dep = new Dep(); 
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get: function() {
            if (是否需要添加订阅者) {
                dep.addSub(watcher); // 在这里添加一个订阅者
            }
            return val;
        },
        set: function(newVal) {
            if (val === newVal) {
                return;
            }
            val = newVal;
            console.log('属性' + key + '已经被监听了，现在值为：“' + newVal.toString() + '”');
            dep.notify(); // 如果数据变化，通知所有订阅者
        }
    });
}
 
function Dep () {
    this.subs = [];
}
Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};
```
在set中，如果数据变化就会通知订阅者。

##### 2.实现watcher

订阅者watcher在初始化的时候需要将自己添加进订阅器Dep中，而初始化就是在get中进行的，因为当我们获取了这个属性的时候，就相当于我们订阅了这个属性，就等于是将自己加入到订阅者的队列中。而触发get的方法就是获取一下属性的值就好了。我们只需要在watcher初始化的时候才需要添加订阅者，有些时候我们是不需要添加订阅者的，所以需要做一个判断操作，我们可以在订阅器的target上缓存在订阅者，添加以后，我们再释放。

```
function Watcher(vm, exp, cb) {
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    this.value = this.get();  // 将自己添加到订阅器的操作
}
 
Watcher.prototype = {
    update: function() {
        this.run();
    },
    run: function() {
        var value = this.vm.data[this.exp];
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal);
        }
    },
    get: function() {
        Dep.target = this;  // 缓存自己
        var value = this.vm.data[this.exp]  // 强制执行监听器里的get函数
        Dep.target = null;  // 释放自己
        return value;
    }
};

```

然后我们调整Observer，当Dep上有watcher的缓存的时候，我们就添加订阅者

```
function defineReactive(data, key, val) {
    observe(val); // 递归遍历所有子属性
    var dep = new Dep(); 
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get: function() {
            if (Dep.target) {.  // 判断是否需要添加订阅者
                dep.addSub(Dep.target); // 在这里添加一个订阅者
            }
            return val;
        },
        set: function(newVal) {
            if (val === newVal) {
                return;
            }
            val = newVal;
            console.log('属性' + key + '已经被监听了，现在值为：“' + newVal.toString() + '”');
            dep.notify(); // 如果数据变化，通知所有订阅者
        }
    });
}
Dep.target = null;
```

然后我们使用简单的模板进行检验，并且我们使用代理，在访问我们实例化的类的属性的之后，直接去访问data里面的值.
```
<body>
    <h1 id="name">{{name}}</h1>
</body>

function SelfVue (data, el, exp) {
    var self = this;
    this.data = data;
 
    Object.keys(data).forEach(function(key) {
        self.proxyKeys(key);  // 绑定代理属性
    });
 
    observe(data);
    el.innerHTML = this.data[exp];  // 初始化模板数据的值
    new Watcher(this, exp, function (value) {
        el.innerHTML = value;
    });
    return this;
}
 
SelfVue.prototype = {
    proxyKeys: function (key) {
        var self = this;
        Object.defineProperty(this, key, {
            enumerable: false,
            configurable: true,
            get: function proxyGetter() {
                return self.data[key];
            },
            set: function proxySetter(newVal) {
                self.data[key] = newVal;
            }
        });
    }
}


```

##### 3.实现Compile

现在我们需要一个Compile去解析dom节点，并且绑定相应的更新函数，主要步骤是：
1. 解析模板指令，并替换模板数据，初始化视图
2. 将模板指令对应的节点绑定更新函数，初始化相应的订阅器

为了解析模板，首先需要获取到dom元素，然后对dom元素上含有指令的节点进行处理，所以这个环节对dom操作比较频繁，所以可以先建一个fragment片段，将需要解析的dom节点存入fragment（相当于一个容器，假设我们要添加很多dom元素到页面中，如果我们每次都使用一个appendChild的话，页面需要重绘很多次，而使用fragment相当于是先提供了一个容器，在我们把所有待渲染的节点都放入这个容器中以后，我们再将fragment添加到页面上，这样的话就只用一次绘制，大大提高了性能）。

```
function nodeToFragment (el) {
    var fragment = document.createDocumentFragment();
    var child = el.firstChild;
    while (child) {
        // 将Dom元素移入fragment中
        fragment.appendChild(child);
        child = el.firstChild
    }
    return fragment;
}
```

这里我们先对{{变量}}这种形式进行处理

```
function compileElement (el) {
    var childNodes = el.childNodes;
    var self = this;
    [].slice.call(childNodes).forEach(function(node) {
        var reg = /\{\{(.*)\}\}/;
        var text = node.textContent;
 
        if (self.isTextNode(node) && reg.test(text)) {  // 判断是否是符合这种形式{{}}的指令
            self.compileText(node, reg.exec(text)[1]);
        }
 
        if (node.childNodes && node.childNodes.length) {
            self.compileElement(node);  // 继续递归遍历子节点
        }
    });
},
function compileText (node, exp) {
    var self = this;
    var initText = this.vm[exp];
    updateText(node, initText);  // 将初始化的数据初始化到视图中
    new Watcher(this.vm, exp, function (value) {  // 生成订阅器并绑定更新函数
        self.updateText(node, value);
    });
},
function updateText (node, value) {
    node.textContent = typeof value == 'undefined' ? '' : value;
}
```
在获取到最外面的节点后，调用compileElement，对所有子节点进行判断，如果节点是文本节点并且匹配{{}},那就可以开始进行编译处理，编译处理首先需要初始化视图数据，然后生成一个并绑定更新函数的订阅器，然后我们需要将解析器Compile与watcher和observer关联起来

```
function SelfVue (options) {
    var self = this;
    this.vm = this;
    this.data = options;
 
    Object.keys(this.data).forEach(function(key) {
        self.proxyKeys(key);
    });
 
    observe(this.data);
    new Compile(options, this.vm);
    return this;
}
```


```
function compile (node) {
    var nodeAttrs = node.attributes;
    var self = this;
    Array.prototype.forEach.call(nodeAttrs, function(attr) {
        var attrName = attr.name;
        if (self.isDirective(attrName)) {
            var exp = attr.value;
            var dir = attrName.substring(2);
            if (self.isEventDirective(dir)) {  // 事件指令
                self.compileEvent(node, self.vm, exp, dir);
            } else {  // v-model 指令
                self.compileModel(node, self.vm, exp, dir);
            }
            node.removeAttribute(attrName);
        }
    });
}
```

这里是处理了v-model指令。

##### 总结

我是参考了博客园上一位博主的文章的，但是博主写到后面又点乱了。而且也没有把代码全部说完，这里由于时间关系，我也不把代码全部说了，这里总结以下好了。

vue的双向绑定原理（以input框为例），vue是结合数据劫持和发布-订阅模式实现双向绑定，用object.defineproperty来对初始化时的data对象中的属性添加数据劫持，然后在初始化的时候，视图在需要对象中的属性的时候会需要调用get方法，这时候就可以将调用者作为订阅者添加到一个订阅器中，订阅器就是来管理所有的订阅该属性的订阅者，然后在我们改变对象中属性的值的时候，就会调用set方法，那么就可以在set中让订阅器通知所有的订阅者数据发生了变化。我们需要一个compile函数，帮助我们去解析dom节点，如果解析到dom节点上有v-model的时候，就会把v-model里的属性赋值给input框的value，这时候就会调用get方法，相当于就订阅了这个节点，然后给该节点增加一个input事件，在触发的时候就改变绑定在v-model上的值，（这里需要注意的是，因为改变值需要调用set方法，这样就会陷入一个循环，所以在新值和旧值相同的时候，就停止事件继续下去），所以我们在改变数据的时候会在set中触发观察者中的更新方法，我们在改变视图的时候就是通过input事件来改变数据中的值。


