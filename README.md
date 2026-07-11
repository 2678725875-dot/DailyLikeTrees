<div align="center">

<img src="frontend/public/assets/logo.png" alt="DailyLikeTrees Logo" width="120" />

# 🌳 DailyLikeTrees · 如树日常

*日复一日，如树般生长。每一次专注，都在你的森林里种下一棵树。*

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PixiJS](https://img.shields.io/badge/PixiJS-7.4-E72264?logo=pixiv&logoColor=white)](https://pixijs.com/)
[![Electron](https://img.shields.io/badge/Electron-33.2-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.11-FFC131?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.4-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ 这是什么？

**DailyLikeTrees（如树日常）** 是一款受 Forest 专注森林启发的多平台专注辅助应用。

设定一个专注目标 → 完成它 → 在你的等距「专注森林」中种下一棵树。日积月累，终成一片林。

> 🖥️ 当前开发阶段：**多平台 MVP — Web + Electron 桌面 + Android**

---

## 🎯 核心功能

<table>
<tr>
<td width="50%">

### ⏱️ 智能计时器
SVG 环形拖拽设时（15~120 分钟），支持倒计时 / 正计时 / 自由模式。拖拽手感细腻，吸附常用时长。

### 🌳 专注森林
PixiJS WebGL 驱动的等距（Isometric）森林渲染，37 种树木精灵，动态黄金比例网格布局，树与树之间永不重叠。

### ☀️ 精致天气系统
晴天（体积光束 + 丁达尔光尘）、多云（蓬松积云）、雨天（涟漪水花）、雷雨（多层闪电），PixiJS + CSS 双层渲染。

</td>
<td width="50%">

### 🏔️ 多变地形
平原 / 溪流 / 山地三种地形，柏林噪声驱动的高低错落地块。切换地形时树木自动重新分布。

### 🎵 环境音混音
Web Audio API 多层环境音（雨声 / 溪流 / 风 / 雷 / 森林）实时混合，跨页面无缝衔接，音量独立可调。

### 🎹 BGM 播放
内置舒缓背景音乐，专注更沉浸。跨页面不中断，与系统音频独立控制。

</td>
</tr>
</table>

**更多特性：**
- 🌓 **深色 / 浅色主题** — 全局 CSS 自定义属性驱动，天气颜色随主题自适应
- 📋 **待办记事** — 完整的 Todo CRUD，乐观更新 + 自动回滚，专注同时管理任务
- 🖼️ **森林背景** — 将任意时间段的森林设为主页动态背景，低透明度 + 天气覆盖
- 🎯 **矢量图标系统** — 统一 IconSvg 组件管理应用图标
- 📱 **PWA 就绪** — Hash 路由 + 响应式布局，可安装到桌面

---

## 🛠 技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| **前端框架** | Vue 3 + Composition API | `<script setup>` + TypeScript |
| **状态管理** | Pinia | 5 个 Store 模块（timer / todos / forest / audio / settings） |
| **构建工具** | Vite 8 | 极速 HMR |
| **森林渲染** | PixiJS 7.4 | WebGL 等距 2D 渲染 |
| **音频引擎** | Web Audio API | 多层环境音 + BGM 实时混音 |
| **后端框架** | FastAPI | Python 异步 Web 框架 |
| **数据库** | SQLite3 + SQLAlchemy | 轻量级，零配置 |
| **类型验证** | Pydantic v2 | 请求 / 响应 Schema |
| **桌面壳** | Electron 33 + Tauri v2 | Electron 为主（内嵌 Chromium），Tauri 保留兼容 |
| **移动端** | Capacitor 8 | PWA → 原生 Android APK |
| **后端打包** | PyInstaller | 将 Python 后端编译为独立 exe |

---

## 🚀 快速开始

### 前置要求

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **npm** ≥ 9

### 1. 克隆仓库

```bash
git clone https://github.com/2678725875-dot/DailyLikeTrees.git
cd DailyLikeTrees
```

### 2. 启动后端

```bash
cd backend

# 创建虚拟环境（推荐）
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务（端口 8000）
uvicorn app.main:app --reload
```

访问 [http://localhost:8000/docs](http://localhost:8000/docs) 查看 Swagger API 文档。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 即可使用。

> ⚠️ 两个服务需要**同时运行**。前端的 API 请求通过 Vite 开发服务器代理到后端 8000 端口。

### 4. 桌面应用（Electron）

> 🖥️ 推荐桌面方案。内嵌 Chromium 130，彻底解决 WebView2 兼容性问题，无需安装额外运行时。

**开发模式：**

```bash
cd electron-app
npm install
npm start
```

Electron 窗口自动打开，加载 Vite dev server 或本地 `dist/`。

**生产构建：**

```bash
# 1. 确保 backend.exe 已构建（见下方「后端打包」）
# 2. 构建 Electron 安装包
cd electron-app
npm run build        # 自动构建前端 → 复制 dist → electron-builder
```

构建产物位于 `electron-app/release/`：
- `DailyLikeTrees Setup 0.x.x.exe` — NSIS 安装包（含 backend.exe）
- `win-unpacked/DailyLikeTrees.exe` — 绿色免安装版

> 📦 应用自动启动 / 停止 backend.exe，用户**无需安装 Python** 或任何运行环境。

#### Tauri v2（备选）

Tauri 需要系统安装 WebView2 Runtime，如遇白屏问题推荐使用 Electron。

```bash
cd frontend
npx tauri dev         # 开发
npx tauri build       # 构建
```

#### 后端打包

```bash
cd backend
pip install pyinstaller
pyinstaller --onefile --name backend \
    --collect-all uvicorn --collect-all fastapi \
    --collect-all sqlalchemy --collect-all aiosqlite \
    run.py

# 复制到 Tauri 资源目录
cp dist/backend.exe ../frontend/src-tauri/binaries/backend.exe
# Electron 构建时自动读取
```

### 5. 移动端（Android）

> 📱 基于 Capacitor，PWA 转原生 APK。

```bash
cd frontend
npm run android:sync    # 同步前端到 Capacitor
npm run android:build   # 完整构建 → APK
```

APK 输出：`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📁 项目结构

```
DailyLikeTrees/
├── electron-app/                      # Electron 桌面应用（主力）
│   ├── main.js                        # 主进程：窗口管理 / 后端拉起 / IPC
│   ├── preload.js                     # contextBridge API 暴露
│   ├── package.json                   # electron-builder 构建配置
│   └── icon.ico                       # 多分辨率应用图标
│
├── frontend/                          # Vue 3 + Vite 前端
│   ├── public/assets/
│   │   ├── audio/                     # 音频素材（环境音 + BGM）
│   │   │   ├── ambiance/              # rain / thunder / creek / wind / forest
│   │   │   └── music/                 # calm-1 / calm-2 / calm-3
│   │   ├── trees/species/             # 37 种树木精灵（PNG）
│   │   └── logo.png                  # 应用图标
│   ├── src/
│   │   ├── components/
│   │   │   ├── timer/                 # CircularTimer / TreePreview / TreeSpeciesPicker
│   │   │   ├── board/                 # TodoBoard / TodoItem / TodoAddForm
│   │   │   ├── forest/                # IsometricGrid / BackgroundForest
│   │   │   ├── audio/                 # AudioControlPanel
│   │   │   ├── icons/                 # IconSvg 矢量图标系统
│   │   │   ├── settings/              # SettingsPanel / DevToolsPanel
│   │   │   └── layout/                # AppShell / CustomTitleBar / FloatingBall
│   │   ├── composables/               # useAudioEngine / useCircularTimer / useWeatherInfo …
│   │   ├── stores/                    # Pinia: timer / todos / forest / audio / settings
│   │   ├── services/                  # Axios API 封装
│   │   ├── types/                     # TypeScript 类型定义
│   │   ├── utils/                     # 等距坐标 / 素材路径 / 树木生长 / 常量
│   │   ├── views/                     # HomeView / ForestViewPage / FloatingBallView
│   │   └── styles/                    # CSS 变量 / 主题 / 基础样式
│   ├── src-tauri/                     # Tauri v2 桌面壳（备选）
│   │   ├── src/lib.rs                 # Rust：自动启动 / 停止后端进程
│   │   ├── src/main.rs                # Windows 程序入口
│   │   ├── tauri.conf.json            # 窗口尺寸 / CSP / 资源打包
│   │   └── binaries/                  # backend.exe（PyInstaller 产物）
│   └── android/                       # Capacitor Android 项目
│
├── backend/                           # FastAPI + SQLite3 后端
│   ├── app/
│   │   ├── models/                    # ORM: FocusSession / PlantedTree / Todo / UserSetting
│   │   ├── schemas/                   # Pydantic 请求 / 响应模型
│   │   ├── routers/                   # sessions / trees / todos / settings
│   │   ├── services/                  # 业务逻辑层
│   │   └── utils/                     # 树木成长阶段计算
│   └── run.py                         # PyInstaller 入口脚本
│
├── CLAUDE.md                          # Claude Code 项目指引
└── README.md                          # 本文件
```

---

## 🔌 API 概览

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/sessions` | 完成一次专注 → 种下一棵树 |
| `GET` | `/api/sessions` | 获取最近会话列表 |
| `GET` | `/api/trees?filter=today\|week\|month\|total` | 获取森林树木 + 统计 |
| `GET` / `POST` | `/api/todos` | 待办列表 / 创建待办 |
| `PATCH` / `DELETE` | `/api/todos/{id}` | 更新 / 删除待办 |
| `PUT` | `/api/todos/reorder` | 重排待办顺序 |
| `GET` / `PUT` | `/api/settings` | 读写用户设置 |

### 树木成长阶段

| 专注时长 | 阶段 |
|----------|------|
| 0–14 分钟 | 🌱 种子 |
| 15–29 分钟 | 🌿 萌芽 |
| 30–59 分钟 | 🪴 树苗 |
| ≥ 60 分钟 | 🌳 大树 |

---

## 🎵 音频素材

项目音频文件来自 [Freesound.org](https://freesound.org)，均为 CC0 许可。

如需替换为自己的音频：
1. 将 MP3 文件放入对应目录（`ambiance/` 或 `music/`）
2. 编辑 `frontend/src/utils/assetPaths.ts` 更新路径映射
3. 推荐参数：环境音 96–128kbps 单声道，BGM 128–192kbps 立体声

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！当前处于 Web MVP 阶段，后续计划包括：

- [x] 移动端适配（Android / Capacitor）
- [ ] iOS 适配
- [ ] 多人专注房间
- [ ] 更多树种 & 自定义森林主题
- [ ] 专注统计 & 周报
- [ ] 浏览器扩展（屏蔽 distracting 网站）

---

## 📄 许可

MIT License — 详见 [LICENSE](LICENSE) 文件。

---

<div align="center">

**🌳 每一棵树，都见证了你专注的时光。**

Made with ❤️ by [Ultraism](https://github.com/2678725875-dot)

</div>
