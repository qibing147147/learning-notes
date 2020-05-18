# http

## http请求方法

### `GET`和`POST`的区别

首先最直观的是语义上的区别。

而后又有这样一些具体的差别:

- 从**缓存**的角度，GET 请求会被浏览器主动缓存下来，留下历史记录，而 POST 默认不会。
- 从**编码**的角度，GET 只能进行 URL 编码，只能接收 ASCII 字符，而 POST 没有限制。
- 从**参数**的角度，GET 一般放在 URL 中，因此不安全，POST 放在请求体中，更适合传输敏感信息。
- 从**幂等性**的角度，`GET`是**幂等**的，而`POST`不是。(`幂等`表示执行相同的操作，结果也是相同的)
- 从**TCP**的角度，GET 请求会把请求报文一次性发出去，而 POST 会分为两个 TCP 数据包，首先发 header 部分，如果服务器响应 100(continue)， 然后发 body 部分。(**火狐**浏览器除外，它的 POST 请求只发一个 TCP 包)

### HTTP状态码

- **1xx**: 表示目前是协议处理的中间状态，还需要后续操作。
- **2xx**: 表示成功状态。
- **3xx**: 重定向状态，资源位置发生变动，需要重新请求。
- **4xx**: 请求报文有误。
- **5xx**: 服务器端发生错误。

### 1xx

**101 Switching Protocols**。在`HTTP`升级为`WebSocket`的时候，如果服务器同意变更，就会发送状态码 101。

### 2xx

**200 OK**是见得最多的成功状态码。通常在响应体中放有数据。

**204 No Content**含义与 200 相同，但响应头后没有 body 数据。

**206 Partial Content**顾名思义，表示部分内容，它的使用场景为 HTTP 分块下载和断点续传，当然也会带上相应的响应头字段`Content-Range`。

### 3xx

**301 Moved Permanently**即永久重定向，对应着**302 Found**，即临时重定向。

比如你的网站从 HTTP 升级到了 HTTPS 了，以前的站点再也不用了，应当返回`301`，这个时候浏览器默认会做缓存优化，在第二次访问的时候自动访问重定向的那个地址。

而如果只是暂时不可用，那么直接返回`302`即可，和`301`不同的是，浏览器并不会做缓存优化。

**304 Not Modified**: 当协商缓存命中时会返回这个状态码。详见[浏览器缓存](http://47.98.159.95/my_blog/perform/001.html)

### 4xx

**400 Bad Request**: 开发者经常看到一头雾水，只是笼统地提示了一下错误，并不知道哪里出错了。

**403 Forbidden**: 这实际上并不是请求报文出错，而是服务器禁止访问，原因有很多，比如法律禁止、信息敏感。

**404 Not Found**: 资源未找到，表示没在服务器上找到相应的资源。

**405 Method Not Allowed**: 请求方法不被服务器端允许。

**406 Not Acceptable**: 资源无法满足客户端的条件。

**408 Request Timeout**: 服务器等待了太长时间。

**409 Conflict**: 多个请求发生了冲突。

**413 Request Entity Too Large**: 请求体的数据过大。

**414 Request-URI Too Long**: 请求行里的 URI 太大。

**429 Too Many Request**: 客户端发送的请求过多。

**431 Request Header Fields Too Large**请求头的字段内容太大。

### 5xx

**500 Internal Server Error**: 仅仅告诉你服务器出错了，出了啥错咱也不知道。

**501 Not Implemented**: 表示客户端请求的功能还不支持。

**502 Bad Gateway**: 服务器自身是正常的，但访问的时候出错了，啥错误咱也不知道。

**503 Service Unavailable**: 表示服务器当前很忙，暂时无法响应服务。

### http表单数据提交

表单提交主要有两种方式，就是以`content-type`区分

- `application/x-www-form-urlencoded`
- `Multipart/form-data`

其中`application/x-www-form-urlencoded`会对表单内容进行`url`编码

对于`multipart/form-data`而言:

- 请求头中的`Content-Type`字段会包含`boundary`，且`boundary`的值有浏览器默认指定。例: `Content-Type: multipart/form-data;boundary=----WebkitFormBoundaryRRJKeWfHPGrS4LKe`。
- 数据会分为多个部分，每两个部分之间通过分隔符来分隔，每部分表述均有 HTTP 头部描述子包体，如`Content-Type`，在最后的分隔符会加上`--`表示结束。

图片上传一般用`multipart/form-data`，因为用`application/x-www-form-urlencoded`编码会造成巨大消耗和占用更多空间。

### 队头阻塞

因为http最多支持6个连接并发，所以在一个域名下可以分出多个域名。

### Cookie

#### 安全相关

如果带上`Secure`，说明只能通过 HTTPS 传输 cookie。

如果 cookie 字段带上`HttpOnly`，那么说明只能通过 HTTP 协议传输，不能通过 JS 访问，这也是预防 XSS 攻击的重要手段。

相应的，对于 CSRF 攻击的预防，也有`SameSite`属性。

`SameSite`可以设置为三个值，`Strict`、`Lax`和`None`。

**a.** 在`Strict`模式下，浏览器完全禁止第三方请求携带Cookie。比如请求`sanyuan.com`网站只能在`sanyuan.com`域名当中请求才能携带 Cookie，在其他网站请求都不能。

**b.** 在`Lax`模式，就宽松一点了，但是只能在 `get 方法提交表单`况或者`a 标签发送 get 请求`的情况下可以携带 Cookie，其他情况均不能。

**c.** 在`None`模式下，也就是默认模式，请求会自动携带上 Cookie。

### http缓存

#### 代理缓存

就是让代理服务器接管一部分缓存，当客户端缓存过期以后，优先去代理服务器的缓存中获取，代理缓存过期了，才会去源服务器取。

### 源服务器的缓存控制

#### private 和 public

在源服务器的响应头中，会加上`Cache-Control`这个字段进行缓存控制字段，那么它的值当中可以加入`private`或者`public`表示是否允许代理服务器缓存，前者禁止，后者为允许。

比如对于一些非常私密的数据，如果缓存到代理服务器，别人直接访问代理就可以拿到这些数据，是非常危险的，因此对于这些数据一般是不会允许代理服务器进行缓存的，将响应头部的`Cache-Control`设为`private`，而不是`public`。

#### 代理服务器缓存相关字段

##### 源服务器的缓存控制

1. `Cache-control`，`private`,`public`，前者表示不允许代理服务器缓存数据，后者表示允许。
2. `must-revalidate`表示客户端过期就去源服务器取，`proxy-revalidate`表示代理服务器的缓存过期后到源服务器取。
3. `s-maxage`表示在代理服务器上最长的缓存时间。

##### 客户端的缓存控制

1. `max-stale`，在过期几秒内还能够使用代理的缓存
2. `min-fresh`，在过期前五秒就要到缓存拿，否则拿不到
3. `only-if-cached`，只接受代理缓存，不会接受源服务器的响应。

## Accept字段

```
// 发送端
Content-Encoding: gzip
// 接收端
Accept-Encoding: gzip
```

## 对于定长和不定长的数据，HTTP 是怎么传输的？

定长数据直接设置content-length 

不定长数据设置Transfer-Encoding: chunked，会分几次传输 

## 跨域

### 什么是跨域？

浏览器有同源策略，即当协议，域名和端口相同时，称为同源，当不同源时就会发生跨域。

### 浏览器如何拦截响应？

简单请求会直接发出，浏览器自动加上origin字段，服务端会返回Access-Control-Request-Method，如果不支持请求方法，则是跨域。

非简单请求会发送预检请求，如果返回不支持请求方法，则不会发送真正的cors请求。

### 如何解决？ 

- JSONP
- nginx