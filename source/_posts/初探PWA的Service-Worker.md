---
title: 初探PWA的Service Worker
date: 2018-04-23 09:48:25
tags: 前端
---
---

**Progressive Web App**, 简称 **PWA**，是提升` Web App`的体验的一种新方法，能给用户原生应用的体验，致力于用前沿的技术开发，让网页使用如同**原生App**般的体验的一系列**方案**。

用来自**Google Developers**的解答`Progressive Web Apps`:

- **渐进式** - 适用于所有现代浏览器，因为它是以渐进式增强作为宗旨开发的
- **离线使用** - 借助 `Service Worker` 能够在离线或者网络较差的情况下正常访问
- **可安装** - 用户可以添加到桌面并生成快捷方式,一键访问
- **类似应用** - 由于是在 [`App Shell`](https://developers.google.cn/web/fundamentals/architecture/app-shell) 模型基础上开发，因为应具有 `Native App` 的交互和导航，给用户 `Native App` 的体验
- **持续更新** - 始终是最新的，无版本和更新问题
- **安全** - 通过 `HTTPS` 协议提供服务，防止窥探和确保内容不被篡改
- **可索引** - 应用清单文件和 `Service Worker` 可以让搜索引擎索引到，从而将其识别为『应用』
- **粘性** - 网页已经关闭的情况下还可以通过[推送后台通知](https://zhangxinxu.github.io/https-demo/notification/basic.html)等，让用户回流

我们也可以通过一个DEMO看看实际效果=>[lavas-demo](https://lavas-project.github.io/lavas-demo/appshell/#/)

而其中,**PWA方案**的最主要核心功能都是依赖于`Service Worker`这个API来实现的.

----------



## Service Worker是什么呢?

W3C 组织早在 2014 年 5 月就提出过 `Service Worker`这样的一个 HTML5 API ，主要用来做持久的离线缓存。

当然这个 API 不是凭空而来，至于其中的由来我们可以简单的捋一捋：

浏览器中的` javaScript` 都是运行在一个单一主线程上的，在同一时间内只能做一件事情。随着 Web 业务不断复杂，我们逐渐在 js 中加了很多耗资源、耗时间的复杂运算过程，这些过程导致的性能问题在 WebApp 的复杂化过程中更加凸显出来。

W3C 组织早早的洞察到了这些问题可能会造成的影响，这个时候有个叫`Web Worker` 的 API 被造出来了，这个 API 的唯一目的就是解放主线程，`Web Worker` 是脱离在主线程之外的，将一些复杂的耗时的活交给它干，完成后通过 `postMessage` 方法告诉主线程，而主线程通过 `onMessage` 方法得到 `Web Worker` 的结果反馈。

一切问题好像是解决了，但 Web Worker 是临时(即浏览器关闭后就关闭了)的，我们能不能有一个东东是一直持久存在的，并且随时准备接受主线程的命令呢？基于这样的需求推出了最初版本的 `Service Worker` ，`Service Worker` 在 `Web Worker` 的基础上加上了持久离线缓存能力.

`Service Worker` 有以下功能和特性：

- 一个**独立**的 `worker` 线程，独立于当前网页进程。
- 一旦被 `install`，就永远存在，除非被 `uninstall`
- 需要的时候可以直接唤醒，不需要的时候自动睡眠
- 可编程拦截代理请求和返回，缓存文件，缓存的文件可以被网页进程取到（包括网络离线状态）
- 离线内容开发者可控
- 能向客户端推送消息
- **不能直接操作 `DOM`**
- 出于安全的考虑，必须在 **`HTTPS`** 环境下才能工作

所以我们基本上知道了 `Service Worker` 的伟大使命，就是让缓存做到优雅和极致，让 Web App 相对于 Native App 的缺点更加弱化，也为开发者提供了对性能和体验的无限遐想。

### Service Worker工作原理

`Service Worker`的技术核心是`Service Worker`脚本，它 是一种由`Javascript`编写的浏览器端代理脚本。

前端页面向内核发起注册时会将脚本地址通知内核，内核会启动独立进/线程加载`Service Worker`脚本并执行`Service Worker`安装及激活动作。成功激活后便进入空闲等待状态，若当前的`Service Worker`进/线程一直没有管辖的页面或者事件消息时会自动终止（具体的终止策略视不同浏览器及版本而定，不会影响前端编写逻辑，但前端勿在`Service Worker`脚本中保存需要持久化的信息，可以借助`localstorage`），当打开新的可管辖页面或者已管辖页面发起`message`等消息时，`Service Worker`进/线程会被重新唤起。

每当已安装的`Service Worker`有管辖页面被打开时，便会触发`Service Worker`脚本更新，当`Service Worker`脚本发生了更改，便会忽略本地网络`cache`的`Service Worker`脚本直接从网络拉取。若网络拉取的与本地有一个字节的差异都会触发`Service Worker`脚本的更新，更新流程与安装类似，只是在更新安装成功后不会立即进入`active`状态，需要等待旧版本的`Service Worker`进/线程终止。

![](https://x5.tencent.com/tbs/img/article/sw-1.png)

### 实例代码

```javascript
// 在html里注册service-worker
if (navigator.serviceWorker != null) {
    navigator.serviceWorker.register('sw.js')
      .then(function(registration) {
        console.log('Registered events at scope: ', registration.scope);
      });
  }	
```

```javascript
// 首先定义需要缓存的路径, 以及需要缓存的静态文件的列表。
var cacheStorageKey = 'minimal-pwa-8'

var cacheList = [
  '/',
  "index.html",
  "main.css",
  "e.png",
  "*.png"
]

// 借助 Service Worker, 可以在注册完成安装 Service Worker 时, 抓取资源写入缓存:
window.addEventListener('install', function(e) {
  console.log('Cache event!')
  e.waitUntil(
    caches.open(cacheStorageKey).then(function(cache) {
      console.log('Adding to Cache:', cacheList)
      return cache.addAll(cacheList) 
    }).then(function() {
      console.log('Skip waiting!')
      return self.skipWaiting()
    })
  )
})

// 网页抓取资源的过程中, 在 Service Worker 可以捕获到 fetch 事件, 可以编写代码决定如何响应资源的请求:
window.addEventListener('fetch', function(e) {
  // console.log('Fetch event:', e.request.url)
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response != null) {
        console.log('Using cache for:', e.request.url)
        return response
      }
      console.log('Fallback to fetch:', e.request.url)
      return fetch(e.request.url)
    })
  )
})
```

----------

### 关于事件
**install** 事件:当前`Service Worker`脚本被安装时，会触发 install 事件。

**push**事件:
push 事件是为推送通知而准备的。不过首先你需要了解一下 [`Notification API` ](http://www.zhangxinxu.com/wordpress/2016/07/know-html5-web-notification/)和 `PUSH API`。

通过 `PUSH API`，当订阅了推送服务后，可以使用推送方式唤醒 `Service Worker` 以响应来自系统消息传递服务的消息，即使用户已经关闭了页面。


**online/offline**事件:
当网络状态发生变化时，会触发 `online` 或 `offline` 事件。结合这两个事件，可以与 `Service Worker` 结合实现更好的离线使用体验，例如当网络发生改变时，替换/隐藏需要在线状态才能使用的链接导航等。

**fetch** 事件：
当我们安装完`Service Worker`成功并进入激活状态后即运行于浏览器后台,我们的这个线程就会一直监控我们的页面应用,如果出现`HTTP`请求,那么就会触发`fetch`事件，并且给出自己的响应。
这个功能是十分强大的,借助 `Fetch API` 和 `Cache API` 可以编写出复杂的策略用来区分不同类型或者页面的资源的处理方式。它能够提供更加好的用户体验:
例如可以实现**缓存优先、降级处理**的策略逻辑：监控所有 http 请求，当请求资源已经在缓存里了，直接返回缓存里的内容；否则使用 fetch API 继续请求，如果是 图片或 css、js 资源，请求成功后将他们加入缓存中；如果是离线状态或请求出错，则降级返回预缓存的离线内容。



---

### 使用

看到这里很多人会有疑问了,既然可以通过`service-worker`缓存资源,那如果一个正式项目,在项目迭代后,并将代码推送到正式环境后,前端怎么实时知道并重新缓存新的资源呢?

​	第一种方式,就是每次修改都手动去更改sw文件的版本号,触发更新。

​	第二种就是使用`webpack`插件自动化处理

事实上,在我们真实的用`webpack`生成的项目中,如果按照第一种方式手动去写`Service-worker.js`文件的话，会遇到两个问题:

1. `webpack`生成的资源多会生成一串hash，`Service-worker.js`的资源列表里面需要同步更新这些带hash的资源； 
2. 每次更新代码，都需要通过更新`service-worker`文件版本号来通知客户端对所缓存的资源进行更新.

看到这里就该让用`webpack`插件:[offline-plugin](https://github.com/NekR/offline-plugin) 登场了,官方同时也推荐[sw-precache-webpack-plugin](https://github.com/goldhand/sw-precache-webpack-plugin) ,[offline-plugin](https://github.com/NekR/offline-plugin)不仅能够解决刚刚那个提到的缓存更新的问题,同时还具备以下的优点:

- 1、自动生成和更新Service-worker.js文件和自动为SW添加缓存资源列表 
- 2、更为详细的文档和例子；
- 3、迭代频率相对更高，star数更多；
- 4、自动处理生命周期，用户无需纠结生命周期的坑；
- 5、支持自动生成`manifest`文件。 



部署到项目中也十分的简单

#### 1.安装

```bash
npm install offline-plugin [--save-dev]
```

#### 2.初始化

第一步，进入`webpack.config.js`:

```javascript
// webpack.config.js example

var OfflinePlugin = require('offline-plugin');

module.exports = {
  // ...

  plugins: [
    // ... other plugins
    // it's always better if OfflinePlugin is the last plugin added
    new OfflinePlugin()
  ]
  // ...
}
```

#### 3.入口文件导入

```javascript
import * as OfflinePluginRuntime from 'offline-plugin/runtime';
OfflinePluginRuntime.install();
```

经过上面的步骤，`offline-plugin`已经集成到项目之中，通过`webpack`构建即可。 

具体代码也可查看 [demo](https://github.com/NekR/offline-plugin)

---

#### 博客中使用

在博客页面中`pwa`的使用, 其实更加的广泛, 那么本页面实际上也是使用了`pwa`的, 不信? 你可以试试离线访问哦

那么是怎么使用的呢？

如果你的博客页面是基于`jekyll`或者是`hexo`搭建起来的, 那么直接就有现成的插件可以使用啦
[jekyll-pwa](https://github.com/lavas-project/jekyll-pwa)

[hexo-pwa](https://github.com/lavas-project/hexo-pwa)

以`hexo`为例:

```bash
npm install --save hexo-pwa
```

在`hexo`项目中找到`	_config.yml`文件, 添加以下代码

```yml
pwa:
  manifest:
  #   path: /manifest.json
  #   body:
  #     name: hexo
  #     short_name: hexo
  #     icons:
  #       - src: /images/android-chrome-192x192.png
  #         sizes: 192x192
  #         type: image/png
  #       - src: /images/android-chrome-512x512.png
  #         sizes: 512x512
  #         type: image/png
  #     start_url: /index.html
  #     theme_color: '#ffffff'
  #     background_color: '#ffffff'
  #     display: standalone
  serviceWorker:
    path: /sw.js
    preload:
      urls:
        - /
      posts: 5
    opts:
      networkTimeoutSeconds: 5
    routes:
      # - pattern: !!js/regexp /hm.baidu.com/
      #   strategy: networkOnly
      - pattern: !!js/regexp /.*\.(js|css|jpg|jpeg|png|gif)$/
        strategy: cacheFirst
      - pattern: !!js/regexp /\//
        strategy: networkFirst
  priority: 5
```

重启服务, 再打开就可以啦！



### PWA的浏览器支持情况

> [兼容性查看](https://lavas.baidu.com/ready)

毕竟是自家产品,chrome浏览器肯定是支持度最高的浏览器,chrome64版本是基本支持所有PWA功能`API`的。

但国内的浏览器·支持情况相对差一些,而且chrome移动版的使用人群还是偏少的,不过在UC的支持程度也不低

![](http://p53ff6x0c.bkt.clouddn.com/18-4-24/56137583.jpg)

![](http://p53ff6x0c.bkt.clouddn.com/18-4-24/70665880.jpg)

![](http://p53ff6x0c.bkt.clouddn.com/18-4-24/79002804.jpg)