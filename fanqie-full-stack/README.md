# 🍅 番茄小说热榜分析系统

一个完整的番茄小说数据采集、分析和可视化系统。

## 📁 项目结构

```
fanqie-full-stack/
├── frontend/                  # 前端代码
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── data.js           # 静态数据
│       └── app.js            # 前端逻辑
│
├── backend/                  # 后端代码
│   ├── server.py             # Flask服务器
│   ├── spider.py             # 数据爬虫
│   ├── requirements.txt      # Python依赖
│   └── data/                 # 数据存储
│       └── novels.json
│
├── README.md
└── start.bat                 # Windows一键启动脚本
```

## 🚀 快速开始

### 方式一：一键启动（Windows）

```bash
双击运行 start.bat
```

### 方式二：手动启动

**1. 安装依赖**
```bash
cd backend
pip install -r requirements.txt
```

**2. 启动后端服务**
```bash
python server.py
```

**3. 打开前端**
在浏览器中打开 `frontend/index.html`

## ✨ 系统功能

### 前端功能
- 📱 四个页面：首页、图表、排行、作者
- 🔍 搜索和筛选
- 📊 ECharts数据可视化
- ❤️ 收藏功能（本地存储）
- 📥 数据导出

### 后端功能
- 🌐 RESTful API 接口
- 📡 数据爬虫（番茄小说）
- 💾 JSON数据持久化
- 🔄 支持数据更新

## 📡 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/novels` | GET | 获取所有小说数据 |
| `/api/novels?category=xxx` | GET | 按分类筛选 |
| `/api/novels?sort=score` | GET | 按评分排序 |
| `/api/categories` | GET | 获取所有分类 |
| `/api/stats` | GET | 获取统计数据 |
| `/api/update` | POST | 触发数据更新 |

## 🛠️ 技术栈

### 前端
- HTML5 + CSS3 + JavaScript
- ECharts 5.x

### 后端
- Python 3.x
- Flask

### 爬虫
- Requests
- BeautifulSoup

## 📝 数据字段

```json
{
  "id": 1,
  "排名": 1,
  "书名": "我不是戏神",
  "作者": "三九音域",
  "分类": "都市高武",
  "热度": 5000000,
  "评分": 9.9,
  "在读人数": 5000000,
  "标签": ["都市", "异能", "热血"],
  "上架时间": "2024-01",
  "简介": "..."
}
```

## ⚠️ 注意事项

1. 爬虫功能需遵守网站robots.txt和使用规则
2. 请勿过于频繁请求，建议间隔时间大于30秒
3. 部分网站可能有反爬机制，需要适当调整

## 📄 License

MIT License
