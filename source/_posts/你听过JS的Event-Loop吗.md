---

title: 你听过JS的Event Loop吗
date: 2021-04-01 16:38:21
tags: JavaScript
---

## 前言

不得不说, `Event Loop`在面试中的频率真的很高, 之前总觉得自己了解得差不多，可是当第一次被问到的时候，却不知道该从哪里开始说起，涉及到的知识点很多。于是花时间梳理了一下,并不仅仅是因为面试遇到了，而是理解JavaScript事件循环机制也能让我们平常遇到的疑惑也得到解答。

大家都知道`JavaScript`是单线程语言, 可是你知道为什么它是单线程吗？

答案就是, **为了保证用户界面的强一致性**,`Javascript`可以直接与界面交互。假想一下，如果`Javascript`采用多线程策略，各个线程都能操作`DOM`，那最终的界面呈现到底以谁为准呢？这显然是存在矛盾的。因此，`Javascript`选择使用单线程模型。

确定`JavaScript`是单线程语言后, 我们就势必会遇到一个问题, 当遇到多任务需要处理时, `JavaScript`怎么处理呢？如果不处理这种情况, 那么当某个任务很耗时，就会导致后面的一系列的任务堵塞, 不执行了, 直接导致页面不响应, 进入"假死"状态了, 这显示是不符合实际情况的, 于是乎, 就诞生了我们今天所讲的`Event Loop`机制了。

## 核心内容

用一段代码举例一下

```javascript
console.log('start');
setTimeout(() => {
    console.log('children2');
    Promise.resolve().then(() => {
        console.log('children3');
    })
}, 0);

new Promise(function(resolve, reject) {
    console.log('children4');
    setTimeout(function() {
        console.log('children5');
    }, 0)
    resolve('children6')
}).then((res) => {
    console.log('children7');
    setTimeout(() => {
        console.log(res);
    }, 0)
})
```

代码的执行结果如下：

```javascript
start
children4
children7
children2
children3
children5
children6
```

如果你对`Event Loop`的机制暂不熟悉, 那么对以上代码的执行结果就会十分迷惑不解, 而这也是面试题常常出现的`Event Loop`考题，所以我们有必要深究其执行顺序的规则和原理。

本质上来说，`Javascrip`t的任务在执行阶段都是按顺序执行，但是`JS`引擎在解析`Javascript`代码时，会把代码分为**同步任务**和**异步任务**。同步任务直接进入**执行栈**执行；异步任务进入**任务队列**，并且在接下来的**Event Loop**中被处理。

异步任务又分为**`Macrotask`**和**`Microtask`**，即宏任务与微任务, 他们各自有单独的数据结构和内存来维护。

### 宏任务与微任务

> **常见的宏任务：**

- `setTimeout`
- `setInterval`
- `I/O`(文件、网络)相关`API`
- `DOM`事件监听(浏览器环境)
- `setImmediate`(Node环境)

> **常见的微任务：**

- `MutationObserver`(浏览器环境, [描述](https://blog.fundebug.com/2019/01/10/understand-mutationobserver/))
- `Promise.prototype.then`, `Promise.prototype.catch`, `Promise.prototype.finally`
- `process.nextTick`(Node环境)
- `queueMicrotask`



### `Event Loop` 流程

![img](https://image.xposean.top/20210406094745.png)



具体流程描述如下:

**当某个宏任务执行完后,会查看是否有微任务队列任务。如果有，先依次执行微任务队列完中的所有任务，如果没有，会读取宏任务队列中排在最前的任务，执行宏任务的过程中，遇到微任务，依次加入微任务队列。执行栈空后，再次读取微任务队列里的任务，依次类推。**



咱们也可以通过一个动图来熟悉一下

![img](https://image.xposean.top/20210406095021.gif)

1. 全局代码压入执行栈执行，输出 `start`
2.  `setTimeout`压入 `macrotask`队列，`promise.then` 回调放入 `microtask`队列，最后执行 `console.log('end')`，输出 `end`
3. 调用栈中的代码执行完成（全局代码属于宏任务），接下来开始执行微任务队列中的代码，执行`promise`回调，输出 `promise1`, `promise`回调函数默认返回 `undefined`, `promise`状态变成 `fulfilled` ，触发接下来的` then`回调，继续压入 `microtask`队列，此时产生了新的微任务，会接着把当前的微任务队列执行完，此时执行第二个 `promise.then`回调，输出 `promise2`
4. 此时，`microtask` 队列 已清空，接下来会会执行 UI 渲染工作（如果有的话），然后开始下一轮`event loop`, 执行 `setTimeout`的回调，输出 `setTimeout`

---

## 经典面试题

如果你已经熟悉`Event Loop`的机制, 可以尝试不看答案做题，看看自己是否掌握了.

### 例题一

```javascript
// 以下的代码输出顺序是什么？
async function async1() {
    console.log('async1 start');
    await async2();
    console.log('async1 end');
}
async function async2() {
    console.log('async2');
}
console.log('script start');
setTimeout(function() {
    console.log('setTimeout');
}, 0)
async1();
new Promise(function(resolve) {
    console.log('promise1');
    resolve();
}).then(function() {
    console.log('promise2');
});
console.log('script end');
```

先执行宏任务（当前代码块也算是宏任务），然后执行当前宏任务产生的微任务，然后接着执行宏任务

1. 从上往下执行代码，先执行同步代码，输出 `script start`
2. 遇到`setTimeout`，现把` setTimeout` 的代码放到宏任务队列中
3. 执行 `async1()`，输出 `async1 start`, 然后执行 `async2()`, 输出 `async2`，把 `async2()` 后面的代码 `console.log('async1 end')`放到微任务队列中
4. 接着往下执行，输出 `promise1`，把 `.then()` 放到微任务队列中；注意`Promise` 本身是同步的立即执行函数，`.then`是异步执行函数
5. 接着往下执行， 输出 `script end`。同步代码（同时也是宏任务）执行完成，接下来开始执行刚才放到微任务中的代码
6. 依次执行微任务中的代码，依次输出 `async1 end`、 `promise2`, 微任务中的代码执行完成后，开始执行宏任务中的代码，输出 `setTimeout`

最后的执行结果如下

- `script start`
- `async1 start`
- `async2`
- `promise1`
- `script end`
- `async1 end`
- `promise2`
- `setTimeout`



### 例题二

```javascript
// 以下的代码输出顺序是什么？
console.log('start');
setTimeout(() => {
    console.log('children2');
    Promise.resolve().then(() => {
        console.log('children3');
    })
}, 0);

new Promise(function(resolve, reject) {
    console.log('children4');
    setTimeout(function() {
        console.log('children5');
        resolve('children6')
    }, 0)
}).then((res) => {
    console.log('children7');
    setTimeout(() => {
        console.log(res);
    }, 0)
})
```

这道题跟上面题目不同之处在于，执行代码会产生很多个宏任务，每个宏任务中又会产生微任务

1. 从上往下执行代码，先执行同步代码，输出 `start`
2. 遇到`setTimeout`，先把 `setTimeout` 的代码放到宏任务队列①中
3. 接着往下执行，输出 `children4`, 遇到`setTimeout`，先把 `setTimeout` 的代码放到宏任务队列②中，此时`.then`并不会被放到微任务队列中，因为 resolve是放到 `setTimeout`中执行的
4. 代码执行完成之后，会查找微任务队列中的事件，发现并没有，于是开始执行宏任务①，即第一个` setTimeout`， 输出 `children2`，此时，会把 `Promise.resolve().then`放到微任务队列中。
5. 宏任务①中的代码执行完成后，会查找微任务队列，于是输出 `children3`；然后开始执行宏任务②，即第二个 `setTimeout`，输出 `children5`，此时将.then放到微任务队列中。
6. 宏任务②中的代码执行完成后，会查找微任务队列，于是输出 `children7`，遇到` setTimeout`，放到宏任务队列中。此时微任务执行完成，开始执行宏任务，输出 `children6`;

最后的执行结果如下

- start
- `children4`
- `children2`
- `children3`
- `children5`
- `children7`
- `children6`



### 例题三

```javascript
// 以下的代码输出顺序是什么？
const p = function() {
    return new Promise((resolve, reject) => {
        const p1 = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(1)
            }, 0)
            resolve(2)
        })
        p1.then((res) => {
            console.log(res);
        })
        console.log(3);
        resolve(4);
    })
}


p().then((res) => {
    console.log(res);
})
console.log('end');
```

1. 执行代码，`Promise`本身是同步的立即执行函数，.then是异步执行函数。遇到`setTimeout`，先把其放入宏任务队列中，遇到`p1.then`会先放到微任务队列中，接着往下执行，输出 `3`
2. 遇到 `p().then` 会先放到微任务队列中，接着往下执行，输出 `end`
3. 同步代码块执行完成后，开始执行微任务队列中的任务，首先执行 `p1.then`，输出 `2`, 接着执行`p().then`, 输出 `4`
4. 微任务执行完成后，开始执行宏任务，`setTimeout`, `resolve(1)`，但是此时 `p1.then`已经执行完成，此时 `1`不会输出。

最后的执行结果如下

- 3
- end
- 2
- 4

你可以将上述代码中的 `resolve(2)`注释掉, 此时 1才会输出

```javascript
const p = function() {
    return new Promise((resolve, reject) => {
        const p1 = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(1)
            }, 0)
        })
        p1.then((res) => {
            console.log(res);
        })
        console.log(3);
        resolve(4);
    })
}


p().then((res) => {
    console.log(res);
})
console.log('end');
```

注释后, 输出结果就会变成`3 end 4 1`.



## 面试回答

如果是在面试中被问到`Event Loop`机制, 我也总结了一下回答的内容, 你可以参考着回答。

> 因为JS是单线程的, 所以JS在执行阶段都是按顺序执行, 但是JS引擎在解析Javascript代码时，会把代码分为**同步任务**和**异步任务**。同步任务直接进入**执行栈**执行,异步任务会进入任务队列，并且在接下来的**Event Loop**中被处理。

> 异步任务又分为**Macrotask**和**Microtask**，即宏任务与微任务, 他们各自有单独的队列来维护，

> 常见的的宏任务有: **I/O代码相关API、DOM事件监听、定时器**

> 常见的微任务: **`MutationObserver`**、**`new Promise.then()/catch()/finally()`**

> 具体的**Event Loop**是这样的, 在查看宏任务队列是否有任务, 有的话, 执行第一个宏任务, 执行完成之后查看微任务队列, 如果发现有微任务, 依次执行完微任务队列里的所有任务, 执行完后再判断是否需要浏览器渲染, 再重复整个过程,。

看到结尾，相信大家也累了，感谢各位读者的阅读！希望本文对宏任务和微任务的解读能给各位读者带来一点启发。

### 参考文献

*>* [JavaScript中的Event Loop（事件循环）机制](*https://segmentfault.com/a/1190000022805523*)

*>* [Event Loop Processing Model](https://html.spec.whatwg.org/#event-loop-processing-model)