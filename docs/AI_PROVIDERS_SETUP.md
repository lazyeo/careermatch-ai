# AI提供商配置指南

> **更新日期**: 2025-11-20
> **版本**: v1.0

---

## 📋 概述

CareerMatch AI现在支持多个AI提供商，您可以使用以下任一服务：

1. **OpenAI** (原生) - 稳定可靠的官方API
2. **OpenAI Codex** (中继) - 通过relay服务访问
3. **Claude** (中继) - 卓越的推理能力，推荐用于岗位匹配分析
4. **Gemini** (中继) - Google AI，快速高效

所有中继服务均基于 [claude-relay-service](https://github.com/Wei-Shaw/claude-relay-service) 项目。

---

## 🚀 快速开始

### 步骤 1: 创建环境变量文件

在项目根目录创建 `.env.local` 文件（如果不存在）：

```bash
cp .env.example .env.local
```

### 步骤 2: 选择并配置AI提供商

**您只需要配置至少一个提供商**，系统会自动检测可用的服务。

---

## 🔧 配置选项

### Option 1: OpenAI (原生)

**优点**:
- ✅ 官方API，稳定可靠
- ✅ 无需中继服务
- ✅ GPT-4性能优秀

**成本**: ~$0.03-0.06 / 次分析

**配置**:

```bash
# .env.local
OPENAI_API_KEY=sk-proj-xxx...
OPENAI_BASE_URL=https://api.openai.com/v1
```

**获取API密钥**: https://platform.openai.com/api-keys

---

### Option 2: OpenAI Codex (中继服务)

**优点**:
- ✅ 通过自建中继服务访问
- ✅ 与OpenAI兼容
- ✅ 适合代码相关分析

**配置**:

```bash
# .env.local
CODEX_API_KEY=your-relay-api-key
CODEX_BASE_URL=https://your-relay-service.com/v1
```

**注意**: `CODEX_BASE_URL` 必须指向OpenAI兼容的API端点（以 `/v1` 结尾）

---

### Option 3: Claude (中继服务) - 推荐

**优点**:
- ✅ 卓越的推理和分析能力
- ✅ 更擅长理解复杂的职位要求
- ✅ SWOT分析更加深入
- ✅ **推荐用于岗位匹配分析**

**配置**:

```bash
# .env.local
CLAUDE_API_KEY=your-relay-api-key
CLAUDE_BASE_URL=https://your-relay-service.com/v1
```

**支持的模型**:
- `claude-3-opus-20240229` - 最佳性能（默认）
- `claude-3-sonnet-20240229` - 平衡选择
- `claude-3-haiku-20240307` - 快速响应

---

### Option 4: Gemini (中继服务)

**优点**:
- ✅ Google AI，响应速度快
- ✅ 成本相对较低
- ✅ 多语言支持好

**配置**:

```bash
# .env.local
GEMINI_API_KEY=your-relay-api-key
GEMINI_BASE_URL=https://your-relay-service.com/v1
```

**支持的模型**:
- `gemini-pro` - 通用模型

---

## 🛠️ 中继服务配置

如果您使用 [claude-relay-service](https://github.com/Wei-Shaw/claude-relay-service) 搭建中继服务：

### 1. 确保中继服务正常运行

```bash
curl https://your-relay-service.com/v1/models
```

应返回可用的模型列表。

### 2. 配置API密钥

中继服务的API密钥由您的relay服务生成和管理，请参考relay服务的文档。

### 3. 端点格式

所有baseURL必须指向OpenAI兼容的API端点：

```
https://your-domain.com/v1
```

**正确示例**:
- ✅ `https://api.example.com/v1`
- ✅ `https://relay.mydomain.com/v1`

**错误示例**:
- ❌ `https://api.example.com` (缺少 /v1)
- ❌ `https://api.example.com/api` (错误的路径)

---

## 🎯 使用方式

### 自动选择模式（推荐）

系统会按照以下优先级自动选择可用的AI提供商：

```
Claude > OpenAI > Codex > Gemini
```

无需任何额外配置，配置好环境变量后即可使用。

### 手动选择模式

在AI分析页面，您可以手动选择使用哪个AI提供商：

1. 访问岗位详情页
2. 点击"开始AI分析"
3. 选择简历
4. **选择AI模型**（新功能）
   - 自动选择（推荐）
   - 或手动选择特定提供商
5. 点击"开始AI分析"

### API调用方式

如果您需要通过API直接调用：

```typescript
// 使用默认提供商
const response = await fetch('/api/jobs/{jobId}/analyze', {
  method: 'POST',
  body: JSON.stringify({
    resumeId: 'xxx',
  }),
})

// 指定特定提供商
const response = await fetch('/api/jobs/{jobId}/analyze', {
  method: 'POST',
  body: JSON.stringify({
    resumeId: 'xxx',
    provider: 'claude', // 'openai' | 'codex' | 'claude' | 'gemini'
  }),
})
```

---

## 📊 提供商对比

| 特性 | OpenAI | Codex | Claude | Gemini |
|------|--------|-------|--------|--------|
| **推理能力** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **分析深度** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **响应速度** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **成本** | 中等 | 低 | 中等 | 低 |
| **配置复杂度** | 简单 | 中等 | 中等 | 中等 |
| **推荐场景** | 通用 | 代码分析 | **岗位匹配** | 快速分析 |

---

## 🔍 故障排查

### 问题 1: "No AI provider is configured"

**原因**: 没有配置任何AI提供商的API密钥。

**解决**:
1. 检查 `.env.local` 文件是否存在
2. 确保至少配置了一个提供商的 `API_KEY` 和 `BASE_URL`
3. 重启开发服务器

```bash
pnpm web:dev
```

### 问题 2: "AI Provider is not configured"

**原因**: 手动选择的提供商未配置。

**解决**:
1. 切换到"自动选择"模式
2. 或配置选定提供商的环境变量

### 问题 3: 中继服务连接失败

**原因**: baseURL配置错误或中继服务未运行。

**解决**:
1. 检查 `BASE_URL` 格式是否正确（必须以 `/v1` 结尾）
2. 测试中继服务是否可访问：
   ```bash
   curl https://your-relay-service.com/v1/models
   ```
3. 检查API密钥是否正确

### 问题 4: 分析失败或返回空响应

**原因**: 模型名称不匹配或API配额用尽。

**解决**:
1. 检查后端日志查看详细错误信息
2. 确认API密钥有足够的配额
3. 尝试切换到其他AI提供商

---

## 🛡️ 安全建议

1. **不要提交 `.env.local` 到Git**
   - `.env.local` 已在 `.gitignore` 中
   - 仅提交 `.env.example` 作为模板

2. **定期轮换API密钥**
   - 建议每3个月更换一次

3. **限制API密钥权限**
   - 仅授予必要的API访问权限
   - 设置使用配额限制

4. **监控API使用情况**
   - 定期检查API调用量
   - 设置预算告警

---

## 📚 相关文档

- [项目README](../README.md)
- [开发指南](../DEVELOPMENT.md)
- [环境变量示例](../.env.example)
- [claude-relay-service项目](https://github.com/Wei-Shaw/claude-relay-service)

---

## 🎉 总结

配置步骤：

1. ✅ 复制 `.env.example` 为 `.env.local`
2. ✅ 选择并配置至少一个AI提供商
3. ✅ 重启开发服务器
4. ✅ 访问分析页面测试功能

推荐配置（优先级从高到低）：

1. **Claude** (中继) - 最佳分析效果
2. **OpenAI** (原生) - 最稳定可靠
3. **Codex** (中继) - 备用选项
4. **Gemini** (中继) - 成本敏感场景

---

**需要帮助?**

- 查看 [Issues](https://github.com/lazyeo/CareerMatch/issues)
- 或参考 [开发文档](../DEVELOPMENT.md)

*最后更新: 2025-11-20*
