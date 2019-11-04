## 接口

### 类静态部分和实例部分的区别


### public,private,protected区别

public是默认修饰符，在当前类，派生类和外部都可以访问，private是表示私有，只能在当前类访问，不能在外部和派生类中访问，protected表示受保护，只能在当前类和派生类中访问，不能在外部访问

### type和interface的区别
- interface 和 type interface 和 type 都可以用来定义一些复杂的类型结构，最很多情况下是通用的，最初我一直没能理解它们二者之间区别在哪里，后来发现，二者的区别在于：
   - interface创建了一种新的类型，而 type 仅仅是别名，是一种引用；
   - 如果 type 使用了 union operator （|） 操作符，则不能将 type implements 到 class 上；
   - 如果 type 使用了 union（|） 操作符 ，则不能被用以 extends interface
   - type 不能像 interface 那样合并，其在作用域内唯一；
