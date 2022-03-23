---
title: 深入研究微信小程序的wepy框架
date: 2017-12-30 13:24:28
tags: 小程序
categories: 小程序
---

## 小程序现状
微信小程序自发布到如今已经有半年多的时间了,凭借微信平台的强大影响力，越来越多企业加入小程序开发。 小程序于传统web页和APP比相比，有以下优势： 

1. 小程序拥有更多的能力，包括定位、录音、文件、媒体、各种硬件能力等，想象空间更大 
2. 运行在微信内部，体验更接近APP
3. 在过度竞争的互联网行业中，获取一个有效APP用户的成本已经非常高了，小程序相比APP更加轻量、即用即走， 更容易获取用户

## 小程序问题

从**开发角度**来讲，，但同时也带来很多不便： 

1、虽然小程序官方封装了很多常用组件给开发带来很多便利性,但在自定义组件复用性上十分薄弱,仅仅支持模板片段层面的复用,业务代码与交互事件都不支持。

2、小程序不支持SASS、LESS等预编译器,而小程序的`WXSS`语法在学习成本和功能性比不上我们日常开发的预编译器.

3、小程序支持部分ES6语法,不支持ES7、ES8的新语法.

4、在开发模式上,如果是`Angular`、`VUE`的开发者,在适应小程序的开发模式上,还需要时间适应.

## Wepy框架

基于小程序存在的问题,腾讯的官方团队推出了`wepy`框架，该框架是腾讯内部基于小程序的开发框架，设计思路基本参考**VUE**，开发模式和编码风格上80%以上接近VUE，开发者可以以很小的成本从VUE开发切换成小程序开发。
WePY 是一款让小程序真正支持组件化开发的框架，通过预编译的手段让开发者可以选择自己喜欢的开发风格去开发小程序。框架的细节优化，`Promise`，`Async`、`await`的引入都是为了能让开发小程序项目变得更加简单，高效。

### Wepy框架的优势

1.**新增属性,并针对原生API进行优化** 
对现在API进行promise处理，同时修复一些现有API的缺陷，比如：`wx.request`并发问题等。


	// 官方
	wx.request({
	    url: 'xxx',
	    success: function (data) {
	        console.log(data);
	    }
	});
	
	// wepy 使用方式
	// request 接口从只接收Object变为可接收String
	wx.request('xxxx').then((d) => console.log(d));


在同时并发10个request请求测试时：
不使用wepy:
![](https://segmentfault.com/image?src=https://cloud.githubusercontent.com/assets/2182004/20554651/5185f740-b198-11e6-88f8-45e359090dc3.png&objectId=1190000007580866&token=fd4bd72096cf29af2f7aa954056f459a)
![](https://segmentfault.com/image?src=https://cloud.githubusercontent.com/assets/2182004/20554886/c30e802a-b199-11e6-927d-08cd4e5ed0b0.png&objectId=1190000007580866&token=4cfef2840665f05dc9359b979eb2bb74)

使用wepy后：
![](https://segmentfault.com/image?src=https://cloud.githubusercontent.com/assets/2182004/20554663/65704c2e-b198-11e6-8277-abb77e0c7b3e.png&objectId=1190000007580866&token=eb5231dacbbab14ae42efeea2c4fee82)


### 新增属性(vue移植)

- computed 计算属性
- watcher 监听器
- props 传值
- slot 组件内容分发插槽


---

2.**单文件模式**
使得目录结构更加清晰 小程序官方目录结构要求app必须有三个文件`app.json`，`app.js`，`app.wxss`，页面有4个文件 `index.json`，`index.js`，`index.wxml`，`index.wxss`。而且文件必须同名。 所以使用wepy开发前后开发目录对比如下：

官方DEMO：


	project
	
	├── pages
	
	|   ├── index
	
	|   |   ├── index.json  index 页面配置
	
	|   |   ├── index.js    index 页面逻辑
	
	|   |   ├── index.wxml  index 页面结构
	
	|   |   └── index.wxss  index 页面样式表
	
	|   └── log
	
	|       ├── log.json    log 页面配置
	
	|       ├── log.wxml    log 页面逻辑
	
	|       ├── log.js      log 页面结构
	
	|       └── log.wxss    log 页面样式表
	
	├── app.js              小程序逻辑
	
	├── app.json            小程序公共设置
	
	└── app.wxss            小程序公共样式表


使用wepy框架后目录结构：

	project
	
	└── src
	
	    ├── pages
	
	    |   ├── index.wpy    index 页面配置、结构、样式、逻辑
	
	    |   └── log.wpy      log 页面配置、结构、样式、逻辑
	
	    └──app.wpy           小程序配置项（全局样式配置、声明钩子等）



3.**真正的组件化开发**
 小程序虽然有 标签可以实现组件复用，但仅限于模板片段层面的复用，业务代码与交互事件 仍需在页面处理。无法实现组件化的松耦合与复用的效果.
但**wepy**能够真正实现组件化开发,这也是使用它的最大优势之一,而且`wepy`在使用上更靠近`vue`框架的书写风格,使用起来更得心应手。

	/ index.wpy

	<template>
	    <view>
	        <panel>
	            <h1 slot="title"></h1>
	        </panel>
	        <counter1 :num="myNum"></counter1>
	        <counter2 :num.sync="syncNum"></counter2>
	        <list :item="items"></list>
	    </view>
	</template>
	<script>
	
	import wepy from 'wepy';
	
	import List from '../components/list';
	
	import Panel from '../components/panel';
	
	import Counter from '../components/counter';
	
	
	export default class Index extends wepy.page {
	    config = {
	        "navigationBarTitleText": "test"
	    };
	
	    components = {
	        panel: Panel,
	        counter1: Counter,
	        counter2: Counter,
	        list: List
	    };
	
	    data = {
	        myNum: 50,
	        syncNum: 100,
	        items: [1, 2, 3, 4]
	    }
	}
	
	</script>

### 组件通信与交互
`wepy.component`基类提供三个方法`$broadcast`，`$emit`，`$invoke`，因此任一页面或任一组件都可以调用上述三种方法实现通信与交互，如：
1.**$broadcast**
$broadcast事件是由父组件发起，所有子组件都会收到此广播事件，除非事件被手动取消。事件广播的顺序为广度优先搜索顺序，如上图，如果Page_Index发起一个$broadcast事件，那么接收到事件的先后顺序为：A, B, C, D, E, F, G, H。如下图：

![](https://segmentfault.com/image?src=https://cloud.githubusercontent.com/assets/2182004/20554688/800089e6-b198-11e6-84c5-352d2d0e2f7e.png&objectId=1190000007580866&token=61f8192d48b7640ebef69ed8700726bf)

2.**$emit**
`$emit`与`$broadcast`正好相反，事件发起组件的父组件会依次接收到`$emit`事件，如上图，如果E发起一个$emit事件，那么接收到事件的先后顺序为：A, Page_Index。如下图：
![](https://segmentfault.com/image?src=https://cloud.githubusercontent.com/assets/2182004/20554704/9997932c-b198-11e6-9840-3edae2194f47.png&objectId=1190000007580866&token=707913104beb5c2ee310c64f22e37140)


3.**$invoke**
$invoke是一个组件对另一个组件的直接调用，通过传入的组件路径找到相应组件，然后再调用其方法。

如果想在`Page_Index`中调用组件A的某个方法：

	this.$invoke('ComA', 'someMethod', 'someArgs');


如果想在组件A中调用组件G的某个方法：


	this.$invoke('./../ComB/ComG', 'someMethod', 'someArgs');


---

4.**支持加载外部NPM包** 
小程序较大的缺陷是不支持`NPM`包，导致无法直接使用大量优秀的开源内容，`wepy`在编译过程当中，会递归 遍历代码中的`require`然后将对应依赖文件从`node_modules`当中拷贝出来，并且修改`require`为相对路径， 从而实现对外部NPM包的支持。

![](https://cloud.githubusercontent.com/assets/2182004/20554645/482b0f64-b198-11e6-8d4e-70c92326004f.png)

5.默认使用`babel`编译，支持ES6/7的一些新特性，如promise，async/await等等

6.wepy支持使用`LESS`、`SASS`、`Styus`；



### wepy编译原理

![](https://segmentfault.com/image?src=https://cloud.githubusercontent.com/assets/2182004/20554671/70a797a0-b198-11e6-8355-b7c234713d0c.png&objectId=1190000007580866&token=a4993b9e79afe4e9af0e6866dfebdab9)




### weby快速起步
weby配备了专门的构建工具脚手架`wepy-cli`协助开发,帮助快速起步


1.安装



	npm install wepy-cli -g



2.脚手架



	wepy new myproject



3.切换至项目目录



	cd myproject

4.实时编译


	wepy build --watch


`wepy`作为一款优秀的微信小程序框架，可以帮我们大幅提高开发效率，在为数不多的小程序框架中一枝独秀，希望有更多的团队选择wepy。