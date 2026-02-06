# Master Plan: CareerMatch AI Agentic Refactor

## Objective
将 CareerMatch AI 从同步阻塞模式改造为异步 Agentic 模式，用户点击后无需等待，后台自动完成分析和生成。

## API 配置
- **Base URL**: `https://relay.a-dobe.club`
- **API Key**: `sk-b8b3595c02324080a8a7fe11ab966c5f`
- **SDK**: Anthropic SDK (保持响应格式)
- **Model**: `claude-sonnet-4-5-thinking`

## Sub-Tasks

### Task 1: `db-schema` - 数据库 Schema 更新
- [ ] 创建 `processing_tasks` 表
- [ ] 添加状态字段和步骤追踪
- [ ] 创建必要的索引
- [ ] 生成 migration 文件

### Task 2: `ai-provider-refactor` - AI Provider 重构
- [ ] 更新 `lib/ai-providers.ts` 使用 relay.a-dobe.club
- [ ] 移除多 provider 复杂逻辑，统一用 Anthropic SDK
- [ ] 添加环境变量配置
- [ ] 更新 `.env.example`

### Task 3: `async-processing-api` - 异步处理 API
- [ ] 创建 `POST /api/jobs/[id]/process-full` - 启动全流程
- [ ] 创建 `GET /api/tasks/[id]/status` - 查询状态
- [ ] 创建 `POST /api/internal/process-job` - 后台 Worker
- [ ] 实现完整流程：分析 → CV → CL

### Task 4: `frontend-async-ui` - 前端异步 UI
- [ ] 修改岗位详情页支持"一键处理"
- [ ] 添加处理进度显示组件
- [ ] 实现状态轮询 (React Query)
- [ ] 完成通知展示

### Task 5: `realtime-notifications` - 实时通知 (可选)
- [ ] Supabase Realtime 订阅
- [ ] 完成后推送通知

## Dependencies
```
Task 1 (db-schema) ──┐
                     ├──> Task 3 (async-api) ──> Task 4 (frontend)
Task 2 (ai-provider) ┘
                                               ──> Task 5 (realtime)
```

## Constraints
- 保持现有 API 向后兼容
- 使用 Anthropic SDK 格式
- 所有 AI 调用通过 relay.a-dobe.club
- 不破坏现有功能

## Execution Order
1. Task 1 + Task 2 (并行)
2. Task 3 (依赖 1+2)
3. Task 4 (依赖 3)
4. Task 5 (可选，依赖 3)

## Status
- [x] Task 1: db-schema ✅ `1be8cd5`
- [x] Task 2: ai-provider-refactor ✅ `cf3a621`
- [x] Task 3: async-processing-api ✅ `e4944cd`
- [x] Task 4: frontend-async-ui ✅ `f3d492e`
- [ ] Task 5: realtime-notifications (Optional, skipped)

## Completion Summary
**Completed:** 2026-02-06 17:43 NZT
**Total commits:** 5 (excluding initial)
**Lines changed:** +1353 / -381 (net +972)
**Files added:** 8 new files
