---
title: JavaScript的高级运用之节流与防抖
date: 2018-05-17 09:33:34
tags: JavaScript
---



## 概念与目的
首先还是得先来讲讲概念,**节流**和**防抖**的目的都十分的简单,就是为了性能优化而出现的,目的是为了解决一些短时间内连续执行导致性能不佳或者内存消耗巨大的情况。
这类事件有:`scroll` `keyup` `mousemove` `resize`事件等，短时间内会不断的触发，在性能上消耗是非常大的，尤其是一些改变DOM结构的操作；
例如我们的`scroll`事件,当使用触控板，滚动滚轮，或者拖拽滚动条的时候，一秒就可以触发 30 次事件。经测试，在移动设备上轻轻滚动一下，一秒可以触发 100 次之多。这么高的执行频率是我们无法忍受的。
所以,在这些高频率触发的事件中,`节流`[throttle]与`防抖`[debounce]十分有必要了,它们非常相似，都是让上述这类事件在规定的事件从不断的去触发更改成为规定的时间内触发多少次；



## 节流[throttle]

我们的所谓节流,就是需要事件按照我们规定的时间间隔内执行,换成函数来说，使用setTimeout方法，给定两个时间，后面的时间减去前面的时间，得到时间间隔,这个时间到达我们给定的时间就去触发一次这个事件.

来看看我们的代码,以`scroll`:

	/** 先给定DOM结构;**/
	<div class="scroll-box">
	    <div class="scroll-item"></div>
	</div>


	/**主要看js,为了简单我用JQ去写了**/
	<script>
	    $(function(){
	        var scrollBox = $('.scroll-box');
	        //调用throttle函数，传入相应的方法和规定的时间;
	        var thro = throttle(throFun,300);
	        //触发事件;
	        scrollBox.on('scroll' , function(){
	            //调用执行函数;
	            thro();
	        })
	
	        // 节流函数;    
	        function throttle(method,time){
	            var timer = null;
	            var startTime = new Date();
	            return function(){
	                var context = this;
	                var endTime = new Date();
	                var resTime = endTime - startTime;
	                //判断大于等于我们给的时间采取执行函数;
	                if(resTime >= time){
	                    method.call(context);//success
	                    //执行完函数之后重置初始时间，等于最后一次触发的时间
	                    startTime = endTime;
	                }
	            }
	        }
			//执行函数
	        function throFun(){
	            console.log('success');
	        }
	    })
	</script>

通过函数,我们其实也清晰的明白了,节流的原理,首先给给定一个间隔时间值,然后我们的节流函数就会通过比对上一次的时间和当前时间,超过或者等于这个时间才触发,反之,则不执行.
以上的代码就能实现,300ms内触发一次。



## 防抖[debounce]

代码之前，我们先清楚一下防抖的概念，不知道大家有没有做过电脑端两边悬浮广告窗口的这么一个东西，当我们拖动滚动条的时候，两边的广告窗口会因为滚动条的拖动，而不断的尝试着去居于中间，然后你就会看到这两个窗口，不停的抖啊抖；
一般这种就叫抖动了，我们要做的就是防止这种抖动，称为防抖[debounce]；
比如开发技巧中的坐公交，就是一定时间内，如果有人陆续刷卡上车，司机就不会开车。只有别人没刷卡了，司机才开车。
那这里防抖思想就是当我们拖动完成之后，两边的窗口位置再重新去计算，这样，就会显得很平滑，看着很舒服了，最主要的操作DOM结构的次数就大大减少了；
优化了页面性能，降低了内存消耗，不然你像IE这种比较老点版本的浏览器，说不定就直接给你蹦了
用书面一点的说法就是，在某个事件没有结束之前，函数不会执行，当结束之后，我们给定延时时间，然他在给定的延时时间之后再去执行这个函数，这就是防抖函数；
来看代码：

	/** 先给定DOM结构;**/
	<div class="scroll-box">
	    <div class="scroll-item"></div>
	</div>


	/**主要看js,为了简单我用JQ去写了**/
	<script>
	    $(function(){
	        var scrollBox = $('.scroll-box');
	        //调用throttle函数，传入相应的方法和规定的时间;
	        var debo = debounce(debounceFun,300);
	        //触发事件;
	        scrollBox.on('scroll' , function(){
	            //调用执行函数;
	            debo();
	        })
	
	        // 防抖函数;    
	        function debounce(method,time){
			    var timer = null ;
			    return function(){
			        var context = this;
			        //在函数执行的时候先清除timer定时器;
			        clearTimeout(timer);
			        timer = setTimeout(function(){
			            method.call(context);  //success
			        },time);
			    }
			}
	        function debounceFun(){
	            console.log('success');
	        }
	    })
	</script>

思路就是在函数执行之前，我们先清除定时器，如果函数一直执行，就会不断的去清除定时器中的方法，直到我们操作结束之后，函数才会执行；

其实书写的方式有很多，主要还是思路的问题，大家写的多了，自然就知道了；