# 部署到 Cloudflare Pages 指南

## 概述

这个指南将帮助你把 OddOneOut Detector 项目部署到 Cloudflare Pages，并了解如何使用历史记录系统。

## 功能特点

✅ **localStorage 历史记录系统**
- 自动保存所有检测结果到浏览器本地存储（IndexedDB）
- 页面刷新/重启后历史记录不会丢失
- 支持清除历史记录功能

✅ **Cloudflare Pages 优化**
- 静态站点部署，无需服务器
- 全球 CDN 加速
- 自动 HTTPS
- 支持自定义域名

## 部署步骤

### 1. 准备工作

确保你有：
- Cloudflare 账号
- GitHub/GitLab 账号（用于代码托管）
- Node.js 18+ 环境

### 2. 本地配置

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建项目
npm run build
```

### 3. 部署到 Cloudflare Pages

#### 方法一：通过 Git 集成（推荐）

1. 将代码推送到 GitHub/GitLab
2. 登录 Cloudflare Dashboard
3. 进入 "Pages" 页面
4. 点击 "Create a project"
5. 选择你的 Git 仓库
6. 配置构建设置：
   - Framework preset: React
   - Build command: `npm run build`
   - Build output directory: `dist`
7. 点击 "Deploy"

#### 方法二：使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署项目
npm run deploy
```

### 4. 环境变量配置

在 Cloudflare Dashboard 中设置环境变量：
- `VITE_OPENROUTER_API_KEY`: 你的 OpenRouter API 密钥

## 历史记录系统

### 本地存储 (IndexedDB)

- **存储位置**: 浏览器 / WebView IndexedDB
- **DB**: `oddoneout-detector`
- **Object Store**: `history`
- **存储格式**: 结构化记录（每条历史一条记录）
- **数据包含**: 图片（压缩后的 base64 或本地 cache 路径）、检测结果、时间戳、状态
- **兼容迁移**: 首次启动会自动迁移旧版 localStorage 的 `oddoneout-history`（仅在 IndexedDB 为空时）

### 使用说明

1. **自动保存**: 每次检测完成后自动保存到历史记录
2. **查看历史**: 点击右侧历史记录列表中的项目
3. **清除历史**: 点击历史记录标题栏的垃圾桶图标
4. **数据持久化**: 即使刷新页面，历史记录也会保留

### 存储限制

- IndexedDB 通常比 localStorage 有更大的可用空间，但仍建议定期清理历史记录
- 为了减少占用，历史记录中的上传图片会在保存前进行压缩

## 高级配置（可选）

### Cloudflare KV 后端

如果需要跨设备同步历史记录，可以启用 Cloudflare KV：

1. 在 Cloudflare 创建 KV 命名空间
2. 更新 `wrangler.toml` 中的 KV 配置
3. 创建 API 端点处理历史记录同步

### 自定义域名

1. 在 Cloudflare Pages 项目设置中添加自定义域名
2. 配置 DNS 解析
3. 等待 SSL 证书自动配置

## 注意事项

⚠️ **文件大小限制**: Cloudflare Pages 单个文件最大 25MB
⚠️ **构建时间**: 每次构建最多 20 分钟
⚠️ **API 限制**: OpenRouter API 有速率限制，请合理使用
⚠️ **隐私保护**: 图片数据只保存在用户本地，不会上传到服务器

## 故障排除

### 构建失败
- 检查 Node.js 版本是否兼容
- 确认所有依赖已正确安装
- 查看构建日志获取详细错误信息

### API 调用失败
- 检查 API 密钥是否正确设置
- 确认 OpenRouter API 服务状态
- 检查网络连接是否稳定

### 历史记录丢失
- 确认浏览器支持 localStorage
- 检查是否清除了浏览器数据
- 查看浏览器控制台是否有错误信息

## 技术支持

如遇到问题，可以：
1. 查看浏览器控制台错误信息
2. 检查 Cloudflare Pages 构建日志
3. 确认所有环境变量已正确配置

## 更新日志

### v1.1.0
- 添加 localStorage 历史记录系统
- 优化 Cloudflare Pages 部署配置
- 添加多语言支持（中英文）
- 支持清除历史记录功能
