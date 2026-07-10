# Issue tracker: GitHub

本仓库的 Issue 和 PRD 以 GitHub Issues 形式管理。所有操作使用 `gh` CLI。

## 约定

- **创建 Issue**：`gh issue create --title "..." --body "..."`。多行正文使用 heredoc。
- **读取 Issue**：`gh issue view <number> --comments`，通过 `jq` 过滤评论并获取标签。
- **列出 Issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，配合适当的 `--label` 和 `--state` 过滤器。
- **评论 Issue**：`gh issue comment <number> --body "..."`
- **添加/移除标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭**：`gh issue close <number> --comment "..."`

仓库信息从 `git remote -v` 推断 — `gh` 在 clone 的仓库内运行时自动处理。

## PR 作为分类界面

**PR 作为需求入口：否。**（如果本仓库将外部 PR 视为功能需求，则设为 `是`；`/triage` 会读取此标志。）

设为 `是` 时，PR 将经历与 Issue 相同的标签和状态流程，使用对应的 `gh pr` 命令：

- **读取 PR**：`gh pr view <number> --comments`，查看 diff 使用 `gh pr diff <number>`。
- **列出待分类的外部 PR**：`gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`，仅保留 `authorAssociation` 为 `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR` 或 `NONE` 的 PR（排除 `OWNER`/`MEMBER`/`COLLABORATOR`）。
- **评论/标签/关闭**：`gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub 中 Issue 和 PR 共享同一编号空间，单独的 `#42` 可能是两者之一 — 先用 `gh pr view 42` 解析，失败则回退到 `gh issue view 42`。

## 当技能说"发布到 Issue Tracker"

创建 GitHub Issue。

## 当技能说"获取相关工单"

运行 `gh issue view <number> --comments`。

## Wayfinding 操作

供 `/wayfinder` 使用。**地图**是一个单独的 Issue，**子 Issue** 作为工单。

- **地图**：一个标记为 `wayfinder:map` 的 Issue，包含笔记/已做决策/待探索区域。`gh issue create --label wayfinder:map`。
- **子工单**：通过 GitHub 子 Issue（`gh api` 操作子 Issue 端点）链接到地图的 Issue。若子 Issue 功能未启用，将子工单添加到地图正文的任务列表中，并在子工单正文顶部标注 `属于 #<地图编号>`。标签：`wayfinder:<类型>`（`research`/`prototype`/`grilling`/`task`）。工单被认领后分配给负责开发者。
- **阻塞**：GitHub 的**原生 Issue 依赖** — 规范的、UI 可见的表示方式。使用 `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<阻塞者数据库ID>` 添加边，其中 `<阻塞者数据库ID>` 是阻塞者的数字**数据库 ID**（`gh api repos/<owner>/<repo>/issues/<n> --jq .id`，**不是** `#编号` 或 `node_id`）。GitHub 报告 `issue_dependencies_summary.blocked_by`（仅开放阻塞者 — 实时门控）。若依赖功能不可用，回退到在子工单正文顶部标注 `阻塞者：#<n>, #<n>`。当所有阻塞者关闭后工单解除阻塞。
- **前沿查询**：列出地图的开放子工单（`gh issue list --state open`，限定在地图的子 Issue/任务列表范围内），排除有开放阻塞者（`issue_dependencies_summary.blocked_by > 0`，或 `阻塞者` 行中有开放 Issue）或已有指派的工单；按地图顺序取第一个。
- **认领**：`gh issue edit <n> --add-assignee @me` — 会话的首次写操作。
- **解决**：`gh issue comment <n> --body "<答案>"`，然后 `gh issue close <n>`，最后将上下文指针（gist + 链接）追加到地图的"已做决策"中。
