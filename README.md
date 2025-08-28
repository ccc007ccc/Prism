# Prism: 实时网络摄像头监控系统

![Docker Image CI for Prism](https://github.com/ccc007ccc/prism/actions/workflows/docker-publish.yml/badge.svg)

这是一个基于 Python (Flask) 和 WebRTC 构建的轻量级、开源的实时网络摄像头监控系统。用户可以通过浏览器将任何带摄像头的设备（如手机、笔记本电脑）变成一个网络摄像头，并在另一个浏览器页面上查看所有摄像头的实时画面。

## ✨ 主要功能

- **实时视频流**: 使用 WebRTC 技术，实现低延迟、高效率的 P2P 视频流传输。
- **B/S 架构**: 无需安装任何客户端，所有操作均通过现代浏览器完成。
- **多摄像头仪表盘**: 在一个页面上同时展示所有在线的摄像头画面，并采用自适应布局。
- **动态画质控制**: 查看端可以为每个摄像头独立设置分辨率（最高4K）和码率。
- **全屏观看**: 支持点击单个监控画面进入沉浸式全屏模式。


## 🚀 快速开始

### 运行已发布的 Docker 镜像 (最简单的方式)

**1. 运行容器**

打开终端，运行以下命令。它会自动从 GHCR 下载最新版本的镜像并启动。

```bash
docker run -d -p 5000:5000 \
  --name prism_app \
  --restart unless-stopped \
  ghcr.io/ccc007ccc/prism:latest
````

容器启动后，在浏览器中访问 `http://ip:5000` 即可开始使用。

### 本地开发

如果你想修改代码或进行二次开发，可以按照以下步骤在本地运行。

1.  **环境准备**: 确保已安装 Python 3.8+。
2.  **克隆并安装依赖**:
    ```bash
    git clone [https://github.com/ccc007ccc/prism.git](https://github.com/ccc007ccc/prism.git)
    cd prism
    python -m venv .venv
    source .venv/bin/activate  # on Windows use: .venv\Scripts\activate
    pip install -r requirements.txt
    ```
3.  **运行应用**:
    ```bash
    python app.py
    ```
    服务器将在 `http://localhost:5000` 上启动。

## 📖 使用指南

1.  **打开主页**: 访问 `http://ip:5000`。
2.  **选择角色**:
      - **我是摄像头**: 在带摄像头的设备上点击，授权后开始推流。
      - **我要查看**: 在任何设备上点击，进入监控仪表盘。
3.  **操作**:
      - **调整画质**: 鼠标悬停在监控画面上，选择分辨率和码率后点击“应用”。
      - **全屏**: 鼠标悬停在画面上，点击右上角的全屏图标。
