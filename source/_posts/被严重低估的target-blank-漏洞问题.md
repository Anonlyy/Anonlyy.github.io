---
title: 被严重低估的target='_blank'漏洞问题
date: 2019-03-08 23:05:56
tags: 安全
---


> 在网页中使用链接时，如果想要让浏览器自动在新的标签页打开指定的地址，通常的做法就是在 a 标签上添加 target等于"_blank" 属性。

> 然而，就是这个属性，为钓鱼攻击者带来了可乘之机。

## parent 与 opener

在说 `opener` 之前，可以先聊聊 `<iframe>` 中的 `parent`。
我们知道，在 `<iframe> `中提供了一个用于父子页面交互的对象，叫做 `window.parent`，我们可以通过 `window.parent` 对象来从框架中的页面访问父级页面的 `window`。
`opener` 与 `parent` 一样，只不过是用于 `<a target="_blank">` 在新标签页打开的页面的。通过 
`<a target="_blank">` 打开的页面，可以直接使用 `window.opener` 来访问来源页面的 `window` 对象。

### 重述攻击步骤

比如在当前的页面上存在一个链接：
<a href="https://www.baidu.com" target="_blank">进入一个“邪恶”的网站</a>

当用户点击了这个链接，在新的标签页打开了这个网站。这个邪恶的网站上只要包含着类似于这样的 `JavaScript` 代码：


```javascript
<script type='text/javascript'>
	if  (window.opener)  {
	  window.opener.location.replace('https://www.baidu.com');
	}
</script>
```

那么此时，用户在继续浏览这个新的标签页，而原来的网站所在的标签页此时已经被导航到了 `https://www.baidu.com`

上面的攻击步骤是在跨域的情况下的，在跨域情况下，opener 对象和 parent 一样，是受到限制的，仅提供非常有限的属性访问，并且在这仅有的几个属性中，大部分也都是不允许访问的（访问会直接抛出 `DOMException`）。
但是与 parent 不同的是，在跨域的情况下，opener 仍然可以调用 `location.replace` 方法而 parent 则不可以。

这样是十分可怕的,如果有不法分子利用在论坛或是某些博客上的链接跳转到对应的钓鱼网站,而你的源网站可能已经被钓鱼网站给更改为高仿的登录页,当你关掉钓鱼网站,就会在高仿的登录页输入你的账号密码,导致账号密码泄露。

## 防御措施

为了安全，现代浏览器都支持在`<a>`标签的 `rel` 属性中指定 `rel="noopener"`，这样，在打开的新标签页中，将无法再使用 `opener` 对象了，它设置为了 null。

```html
<a href="https://an.evil.site" target="_blank" rel="noopener">进入一个“邪恶”的网站</a>
```

`noopener` 属性看似是解决了所有问题，但是...浏览器的兼容性问题...
![](https://image.xposean.top/20210421092818.png)
可以看到，现在绝大多数浏览器都已经兼容了 `rel="noopener"` 属性了。但是，为了保护稍旧的“近代”浏览器或是很旧的“古代”浏览器甚至是“远古”浏览器，只有`noopener` 属性还是远远不够的。

这时，就只能请出下面这段原生 JavaScript 来帮忙了。

```javascript
	function openUrl(url) {
	  var newTab = window.open();
	  newTab.opener = null;
	  newTab.location = url;
	}
```



### 性能问题

如果网站使用了 `<a target="_blank">`，那么新打开的标签页的性能将会影响到当前页面。此时如果新打开的页面中执行了一个非常庞大的 `JavaScript` 脚本，那么原始标签页也会受到影响，会出现卡顿的现象（当然不至于卡死）。
而如果在链接中加入了 `noopener`，则此时两个标签页将会互不干扰，使得原页面的性能不会受到新页面的影响。