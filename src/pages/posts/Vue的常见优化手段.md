---
layout: ../../layouts/post.astro
title: "Vue 常见优化手段"
pubDate: 2024-07-07
description: "Vue 常见优化手段"
author: "筷筷"
excerpt: 探索Vue框架中提升应用性能的多种策略。
image:
  src: 
  alt: 
tags: ["Vue", "优化"]
---

> 性能优化应该在遇到性能问题时针对性的优化，切忌提早优化。

# 使用Key

对于通过v-for生成的列表，应给每个列表一个稳定且唯一的key值，有利于在列表变动时，尽量少的删除、新增、改动元素。

# 使用计算属性

如果模板中某个属性会使用多次，并且该属性通过计算得到，可以使用计算属性缓存它们

# 使用v-show代替v-if

对于<mark style="background: #FFF3A3A6;">频繁切换显示状态</mark>的元素，使用v-show可以保证虚拟dom的稳定，避免频繁的新增和删除元素，特别是对于那些内部包含大量dom元素的节点。

# 使用冻结的对象

 使用Object.freeze()冻结对象，冻结的对象不会被Vue响应化。

# 使用函数式组件

> 函数式组件是一种定义自身没有任何状态的组件的方式。它们很像纯函数：接收 props，返回 vnodes。函数式组件在渲染过程中不会创建组件实例 (也就是说，没有 this)，也不会触发常规的组件生命周期钩子。

函数式组件只是函数，不会为其创建VueComponent实例，所以渲染开销也低很多。

# 非实时绑定的表单项

当使用`v-model`绑定一个表单项时，当用户改变表单项的状态时，也会随之改变数据，从而导致Vue发生重渲染（rerender），这会带来性能开销。

你可以使用`lazy`修饰符或不使用`v-model`来减少性能开销，但是这也会导致在某一个时间段内数据和表单项的值不一致。

# 保持对象引用稳定

在大部分情况下，vue触发`rerender`的时机是其依赖的数据发生变化，若数据没有变化，就算给数据重新赋值，vue也不会做任何处理。

在给数据重新赋值后，调用setter，首先会判断新值和旧值有没有改变，下方是vue2判断是否改变的代码：

```js
// 判断x, y 是否改变
function hasChanged(x, y) {
	// 两个特殊值
	// NaN === NaN false
	// +0 === -0 true
	if (x === y) {
		// 判断 +0 和 -0
		return x === 0 && 1 / x !== 1 / y
	} else {
		// 判断 NaN
		return x === x || y === y
	}
}
```

这也说明了引用类型数据的地址改变了，那么该数据会全部重新渲染。

因此，只要能保证组件的依赖数据不发生变化，组件就不会重新渲染。对于基本数据类型，保持其值不变即可。<mark style="background: #FFF3A3A6;">对于引用类型，保持其引用不变即可</mark>。

从另一场景来说，一般会将对象数组遍历，将对象传入子组件中渲染。<mark style="background: #FFF3A3A6;">你可以保持该对象数组的引用稳定，来避免对子组件的重渲染</mark>。

📌提问：我在使用对象数组遍历时使用了key，那么之后再更新对象数组时修改引用会导致所有依赖该数据的子组件重新渲染吗？

⭕回答：会的。因为对Vue来说该对象数组整体改变，所有依赖该对象数组的组件都会重新渲染。

# 使用延迟加载（defer）

JS传输完成后，浏览器开始执行JS构造页面。但可能一开始要渲染的组件太多，不仅JS执行时间很长，并且浏览器要渲染的元素过多，导致页面白屏。

一个可行的办法是**延迟装载组件**，让组件按照指定的先后顺序依次一个一个渲染出来。

> 延迟装载是一个思路，本质上是利用`requestAnimationFrame`事件分批渲染内容