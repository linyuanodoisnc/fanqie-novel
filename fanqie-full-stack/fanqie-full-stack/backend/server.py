"""
番茄小说热榜 - Flask后端服务
提供RESTful API接口，支持数据爬取和查询
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 允许跨域访问

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'novels.json')

# ==========================================
# 初始化数据目录
# ==========================================
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

# 如果数据文件不存在，创建默认数据
if not os.path.exists(DATA_FILE):
    default_data = [
        {"id": 1, "排名": 1, "书名": "我不是戏神", "作者": "三九音域", "分类": "都市高武", "热度": 5000000, "评分": 9.9, "在读人数": 5000000, "标签": ["都市", "异能", "热血"], "上架时间": "2024-01", "简介": "当所有人都在追求长生时，他却只想当个普通人。"},
        {"id": 2, "排名": 2, "书名": "十日终焉", "作者": "杀虫队队员", "分类": "悬疑脑洞", "热度": 820000, "评分": 9.9, "在读人数": 820000, "标签": ["悬疑", "无限流", "智斗"], "上架时间": "2024-02", "简介": "十个人，十个房间，十次生死抉择。"},
        {"id": 3, "排名": 3, "书名": "游戏入侵：抢男女主机缘会上瘾诶", "作者": "猫不秃", "分类": "游戏体育", "热度": 600000, "评分": 9.2, "在读人数": 600000, "标签": ["游戏", "穿越", "轻松"], "上架时间": "2024-03", "简介": "穿进游戏世界，抢主角机缘成瘾了。"},
        {"id": 4, "排名": 4, "书名": "我在精神病院学斩神", "作者": "三九音域", "分类": "都市高武", "热度": 4000000, "评分": 9.8, "在读人数": 4000000, "标签": ["都市", "异能", "热血"], "上架时间": "2023-11", "简介": "精神病院里的少年，却拥有斩神的力量。"},
        {"id": 5, "排名": 5, "书名": "诸神愚戏", "作者": "一月九十秋", "分类": "都市高武", "热度": 1270000, "评分": 9.5, "在读人数": 1270000, "标签": ["都市", "游戏", "直播"], "上架时间": "2024-02", "简介": "神明降临人间，愚戏众生。"},
    ]
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(default_data, f, ensure_ascii=False, indent=2)

# ==========================================
# 工具函数
# ==========================================

def load_data():
    """加载数据"""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_data(data):
    """保存数据"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def parse_reads(value):
    """解析在读人数"""
    if isinstance(value, str):
        value = value.replace('万', '').replace(',', '').strip()
        try:
            return float(value)
        except:
            return 0
    return float(value)

# ==========================================
# API路由
# ==========================================

@app.route('/')
def index():
    """首页"""
    return send_from_directory('../frontend', 'index.html')

@app.route('/api/novels', methods=['GET'])
def get_novels():
    """
    获取小说列表
    支持参数：
    - category: 分类筛选
    - sort: 排序方式 (heat/score/new)
    - keyword: 搜索关键词
    - page: 页码
    - limit: 每页数量
    """
    data = load_data()
    
    # 分类筛选
    category = request.args.get('category')
    if category and category != 'all':
        data = [d for d in data if d.get('分类') == category]
    
    # 搜索
    keyword = request.args.get('keyword', '').strip()
    if keyword:
        keyword = keyword.lower()
        data = [d for d in data if 
                keyword in d.get('书名', '').lower() or 
                keyword in d.get('作者', '').lower()]
    
    # 排序
    sort = request.args.get('sort', 'heat')
    if sort == 'heat':
        data.sort(key=lambda x: x.get('热度', 0), reverse=True)
    elif sort == 'score':
        data.sort(key=lambda x: float(x.get('评分', 0)), reverse=True)
    elif sort == 'new':
        data.sort(key=lambda x: x.get('上架时间', ''), reverse=True)
    
    # 分页
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    start = (page - 1) * limit
    end = start + limit
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': {
            'list': data[start:end],
            'total': len(data),
            'page': page,
            'limit': limit,
            'pages': (len(data) + limit - 1) // limit
        }
    })

@app.route('/api/novels/<int:novel_id>', methods=['GET'])
def get_novel(novel_id):
    """获取单个小说详情"""
    data = load_data()
    novel = next((d for d in data if d.get('id') == novel_id), None)
    
    if novel:
        return jsonify({
            'code': 200,
            'message': 'success',
            'data': novel
        })
    else:
        return jsonify({
            'code': 404,
            'message': 'Novel not found',
            'data': None
        }), 404

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """获取所有分类"""
    data = load_data()
    categories = list(set(d.get('分类', '') for d in data if d.get('分类')))
    categories.sort()
    
    # 统计每个分类的数量
    category_stats = {}
    for cat in categories:
        category_stats[cat] = len([d for d in data if d.get('分类') == cat])
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': {
            'categories': categories,
            'stats': category_stats
        }
    })

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """获取统计数据"""
    data = load_data()
    
    if not data:
        return jsonify({
            'code': 200,
            'message': 'success',
            'data': {
                'total_books': 0,
                'total_reads': 0,
                'avg_score': 0,
                'total_authors': 0
            }
        })
    
    total_reads = sum(parse_reads(d.get('在读人数', 0)) for d in data)
    avg_score = sum(float(d.get('评分', 0)) for d in data) / len(data)
    authors = set(d.get('作者', '') for d in data if d.get('作者'))
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': {
            'total_books': len(data),
            'total_reads': round(total_reads, 0),
            'avg_score': round(avg_score, 2),
            'total_authors': len(authors)
        }
    })

@app.route('/api/update', methods=['POST'])
def update_data():
    """手动触发数据更新"""
    try:
        from spider import crawl_novels
        new_data = crawl_novels()
        
        if new_data:
            save_data(new_data)
            return jsonify({
                'code': 200,
                'message': 'Data updated successfully',
                'data': {
                    'count': len(new_data),
                    'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            })
        else:
            return jsonify({
                'code': 500,
                'message': 'Failed to crawl data',
                'data': None
            }), 500
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'Error: {str(e)}',
            'data': None
        }), 500

@app.route('/api/authors', methods=['GET'])
def get_authors():
    """获取作者统计数据"""
    data = load_data()
    
    author_stats = {}
    for d in data:
        author = d.get('作者', '')
        if author:
            if author not in author_stats:
                author_stats[author] = {
                    '作者': author,
                    '作品数': 0,
                    '总热度': 0,
                    '均分': 0,
                    '分类': d.get('分类', '')
                }
            author_stats[author]['作品数'] += 1
            author_stats[author]['总热度'] += d.get('热度', 0)
            author_stats[author]['均分'] += float(d.get('评分', 0))
    
    # 计算平均值
    for author in author_stats:
        if author_stats[author]['作品数'] > 0:
            author_stats[author]['均分'] = round(
                author_stats[author]['均分'] / author_stats[author]['作品数'], 1
            )
    
    # 排序并返回
    authors = sorted(author_stats.values(), key=lambda x: x['总热度'], reverse=True)
    
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': authors
    })

# ==========================================
# 启动服务器
# ==========================================

if __name__ == '__main__':
    print("=" * 50)
    print("🍅 番茄小说热榜后端服务")
    print("=" * 50)
    print("API服务地址：http://localhost:5000")
    print("数据文件：backend/data/novels.json")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
