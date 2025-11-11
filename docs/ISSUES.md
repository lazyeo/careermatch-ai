# 问题追踪

记录开发过程中遇到的问题、解决方案和经验教训。

---

## 当前问题

**暂无未解决问题**

---

## 已解决问题

### 问题记录模板

每个问题记录应包含：
- **问题ID**: 便于引用
- **发现日期**: 何时遇到的
- **严重程度**: Critical / High / Medium / Low
- **问题描述**: 详细描述
- **复现步骤**: 如何复现
- **尝试的解决方案**: 记录所有尝试
- **最终解决方案**: 如何解决的
- **经验教训**: 学到了什么
- **相关链接**: 参考资料

---

## 示例问题记录

### ISSUE-001: pnpm install 失败（示例）

**发现日期**: 2025-01-11
**严重程度**: High
**状态**: ✅ 已解决

#### 问题描述
运行 `pnpm install` 时报错，提示找不到某个包。

#### 错误信息
```bash
ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@careermatch/ui: Not found
```

#### 复现步骤
1. 克隆项目
2. 运行 `pnpm install`
3. 看到错误

#### 尝试的解决方案

**尝试1**: 清理缓存
```bash
pnpm store prune
rm -rf node_modules
pnpm install
```
**结果**: ❌ 失败，同样的错误

**尝试2**: 检查package.json
发现 `@careermatch/ui` 被误添加为外部依赖。
**结果**: ✅ 找到原因

#### 最终解决方案
从 `package.json` 中移除 `@careermatch/ui` 依赖，因为它是workspace内部包，不应该从npm安装。

```json
// 错误的配置
{
  "dependencies": {
    "@careermatch/ui": "^0.1.0"  // ❌ 移除这行
  }
}

// 正确的配置
// workspace包通过pnpm workspace自动链接，不需要在dependencies中声明
```

#### 经验教训
1. Monorepo内部包不需要在dependencies中声明
2. 遇到404错误先检查是否是内部包
3. 清理缓存前先检查配置

#### 相关链接
- [pnpm Workspaces文档](https://pnpm.io/workspaces)

---

## 问题分类

### 依赖管理问题
记录与pnpm、npm、依赖安装相关的问题。

### 构建问题
记录与TypeScript、Turborepo、Next.js构建相关的问题。

### 数据库问题
记录与Supabase、SQL、迁移相关的问题。

### API集成问题
记录与OpenAI、Cloudflare等第三方API集成的问题。

### 部署问题
记录与Vercel、环境变量、生产环境相关的问题。

### 性能问题
记录性能瓶颈和优化方案。

### 安全问题
记录安全漏洞和修复方案。

---

## 常见问题FAQ

### Q1: TypeScript类型错误 - Cannot find module '@careermatch/ui'

**问题**: 导入UI组件时提示找不到模块。

**原因**: 包尚未构建，或TypeScript配置问题。

**解决方案**:
```bash
# 1. 构建UI包
cd packages/ui
pnpm build

# 2. 或构建所有包
cd ../..
pnpm build
```

---

### Q2: Next.js开发服务器启动失败

**问题**: `pnpm web:dev` 启动失败。

**可能原因**:
1. 端口3000被占用
2. 环境变量缺失
3. 依赖未安装

**解决方案**:
```bash
# 检查端口
lsof -i :3000

# 重新安装依赖
rm -rf node_modules .next
pnpm install

# 检查环境变量
ls apps/web/.env.local
```

---

### Q3: Supabase连接失败

**问题**: 应用无法连接到Supabase。

**检查清单**:
- [ ] 环境变量配置正确（URL和Key）
- [ ] Supabase项目处于活跃状态
- [ ] 网络连接正常
- [ ] API密钥未过期

**解决方案**:
```bash
# 验证环境变量
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 测试连接
curl https://your-project.supabase.co/rest/v1/
```

---

### Q4: Git提交时找不到文件

**问题**: git commit时提示某些文件不存在。

**原因**: 文件在.gitignore中或路径错误。

**解决方案**:
```bash
# 检查.gitignore
cat .gitignore

# 强制添加（谨慎使用）
git add -f path/to/file

# 查看暂存状态
git status
```

---

## 预防性检查清单

在遇到常见问题前，先执行这些检查：

### 开发环境检查
```bash
# 1. 检查Node版本
node -v  # 应该 >= 18.0.0

# 2. 检查pnpm版本
pnpm -v  # 应该 >= 8.0.0

# 3. 检查依赖安装
ls node_modules

# 4. 检查环境变量
cat apps/web/.env.local
```

### 构建问题检查
```bash
# 1. 清理构建缓存
rm -rf .next .turbo dist

# 2. 重新构建
pnpm build

# 3. 类型检查
pnpm type-check
```

### 数据库问题检查
```bash
# 1. 检查Supabase项目状态
# 访问 supabase.com 确认项目运行中

# 2. 测试数据库连接
# 在Supabase Dashboard执行简单查询

# 3. 检查RLS策略
# 确保策略允许当前操作
```

---

## 上报流程

当遇到无法解决的问题时：

1. **记录详细信息**
   - 错误信息（完整的）
   - 复现步骤
   - 环境信息（OS, Node版本等）
   - 相关配置文件

2. **搜索已知问题**
   - 查看本文档
   - 搜索GitHub Issues
   - 查看Stack Overflow

3. **创建Issue**
   - 使用清晰的标题
   - 提供完整的复现步骤
   - 附上错误截图
   - 说明尝试过的解决方案

4. **寻求帮助**
   - 团队内部讨论
   - 官方社区提问
   - 找对应库的文档

---

## 问题统计

| 分类 | 总计 | 已解决 | 进行中 |
|------|------|--------|--------|
| 依赖管理 | 0 | 0 | 0 |
| 构建问题 | 0 | 0 | 0 |
| 数据库 | 0 | 0 | 0 |
| API集成 | 0 | 0 | 0 |
| 部署 | 0 | 0 | 0 |
| 性能 | 0 | 0 | 0 |
| 安全 | 0 | 0 | 0 |
| **总计** | **0** | **0** | **0** |

---

*最后更新: 2025-01-11*
