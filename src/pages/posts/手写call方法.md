---
layout: ../../layouts/post.astro
title: "手写一个call方法"
pubDate: 2024-08-03
description: "手写一个call方法"
author: "筷筷"
excerpt: 本文详细介绍了如何手动实现JavaScript中的call方法。call方法允许我们调用一个函数，并将this关键字的值设置为提供的值。文章通过文章开头的步骤展示了手写call方法的过程。文章还提到了使用Object.defineProperty来设置属性不可枚举，以避免在this枚举时出现意外属性。通过这些步骤，我们能够实现一个自定义的myCall方法，它能够正确地将函数调用的上下文设置为指定的对象，并执行函数。
image:
  src:
  alt: 
tags: ["JS", "InterView"]
---

>手写call方法大致有以下几个步骤：
>
>1. **参数归一化**：首先处理 call 方法的上下文参数 ctx。
>2. **收集参数**：使用剩余参数语法（...args）来收集传递给 call 方法的所有参数，这些参数将被用于后续的函数调用。
>3. **确定调用函数**。
>4. **绑定 this 并调用函数**：将函数的 this 绑定到 ctx 上。
>5. **使用唯一的属性名**
>6. **执行函数并返回函数执行结果**

## 1 参数归一化

为了手写call方法，我们需要先看下call方法是怎么实现的，先写一个示例：

```js
Function.prototype.myCall = function(ctx) {
}

function test(a, b) {
	console.log('arg', a, b);
	console.log('this', this);
}

test.call(666, 1, 2); // this Object(666)
test.call(true, 1, 2); // this Object(true)
test.call(null, 1, 2); // this window
test.call(undefined, 1, 2); // this window
test.call({a: 1}, 1, 2); // this {a: 1}
```

![call控制台打印1](https://mp-32a9c741-ee12-48ed-86c1-aaeb62c1a109.cdn.bspapp.com/cloudstorage/blog/call1.png)

从打印可以看出this参数是<mark style="background: #FFF3A3A6;">由Object()方法包装</mark>过后的值，如果为null或者undefined，那么this为globalThis。

那么，在我们的myCall函数上，可以<mark style="background: #FFF3A3A6;">使用参数归一化的策略</mark>来处理传过来的context。

```js {2}
Function.prototype.myCall = function(ctx) {
	ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
}
```

## 2 收集参数

处理完ctx之后，我们还需要处理传过来的参数，由于参数不固定，所以我们使用剩余参数语法收集参数。它用于表示函数的参数数量不确定，可以将多个参数收集到一个数组中。

```js {1}
Function.prototype.myCall = function(ctx, ...args) {
	ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
}
```

现在我们处理好了ctx和参数，接下来我们还需要解决以下问题去实现myCall函数：
1. 找到是哪个函数调用了myCall
2. 怎么将函数的this指向ctx

## 3 找到是哪个函数调用了myCall

<mark style="background: #FFF3A3A6;">在myCall中的this</mark>就是调用myCall的函数。

```js {3}
Function.prototype.myCall = function(ctx, ...args) {
	ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
	const fn = this
}
```

## 4 绑定 this 并调用函数

我们<mark style="background: #FFF3A3A6;">直接用ctx来调用fn</mark>，来达成将fn的this指向ctx的目的。

```js {4-6}
Function.prototype.myCall = function(ctx, ...args) {
	ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
	const fn = this
	ctx.fn = fn
	const res = ctx.fn(...args)
	return res
}

function test(a, b) {
	console.log('arg', a, b);  // arg 1 2
	console.log('this', this);  // this window
	return a + b;
}

const obj = {
	a: 1,
	fn() {
		console.log('obj function')
	}
}

const res = test.myCall(obj, 1, 2);
console.log('res', res);  // 3
console.log('obj', obj)
```

看起来这样做就完事了，但是如果obj上有 fn 属性的话，myCall 方法会覆盖该属性的值，从而导致原有的 fn 属性值丢失。

![call控制台打印2](https://mp-32a9c741-ee12-48ed-86c1-aaeb62c1a109.cdn.bspapp.com/cloudstorage/blog/call2.png)

## 5 使用唯一的属性名

<mark style="background: #FFF3A3A6;">为了避免这种情况，可以使用一个唯一的符号（Symbol）来作为属性名</mark>。

```js {4-7}
Function.prototype.myCall = function(ctx, ...args) {
	ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
	const fn = this
	const uniqueFn = Symbol('fn') // 使用 Symbol 创建一个唯一的属性名
	ctx[uniqueFn] = fn
	const res = ctx[uniqueFn](...args)
	delete ctx[uniqueFn] // 调用后删除该属性
	return res
}

function test(a, b) {
	console.log('arg', a, b);  // arg 1 2
	console.log('this', this);  // this window
	return a + b;
}

const obj = {
	a: 1,
	fn() {
		console.log('obj function')
	}
}

const res = test.myCall(obj, 1, 2);
console.log('res', res);  // 3
console.log('obj', obj)
```

这样我们传入的ctx（即obj）就不会被修改了。我们手写的call方法就写好了。

![call控制台打印3](https://mp-32a9c741-ee12-48ed-86c1-aaeb62c1a109.cdn.bspapp.com/cloudstorage/blog/call3.png)

## 番外

在控制台的打印中，我们可以看到 this 打印出来的值含有`Symbol(fn)`，这是因为在调用 test 函数时，test 的 this 指向 obj ，obj 中的`Symbol(fn)`属性还未被删去。

如果在 test 函数中使用了 this 用于枚举，那么`Symbol(fn)`也会被枚举，<mark style="background: #FFF3A3A6;">由于这是意料之外属性，它不应该被枚举</mark>。那么我们可以使用[[属性描述符]]中的`Object.defineProperty`方法来设置该属性不可枚举。

 >**`Object.defineProperty()`** 静态方法会直接在一个对象上定义一个新属性，或修改其现有属性，并返回此对象。
 
```js {6-12}
 Function.prototype.myCall = function(ctx, ...args) {
	ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
	const fn = this
	const uniqueFn = Symbol('fn') // 使用 Symbol 创建一个唯一的属性名
	
	// 给ctx设置uniqueFn属性
	Object.defineProperty(ctx, uniqueFn, {
		value: fn, // 属性值为fn
		enumerable: false, // 不可枚举
		configurable: true, // 可以配置
		writable: false // 不可修改
	})

	const res = ctx[uniqueFn](...args)
	delete ctx[uniqueFn] // 调用后删除该属性
	return res
}
```
 
 