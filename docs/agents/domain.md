# 领域文档

工程技能在探索代码库时应如何消费本仓库的领域文档。

## 探索前必读

- **`CONTEXT.md`**（仓库根目录），或
- **`CONTEXT-MAP.md`**（仓库根目录，如果存在）— 它指向每个上下文对应的 `CONTEXT.md`。阅读与当前主题相关的每一份。
- **`docs/adr/`** — 阅读与你即将工作的领域相关的 ADR。在多上下文仓库中，还需检查 `src/<context>/docs/adr/` 中的上下文级决策。

如果以上任何文件不存在，**静默继续**。不要标记其缺失，也不要主动建议创建。`/domain-modeling` 技能（通过 `/grill-with-docs` 和 `/improve-codebase-architecture` 调用）会在术语或决策确实确定时按需创建它们。

## 文件结构

单上下文仓库（大多数仓库）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（根目录存在 `CONTEXT-MAP.md` 时）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 上下文级决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用术语表词汇

当你的输出中涉及领域概念时（在 Issue 标题、重构提案、假设、测试名称中），请使用 `CONTEXT.md` 中定义的术语。不要滑向术语表明确避免的同义词。

如果你需要的概念尚未出现在术语表中，这是一个信号 — 要么你在创造项目不使用的语言（重新考虑），要么确实存在缺口（记录下来供 `/domain-modeling` 处理）。

## 标记 ADR 冲突

如果你的输出与现有 ADR 矛盾，请明确提出来而非静默覆盖：

> _与 ADR-0007（事件溯源订单）矛盾 — 但值得重新讨论，因为……_
