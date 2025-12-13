# OddOneOut Detector

基于视觉 AI 的网格异常检测工具，使用先进的视觉模型自动识别药丸、零件等物品阵列中的异常个体。

## 功能特性

- 🔍 **智能异常检测**：自动识别网格布局中的异常物体
- 📦 **批量处理**：支持拖拽多张图片批量分析
- 💾 **离线缓存**：预生成结果，支持无网演示
- 🌍 **多语言支持**：中文/英文界面切换
- 🎯 **精准定位**：自动标注异常位置和边界框
- 📊 **置信度评分**：提供检测结果的可信度评估

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或使用 bun
bun install
```

### 2. 配置 API

首次启动会自动打开设置面板，填入以下信息：

- **API URL**: OpenAI 兼容接口地址（如 OpenAI、SiliconFlow、OpenRouter）
- **API Key**: 你的 API 密钥
- **Model**: 视觉模型名称（如 `gpt-4-vision-preview`、`gemini-2.0-flash-exp`）

API 配置会保存在本地浏览器，无需重复设置。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 开始使用。

### 4. 打包桌面应用（可选）

使用 Tauri 打包为 Windows/macOS/Linux 桌面应用：

```bash
# 开发模式
npm run tauri dev

# 生产构建
npm run tauri build
```

构建产物在 `src-tauri/target/release/bundle/` 目录。

## 使用指南

### 基础使用

1. **上传图片**：拖拽或点击上传包含网格物体的图片
2. **查看结果**：AI 自动分析并高亮异常位置
3. **历史记录**：点击左下角按钮查看所有分析历史

### 推荐的图片要求

- ✅ 网格排列清晰（如 3×3、4×5 等规则布局）
- ✅ 光照均匀，物体边界清晰
- ✅ 异常特征明显（颜色、形状、大小差异）
- ❌ 避免过度模糊、反光严重的图片

### 离线演示模式

用于无网络环境的演示，需提前生成检测结果：

```bash
# 1. 将待处理图片放入 data/ 文件夹
# 2. 批量预处理（需联网）
npx tsx scripts/preprocess.ts

# 3. 构建生产版本
npm run build

# 4. 本地预览
npm run preview
```

上传 `data/` 中的图片时，应用会自动匹配缓存结果，无需网络即可显示。

## 项目结构

```
oddoneout-detector/
├── components/          # React 组件
│   ├── LogTerminal.tsx  # 系统日志终端
│   ├── ResultViewer.tsx # 结果展示
│   └── AnomalyDetail.tsx # 异常详情
├── services/            # 业务逻辑
│   ├── openrouterService.ts # AI 推理服务
│   └── cacheService.ts  # 缓存管理
├── data/                # 待处理的源图片（离线模式）
├── public/cache/        # 预生成的检测结果
│   ├── index.json       # 图片哈希 -> 检测结果映射
│   └── result_*.jpg     # 带标注框的结果图片
├── scripts/
│   └── preprocess.ts    # 批量预处理脚本
└── src-tauri/           # Tauri 桌面应用配置
```

## 技术栈

- **前端框架**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide Icons
- **桌面打包**: Tauri 2.0
- **AI 服务**: OpenAI Compatible API（支持多种视觉模型）

## 开发指南

### 添加新语言

编辑 `constants/translations.ts`，添加对应语言的翻译键值对：

```typescript
export const TRANSLATIONS = {
  en: { /* ... */ },
  zh: { /* ... */ },
  ja: { /* 新增日语 */ }
};
```

### 自定义检测逻辑

修改 `services/openrouterService.ts` 中的 `SYSTEM_PROMPT` 调整 AI 检测行为。

## 常见问题

**Q: 为什么检测不准确？**
A: 确保图片光照均匀、网格清晰。可以尝试调整模型选择或优化 Prompt。

**Q: 如何更换 AI 模型？**
A: 点击设置按钮，修改 Model 字段。推荐使用支持图像理解的视觉模型。

**Q: 离线模式如何工作？**
A: 预处理脚本会生成图片的 MD5 哈希和检测结果，打包到应用中。上传时优先匹配缓存。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

