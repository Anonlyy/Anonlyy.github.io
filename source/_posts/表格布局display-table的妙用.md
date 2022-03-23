---
title: '表格布局display:table的妙用'
date: 2017-11-12 19:29:49
tags: CSS
categories: CSS
---


今天给大家讲一下,CSS2提供的一个布局,`display:table;`,虽然在CSS3提供了两个全新的布局,Flex和Grid布局,但却存在这样或那样的兼容性问题,其次我们有时候因为table的语义化和SEO问题,不想使用`table`标签,却需要实现`table`标签的表格布局,就能用到`CSS2`提供的这个属性.


接下来看看关于table的display可选值：


- `table`：指定对象作为块元素级的表格，相当于html标签`<table>`
- `inline-table`：指定对象作为内联元素级的表格，相当于html标签`<table>`
- `table-caption`：指定对象作为表格标题，相当于html标签`<caption>`
- `table-cell`：指定对象作为表格单元格，相当于html标签`<td>`
- `table-row`：指定对象作为表格行，相当于html标签`<tr>`
- `table-row-group`：指定对象作为表格行组，相当于html标签`<tbody>`
- `table-column`：指定对象作为表格列，相当于html标签`<col>`
- `table-column-group`：指定对象作为表格列组显示，相当于html标签`<colgroup>`
- `table-header-group`：指定对象作为表格标题组，相当于html标签`<thead>`
- `table-footer-group`：指定对象作为表格脚注组，相当于html标签`<tfoot>`

还有一些协助属性：
- `border-collpase`：用来决定表格的边框是分开的还是合并的。在分隔模式下，相邻的单元格都拥有独立的边框。在合并模式下，相邻单元格共享边框。
- `border-spacing`： 规定相邻单元格边框之间的距离（只适用于 边框分离模式 ）。相当于 HTML 中的 `cellspacing` 属性，但是第二个可选的值可以用来设置不同于水平间距的垂直间距。
- `table-layout`：定义了用于布局表格单元格，行和列的算法。(auto：表格及单元格的宽度取决于其包含的内容。fixed：表格和列的宽度通过表格的宽度来设置，某一列的宽度仅由该列首行的单元格决定。)
- `vertical-align`：用来指定行内元素（inline）或表格单元格（table-cell）元素的垂直对齐方式。

## 使用`display:table`的好处
除了在兼容性更好和语义化程度更强之外,表格布局也继承了`table`标签的布局优势;

### 更简单的栅格布局

```html
<style>
  .box{
    border:1px solid #dedede;
    display:table;
    height: 300px;
    width: 100%;
  }  
  .box .item{
    border-right:1px solid #ccc;
    display:table-cell;
  }
</style>
<body>
  <div class="box">
    <div class="item">AA</div>
    <div class="item">BB</div>
    <div class="item">CC</div>
  </div>
</body>
```

![](https://i.imgur.com/Wwt9pcI.png)
很轻松的就能够实现,一行多列的布局,而且自动根据`.item`元素个数计算`.item`的宽度,
比原来通过浮动并设置百分比方便多了.