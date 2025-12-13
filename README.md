# OddOneOut Detector

基于视觉 AI 的网格异常检测工具。

## 快速开始

```bash
npm install
npm run dev
```

## 离线演示（预缓存结果）

用于无网络环境的演示，需提前生成检测结果：

```bash
# 1. 批量处理 data/ 文件夹中的图片（需要联网）
npx tsx scripts/preprocess.ts

# 2. 构建生产版本
npm run build

# 3. 本地预览
npm run preview
```

上传 `data/` 文件夹中的图片时，应用会自动匹配缓存，无需网络即可显示检测结果。

## 项目结构

```
data/                  # 待处理的源图片
public/cache/          # 预生成的检测结果
  index.json           # 图片哈希 -> 检测结果映射
  result_*.jpg         # 带标注框的结果图片
scripts/
  preprocess.ts        # 批量预处理脚本
```
