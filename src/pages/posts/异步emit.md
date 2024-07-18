---
layout: ../../layouts/post.astro
title: "异步emit"
pubDate: 2024-01-18
description: "异步emit代码片段"
author: "筷筷"
excerpt: 在编程中，特别是在涉及事件驱动或响应式编程的框架中，异步emit（即异步发送事件）是一种常见的模式。通过异步emit，事件的发送者和接收者之间不需要直接依赖。这有助于降低系统的耦合度，使得各个组件更容易维护和扩展。
image:
  src: 
  alt: 
tags: ["Vue", "JS", "代码片段"]
---

**如何在Vue中await emit**？即在子组件中emit触发父组件的事件后，需要等待在父组件触发的异步事件完成后，再执行某些逻辑。

使用异步函数封装emit，return或者await一个promise，把resolve传送到父组件中，就可以由父组件决定什么时候状态改变，并且还可以传递相应的值。通过异步emit，事件的发送者和接收者之间不需要直接依赖。这有助于降低系统的耦合度，使得各个组件更容易维护和扩展。

下方的代码片段是一个简单的例子，在子组件中删除账单后需要更新父组件中的账单列表，更新后子组件还需要再执行某些逻辑，于是需要使用异步emit达成这个效果。

> 注：代码片段追求简单、一看就懂。未考虑更新账单失败的逻辑。

```js
// 子组件触发emit
const deleteBill = async () => {
    // …………
    
    // 删除成功，准备更新账单列表
    await asyncEmit()
    
    // 在触发事件后，再执行某些逻辑
}

// 封装异步emit函数
const asyncEmit = () => {
    return new Promise((resolve) => {
        emit('updeteBillList', resolve)
    })
}

// 父组件接收子组件传过来的参数
const updateBillList = async (resolve) => {
    // …………
    await getBillList()
    
    // 更新账单列表完成，将promise状态改变
    resolve('ok')
}
```
