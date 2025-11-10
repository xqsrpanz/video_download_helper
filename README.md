# Video Download Helper Starter

这是一个用于学习和拓展 Chrome 插件的视频下载助手模板。扩展会在匹配到指定 URL 时，自动向页面注入一个“下载视频”按钮，并预留了自定义下载逻辑的钩子。

## 功能概览
- 基于 URL 模式匹配自动注入按钮。
- 通过 `chrome.scripting.executeScript` 注入内容脚本。
- 内容脚本负责在页面中插入按钮，触发下载逻辑。
- 下载逻辑默认尝试抓取页面中的 `<video>` 或 `<a>` 元素，可自行扩展。
- 提供 Popup / Options 页面示例，支持通过 `chrome.storage.sync` 配置 URL 规则。

## 目录结构
```
manifest.json                // 插件声明
background/index.js          // 后台 service worker，负责注入与下载调度
content_scripts/injector.js  // 注入按钮、调用下载逻辑
content_scripts/downloader.js// 自定义下载逻辑钩子
assets/styles/content.css    // 按钮样式
popup/                       // 扩展弹窗示例
options/                     // URL 规则配置页面示例
```

## 开发环境准备
1. **Chrome 浏览器**  
   - 确保使用支持 Manifest V3 的版本（Chrome 88+）。
2. **编辑器**  
   - 推荐安装 [Visual Studio Code](https://code.visualstudio.com/)。
   - Windows 安装：下载安装包后按照向导完成安装；建议安装 `ESLint`、`Prettier` 插件以提升开发体验。
3. **Node.js（可选）**  
   - 如需整合打包/构建流程，可从 [Node.js 官方网站](https://nodejs.org/) 安装 LTS 版本。
4. **（可选）包管理器**  
   - 可以安装 `pnpm`、`yarn` 或 `npm` 搭配现代前端构建工具。

## 调试步骤
1. 打开 Chrome，进入 `chrome://extensions/`。
2. 打开右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择本项目目录。
4. 在匹配的页面（默认示例为 `https://example.com/watch`）中查看按钮注入效果。
5. 使用 DevTools 的 `Console` 与 `Sources` 面板调试 `background` 和 `content_scripts`。

## 定制指南
- **URL 规则**  
  - 在 `options` 页面编辑 JSON 列表，每条规则支持 `pattern`（通配符）、`scripts`（注入脚本列表）等字段。
  - 示例：
    ```json
    [
      {
        "id": "my-site",
        "description": "匹配自定义视频站点",
        "pattern": "https://my-video-site.com/watch/*",
        "scripts": ["content_scripts/injector.js"]
      }
    ]
    ```
- **下载逻辑**  
  - 修改 `content_scripts/downloader.js` 中的 `prepareDownload`。
  - 可以发送额外信息给后台，再由后台使用网络请求或 `chrome.downloads` API 完成下载。
- **样式与 UI**  
  - 调整 `assets/styles/content.css` 或添加其它样式文件。
  - 根据需要扩展 popup/options 页面。

## 下一步建议
- 集成 URL 动态解析（如通过 REST API 获取真实下载地址）。
- 增加错误提示、国际化多语言支持。
- 引入构建工具（如 Vite）管理模块化代码与打包流程。

