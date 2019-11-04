### 从入口开始



访问data里的数据是对vm._data里的数据进行了代理，其实就是对data函数返回的对象进行了一层代理，让我们访问的时候能够直接使用this就能访问



### 钩子函数执行顺序


```
graph LR
父beforeCreate-->父created
父created-->父beforeMount
父beforeMount-->子beforeCreate
子beforeCreate-->子beforeMout
子beforeMout-->子mounted
子mounted-->父mounted
```


