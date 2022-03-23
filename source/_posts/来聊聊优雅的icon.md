---
title: 来聊聊优雅的Icon
date: 2019-01-24 09:31:38
tags: 前端
---


## 前言
在做前端后台项目的时候经常会用到很多 `icon` 图标，刚开始还好，但随着项目的不断迭代，每次修改添加图标会变得很麻烦，而且总觉得不够优雅，就开始琢磨着有啥简单方便的工作流呢？


## Icon发展史

### 雪碧图
在我刚开始实习时，大部分图标都是用 img 来实现的。渐渐发现一个页面的请求资源中图片 img 占了大部分，所以为了优化有了image sprite 就是所谓的雪碧图，就是将多个图片合成一个图片，然后利用 css 的 background-position 定位显示不同的 icon 图标。
![](https://i.imgur.com/QrDbmyK.png)

#### 制作雪碧图

1.photoShop手动制作后生成
  这种方式是最费时费力的方式,在多数情况并不使用。

2.通过在线网站或客户端直接生成
  如[GO!PNG](http://alloyteam.github.io/gopng/###)、[sprite-generator](https://www.toptal.com/developers/css/sprite-generator)、[CssGaga](http://www.99css.com/cssgaga/)	
3.Gulp实现雪碧图自动合成
  安装Gulp插件`sprity`并配置icon路径,会生成对应的雪碧图和css,详情可查看[教程](https://segmentfault.com/a/1190000002910313)

4.Webpack实现
  配置webpack环境后,安装雪碧图依赖模块：[webpack-spritesmith](https://www.npmjs.com/package/webpack-spritesmith),并配置即可,此种方式和gulp类似
	

雪碧图虽好,但这个也有一个很大的痛点，**维护困难**。每新增一个图标，都需要改动原始图片，还可能不小心出错影响到前面定位好的图片.
于是就出现了下一种方式。

---


### Iconfont

icon font ，图标字体，也叫字体图标，顾名思义，就是字体做的图标。因为他是矢量图标,能够自由的变化大小，且不会模糊,其次比图片小，加载快，还能够任意改变颜色，所以越来越多的图标都开始使用 icon font

#### 原理
每种字体在相同的字都是不一样的，比如 宋体 跟 微软雅黑 ，相同的字 ，由于调用的不同的字体，浏览器显示明显是有区别的。

在我们还不识字的时候，每个字都是一个图案，所以老师会告诉你哪个图案念什么 ，是什么字，iconfont 同理，我认为 三角形 是 a，那对于我来说，只要是 a ，就应该是个 三角形。

在电脑上，我给电脑规定 a 的样子是个 三角形，那么当显示 a 的时候，他就显示个三角形。

当我把网页上的所有图标都对应一个字符的时候，你在代码里输入某个字符，那这个字符就显示你规定的形状，这就是 iconfont 图标。

把所有的图标都放在一个字体里面，就是一个字体库了，然后按照正常字体库（本来就是正常的字体库）调用就行了。

也就是说,我们可以理解为每一个字体就是一个矢量图标,只是现在我们这个矢量图标不是**字**,而是一个**图案**.
![](https://i.imgur.com/U7aQO1i.gif)
![](https://i.imgur.com/FtkFFNC.png)


此外,为了保证兼容性,所以又有`.eot`、`.woff`、`.ttf`、`.svg`四种格式的字体文件.



#### iconfont 三种使用方式

**unicode**

最开始我们使用了unicode的格式，它主要的特点是优势：

1. 兼容性最好，支持ie6+
2. 支持按字体的方式去动态调整图标大小，颜色等等

劣势：

1. 书写不直观，语意不明确
2. 在不同的设备浏览器字体的渲染会略有差别
3. 不支持多色图标



		<i class="iconfont">&#xe604;</i>

![](https://i.imgur.com/gmBCWBw.png)


**font-class**

相比它也是我们日常开发中最常用到的,相比于unicode语意明确，书写更直观。可以很容易分辨这个icon是什么，但只兼容IE8+。

	<i class="iconfont icon-xxx"></i>


![](https://i.imgur.com/ySVgFUc.png)


它的主要原理其实是和 unicode 一样的，它只是多做了一步，将原先`&#xe604`这种写法换成了`.icon-QQ`，它在每个 class 的 `before` 属性中写了`unicode`,省去了人为写的麻烦。如 

		.icon-QQ:before { content: "\e604"; }


相对于`unicode`它的修改更加的方便与直观。但也有一个大坑，之前楼主一个项目中用到了两组`font-class` 由于没有做好命名空间，所有的`class`都是放在`.iconfont` 命名空间下的，一上线引发了各种雪崩问题，修改了半天，所以使用`font-class`一定要注意命名空间的问题。



**svg-sprite**



一个普通的SVG图标是这样的:

	<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24"> 
		<path fill="#E86C60" d="M17,0c-1.9,0-3.7,0.8-5,2.1C10.7,0.8,8.9,0,7,0C3.1,0,0,3.1,0,7c0,6.4,10.9,15.4,11.4,15.8 c0.2,0.2,0.4,0.2,0.6,0.2s0.4-0.1,0.6-0.2C13.1,22.4,24,13.4,24,7C24,3.1,20.9,0,17,0z"></path>
	</svg>

我们可以把SVG元素看成一个舞台，而symbol则是舞台上一个一个组装好的元件，这这些一个一个的元件就是我们即将使用的一个一个SVG图标。

于是,集合了三个SVG图标的SVG元素的代码就是这样的:

	<svg>
	    <symbol id="icon-share">
	        <!-- 第1个图标路径形状之类代码 -->
			<path fill="#E86C60" d="M17,0c-1.9,0-3.7,0.8-5,2.1C10.7,0.8,8.9,0,7,0C3.1,0,0,3.1,0,7c0,6.4,10.9,15.4,11.4,15.8 c0.2,0.2,0.4,0.2,0.6,0.2s0.4-0.1,0.6-0.2C13.1,22.4,24,13.4,24,7C24,3.1,20.9,0,17,0z"></path>
	    </symbol>
	    <symbol id="icon-edit">
	        <!-- 第2个图标路径形状之类代码 -->
			<path fill="#E86C60" d="M17,0c-1.9,0-3.7,0.8-5,2.1C10.7,0.8,8.9,0,7,0C3.1,0,0,3.1,0,7c0,6.4,10.9,15.4,11.4,15.8 c0.2,0.2,0.4,0.2,0.6,0.2s0.4-0.1,0.6-0.2C13.1,22.4,24,13.4,24,7C24,3.1,20.9,0,17,0z"></path>
	    </symbol>
	    <symbol  id="icon-top">
	        <!-- 第3个图标路径形状之类代码 -->
			<path fill="#E86C60" d="M17,0c-1.9,0-3.7,0.8-5,2.1C10.7,0.8,8.9,0,7,0C3.1,0,0,3.1,0,7c0,6.4,10.9,15.4,11.4,15.8 c0.2,0.2,0.4,0.2,0.6,0.2s0.4-0.1,0.6-0.2C13.1,22.4,24,13.4,24,7C24,3.1,20.9,0,17,0z"></path>
	    </symbol>
	</svg>
	


但是，`<symbol>`元素不会被直接显示，大概相当于定义一个模板，然后使用`<use>`元素引用并进行渲染。

也就是说上面的svg元素还要加上这样的一句话才能显示:
	
	<svg><use xlink:href="#icon-share" /></svg>



![](https://i.imgur.com/uYBI3Mv.png)

使用方法：第一步：拷贝项目下面生成的symbol代码,该js包含了所有SVG图标：

		<script src="./iconfont.js"></script>

第二步：加入通用css代码（引入一次就行）：

	<style type="text/css">
	    .icon {
	       width: 1em; height: 1em;
	       vertical-align: -0.15em;
	       fill: currentColor;
	       overflow: hidden;
	    }
	</style>

第三步：挑选相应图标并获取类名，应用于页面：


	<svg class="icon" aria-hidden="true">
	    <use xlink:href="#icon-xxx"></use>
	</svg>



SVGIcon的好处:

- 支持多色图标了，不再受单色限制。
- 支持像字体那样通过font-size,color来调整样式。
- 无须像font那样引入多个字体库文件(woff|eot|ttf)
- 支持 ie9+
- 可利用CSS实现动画。
- 减少HTTP请求。
- 矢量，缩放不失真
- 可以很精细的控制SVG图标的每一部分


#### 如何生成或制作SVG图标


生成的方式有很多种:

1.设计师使用AI(Adobe illustrator)的时候就可以直接生成SVG图标。
2.[阿里iconfont](http://iconfont.cn)直接生成SVG，极其方便
3.[IcoMoon](https://icomoon.io/)导出时可选择SVG和iconfont、PNG三种方式
4.`webpack`的`svg-sprite-loader`,可将多个svg打包成`SVG-sprite`




## 总结
本文大概的讲述了一下ICON使用的发展史
总的来说还是那句话，适合的才是最好的。根据自己项目的兼容性和业务场景选择自己合适的icon方式,所有方案都没有绝对的优与劣之分，适合自己业务场景，解决自己实际痛点，提高自己开发效率的方案就是好的方案。