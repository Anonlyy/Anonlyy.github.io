---
title: 浏览器渲染与Virtual DOM相关
date: 2019-09-05 15:41:20
tags: 前端
categories: 前端
cover: https://image.xposean.top/blogImage/007.png

---
## 浏览器如何渲染页面

作为一名web前端码农,每天都在接触着浏览器.长此以往我们都会有疑惑,浏览器是怎么解析我们的代码然后渲染的呢？弄明白浏览器的渲染原理,对于我们日常前端开发中的性能优化有重要意义。

所以今天我们来给大家详细说说浏览器是怎么渲染`DOM`的。

### 浏览器渲染大致流程

首先,浏览器会通过请求的 `URL` 进行域名解析，向服务器发起请求,接收资源（`HTML`、`CSS`、`JS`、`Images`)等等,那么之后浏览器又会进行以下解析:

1. 解析HTML文档,生成`DOM Tree`

2. `CSS` 样式文件加载后，开始解析和构建 `CSS Rule Tree`

3. `Javascript` 脚本文件加载后， 通过 `DOM API` 和` CSSOM API` 来操作改动 `DOM Tree` 和 `CSS Rule Tree`

而解析完以上步骤后, 浏览器会通过`DOM Tree` 和`CSS Rule Tree`来构建 `Render Tree`(**渲染树**)。

根据渲染树来布局，以计算每个节点的几何信息。

最后将各个节点绘制到页面上。

### 1. HTML解析

```html
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link href="style.css" rel="stylesheet">
    <title>Critical Path</title>
  </head>
  <body>
    <p>Hello <span>web performance</span> students!</p>
    <div><img src="awesome-photo.jpg"></div>
  </body>
</html>
```

那么解析的`DOM`树大概就是以下这样

![](https://image.xposean.top/20210421094331.png)

### 2.`CSS`解析

```CSS
body { font-size: 16px }
p { font-weight: bold }
span { color: red }
p span { display: none }
img { float: right }
```

![](https://image.xposean.top/20210421094405.png)

`CSS Rule Tree`会比照着`DOM`树来对应生成,在这里需要注意的就是`CSS`匹配DOM的规则。很多人都以为`CSS`匹配DOM树的速度会很快,其实不然。

> 样式系统从最右边的选择符开始向左侧移动来匹配一条规则。样式系统会一直向左匹配选择符直到规则匹配完毕或者由于出错停止匹配.

这里就衍生出一个问题,为什么解析`CSS`的时候选择**从右往左**呢？

**为了匹配效率。**

所有样式规则极有可能数量很大，而且绝大多数不会匹配到当前的 `DOM` 元素，所以有一个快速的方法来判断「这个 selector 不匹配当前元素」就是极其重要的。

如果正向解析，例如`「div div p em」`，我们首先就要检查当前元素到 `HTML`的整条路径，找到最上层的 div，再往下找，如果遇到不匹配就必须回到最上层那个 div，往下再去匹配选择器中的第一个 `div`，回溯若干次才能确定匹配与否，效率很低。

可以看以下的例子：

```html
<div>
   <div class="jartto">
      <p><span> 111 </span></p>
      <p><span> 222 </span></p>
      <p><span> 333 </span></p>
      <p><span class='yellow'> 444 </span></p>
   </div>
</div>
<div>
   <div class="jartto1">
      <p><span> 111 </span></p>
      <p><span> 222 </span></p>
      <p><span> 333 </span></p>
      <p><span class='red'> 555 </span></p>
   </div>
</div>
```

```css
div > div.jartto p span.yellow{
   color:yellow;
}
```

对于上述例子，如果按从左到右的方式进行查找：
1.先找到所有 `div` 节点；
2.在 div 节点内找到所有的子 `div` ,并且是 `class = “jartto”`
3.然后再依次匹配 `p span.yellow` 等情况；
4.遇到不匹配的情况，就必须回溯到一开始搜索的 `div` 或者 `p` 节点，然后去搜索下个节点，重复这样的过程。

试想一下，如果采用`从左至右`的方式读取 `CSS` 规则，那么大多数规则读到最后（最右）才会发现是不匹配的，这样会做费时耗能，最后有很多都是无用的；而如果采取`从右向左`的方式，那么只要发现最右边选择器不匹配，就可以直接舍弃了，避免了许多无效匹配。

所以浏览器 `CSS` 匹配核心算法的规则是以`从右向左`方式匹配节点的。这样做是为了减少无效匹配次数，从而匹配快、性能更优。

**`CSS`匹配HTML元素是一个相当复杂和有性能问题的事情。所以，你就会在N多地方看到很多人都告诉你，DOM树要小，`CSS`尽量用id和class，千万不要过渡层叠下去，……**



### 3. 合成布局树并渲染

经运行过`Javascript`脚本后解析出了最终的`DOM Tree` 和 `CSS Rule Tree`, 根据这两者,就能合成我们的**`Render  Tree`**,网罗网页上所有可见的 `DOM` 内容，以及每个节点的所有 `CSSOM` 样式信息。

为构建渲染树，浏览器大体上完成了下列工作：

1. 从` DOM` 树的根节点开始遍历每个可见节点。
   - 某些节点不可见（例如脚本标记、元标记等），因为它们不会体现在渲染输出中，所以会被忽略。
   - 某些节点通过` CSS` 隐藏，因此在渲染树中也会被忽略，例如，上例中的 span 节点---不会出现在渲染树中，---因为有一个显式规则在该节点上设置了“`display: none`”属性。
2. 对于每个可见节点，为其找到适配的 `CSSOM` 规则并应用它们。
3. 渲染可见节点，连同其内容和计算的样式。



---

## Virtual DOM

​	大部分前端开发者对`Virtual DOM`这个词都很熟悉了,简单来讲，`Virtual DOM`就是在数据和真实 `DOM` 之间建立了一层缓冲层。当数据变化触发渲染后，并不直接更新到`DOM`上，而是先生成 `Virtual DOM`，与上一次渲染得到的 `Virtual DOM` 进行比对，在渲染得到的 `Virtual DOM` 上发现变化，然后将变化的地方更新到真实 `DOM` 上。 



### 为什么说Virtual DOM快?

**1）DOM结构复杂,操作很慢 **

我们在控制台输入

```javascript
var div = document.createElement('div')
var str = '' 
for (var key in div) {
    str = str + key + "\n"
}
console.log(str)
```

可以很容易发现,我们的一个空div对象,他的属性就有几百个,所以说`DOM`的操作慢是可以理解的。不是浏览器不想好好实现DOM，而是`DOM`设计得太复杂。

**2）JS计算很快**

https://julialang.org/benchmarks/

Julia有一个Benchmark，[Julia Benchmarks](https://link.zhihu.com/?target=http%3A//julialang.org/benchmarks/)， 可以看到`Javascript`跟`C`语言很接近了，也就几倍的差距，跟Java基本也是一个量级。 这就说明，单纯的`Javascript`运行起来其实速度是很快的。 

而相对于`DOM`,我们原生的`JavaScript`对象处理起来则会更快更简单.

我们通过`JavaScript`,可以很容易的用`JavaScript`对象表示出来.

```javascript
var olE = {
  tagName: 'ul', // 标签名
  props: { // 属性用对象存储键值对
    id: 'ul-list',
    class: 'list'
  },
  children: [ // 子节点
    {tagName: 'li', props: {class: 'item'}, children: ["Item 1"]},
    {tagName: 'li', props: {class: 'item'}, children: ["Item 2"]},
    {tagName: 'li', props: {class: 'item'}, children: ["Item 3"]},
  ]
}
```

对应的HTML写法:

```html
<ul id='ol-list'>
  <li class='item'>Item 1</li>
  <li class='item'>Item 2</li>
  <li class='item'>Item 3</li>
</ul>
```

那么,既然我们可以用`javascript`来表示`DOM`，那么代表我们可以用`JavaScript`来构造我们的真实`DOM`树,当我们的`DOM`树需要更新了,那我们先渲染更改这个`JavaScript`构造的`Virtual DOM`树,再更新到真实DOM树上。



 所以`Virtual DOM`算法就是：

一开始先用 `JavaScript` 对象结构表示 DOM 树的结构；然后用这个树构建一个真正的 DOM 树，插到文

档当中。当状态变更时，重新构造一棵新的对象树。然后用新的树和旧的树进行比较两个树的差异。

然后把差异更新到旧的树上，最后再把整个变更写入真实 `DOM`。 





### 简单Virtual DOM 算法实现



**步骤一：用`JS`对象模拟`DOM`树,并构建**

用 `JavaScript` 来表示一个 `DOM` 节点是很简单的事情，你只需要记录它的节点类型、属性，还有子节点： 

```javascript
// 创建虚拟DOM函数
function Element (tagName, props, children) {
  this.tagName = tagName // 标签名
  this.props = props // 对应属性（如ID、Class）
  this.children = children // 子元素
}

module.exports = function (tagName, props, children) {
  return new Element(tagName, props, children)
}
```

实际应用如下:

```javascript
var el = require('./element')
// 普通ul和li对象就可以表示为这样
var ul = el('ul', {id: 'list'}, [
  el('li', {class: 'item'}, ['Item 1']),
  el('li', {class: 'item'}, ['Item 2']),
  el('li', {class: 'item'}, ['Item 3'])
])
```

现在`ul`只是一个 JavaScript 对象表示的 DOM 结构，页面上并没有这个结构。我们可以根据这个`ul`构建真正的`<ul>`元素： 

```javascript
// 构建真实DOM函数
Element.prototype.render = function () {
  var el = document.createElement(this.tagName) // 根据tagName构建
  var props = this.props

  for (var propName in props) { // 设置节点的DOM属性
    var propValue = props[propName]
    el.setAttribute(propName, propValue)
  }

  var children = this.children || []

  children.forEach(function (child) {
    var childEl = (child instanceof Element)
      ? child.render() // 如果子节点也是虚拟DOM，递归构建DOM节点
      : document.createTextNode(child) // 如果字符串，只构建文本节点
    el.appendChild(childEl)
  })

  return el
}
```



我们的`render`方法会根据`tagName`去构建一个真实的`DOM`节点,设置节点属性,再递归到子元素构建:

```javascript
var ulRoot = ul.render() // 将js构建的dom对象传给render构建
document.body.appendChild(ulRoot) // 真实的DOM对象塞入body
```

这样我们body中就有了ul和li的DOM元素了

```html
<body>
    <ul id='list'>
      <li class='item'>Item 1</li>
      <li class='item'>Item 2</li>
      <li class='item'>Item 3</li>
    </ul>
</body>
```



**步骤二：比较两棵虚拟DOM树的差异**

在这里我们假设对我们修改了某个状态或者某个数据,这就会产生新的虚拟DOM

```javascript
// 新DOM
var ol = el('ol', {id: 'ol-list'}, [
  el('li', {class: 'ol-item'}, ['Item 1']),
  el('li', {class: 'ol-item'}, ['Item 2']),
  el('li', {class: 'ol-item'}, ['Item 3']),
  el('li', {class: 'ol-item'}, ['Item 4'])
])

// 旧DOM
var ul = el('ul', {id: 'list'}, [
  el('li', {class: 'item'}, ['Item 1']),
  el('li', {class: 'item'}, ['Item 3']),
  el('li', {class: 'item'}, ['Item 2'])
])
```

那么我们会和先和,刚刚上一次生成的虚拟`DOM`树进行比对.

我们应该都很清楚,`Virtual DOM`算法的核心部分,就在比较差异这一部分,也就是所谓的 `diff`算法。

因为很少出现跨层级的移动。

`diff`算法一般来说,都是同一层级比对同一层级的

![](https://images2015.cnblogs.com/blog/328599/201704/328599-20170418103314493-66729150.png)

```javascript
var patch = {
    'REPLACE' : 0, // 替换
    'REORDER' : 1, // 新增、删除、移动
    'PROPS' : 2, // 属性更改
    'TEXT' : 3 // 文本内容更改
}
```

例如，上面的`div`和新的`div`有差异，当前的标记是0，那么：

```javascript
// 用数组存储新旧节点的不同
patches = [
    // 每个数组表示一个元素的差异
    [ 
        {difference}, 
    	{difference}
    ],
    [
        {difference}, 
    	{difference}
    ]  
] 
```

```javascript
patches[0] = [
  {
  	type: REPALCE,
  	node: newNode // el('section', props, children)
  },
  {
  	type: PROPS,
    props: {
        id: "container"
    }
  },   
  {
  	type: REORDER,
      moves: [
          {index: 2, item: item, type: 1}, // 保留的节点
          {index: 0, type: 0}, // 该节点被删除
          {index: 1, item: item, type: 1} // 保留的节点
      ]
  }
];
如果是文本节点内容更改，就记录下：
patches[2] = [{
  type: TEXT,
  content: "我是新修改的文本内容"
}]
```

```javascript
// 详细算法查看diff.js https://blog.xposean.top/file/virtualDom/diff.js
```

每种差异都会有不同的对比方式,通过比对后会将差异记录下来,应用到真实DOM上,并把最近最新的虚拟DOM树保存下来,以便下次比对使用。



**步骤三：把差异应用到真正的DOM树上**

通过比对后,我们已经知道了,差异的节点是哪些,我们可以方便对真实DOM做最小化的修改。 

```javascript
// 详情看patch.js https://blog.xposean.top/file/virtualDom/patch.js
```





### 发现问题

到这里我们发现一个问题,不是说 `Virtual DOM`更快吗? 可是最终你还是要进行DOM操作呀?那意义何在？还不如一开始我们就直接进行DOM操作来的方便。

所以到这里我们要对`Virtual DOM` 有一个正确的认识

[网上都说操作真实 DOM 慢，但测试结果却比 React 更快，为什么？](https://www.zhihu.com/question/31809713/answer/53544875)

[http://chrisharrington.github.io/demos/performance/](http://chrisharrington.github.io/demos/performance/)



`Virtual DOM`的优点:

1. 最优更改, 保证性能下限

   `Virtual DOM`的算法能够向你保证的就是,每一次的`DOM`操作我都能达到算法上的理论最优,而如果是你自己去操作`DOM`,这并不能保证。

2. 开发模式的更改

   **为了让开发者把精力集中在操作数据，而非接管 DOM 操作**。`Virtual DOM`能让我们在实际开发过程中,不需要去理会复杂的DOM结构,而只需理会绑定DOM结构的状态和数据即可,这从开发上来说 就是一个很大的优势。

3. 跨平台

   因为 `Virtual DOM` 本质上是`JS`的对象, 就可以比较方便的实现跨平台操作, 例如`SSR`、`uniapp`等

   