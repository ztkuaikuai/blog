---
name: commit
description: 创建符合约定式提交规范的 commit，提交后询问用户是否推送到远程仓库。
---

按照约定式提交规范（Conventional Commits v1.0.0）创建 commit，并在提交后询问用户是否推送到远程。

## 执行流程

### 1. 确认暂存状态

先运行 `git status` 和 `git diff --stat` 查看当前工作区状态。如果有未暂存的修改，询问用户要提交哪些文件。

### 2. 暂存变更

根据用户指示运行 `git add <files>`。如果用户没有具体指定，列出有变更的文件并询问。

### 3. 生成 commit message

根据暂存区的 diff 内容，生成符合约定式提交规范的 commit message：

- 分析 diff 变更内容，判断变更类型
- 如果 diff 涉及多个不相关的变更，建议拆分提交
- 确认后执行 `git commit -m "<message>"`

### 4. 提交后询问推送

提交成功后，使用 `AskUserQuestion` 工具询问用户是否推送到远程：

- **问题**：是否将提交推送到远程仓库？
- **选项 1（推荐）**：推送（`git push`）
- **选项 2**：不推送，保留在本地

如果用户选择推送，执行 `git push` 并报告结果。
