/**
 * ========================================
 * 番茄小说热榜 - 主逻辑文件
 * ========================================
 * 
 * 功能模块：
 * 1. 数据初始化和预处理
 * 2. 统计计算
 * 3. 列表渲染
 * 4. 图表渲染
 * 5. 筛选和排序
 * 6. 搜索功能
 * 7. 收藏功能
 * 8. 对比功能
 * 9. 导出功能
 */

// ==========================================
// 全局变量
// ==========================================

let data = [];                    // 处理后的数据
let filteredData = [];           // 筛选后的数据
let currentCat = 'all';           // 当前分类
let currentSort = 'heat';         // 当前排序
let currentRank = 'heat';         // 当前排行类型
let currentTab = 'home';          // 当前Tab
let compareList = [];             // 对比列表
let isCompareMode = false;        // 是否对比模式
let likedBooks = [];              // 收藏列表
let charts = {};                  // 图表实例

// ==========================================
// 数据初始化
// ==========================================

/**
 * 初始化应用
 */
function init() {
    // 加载本地收藏
    likedBooks = JSON.parse(localStorage.getItem('likedBooks') || '[]');
    
    // 处理原始数据，添加在读人数_万字段
    data = novelData.map(d => ({
        ...d,
        在读人数_万: (d.在读人数 / 10000).toFixed(1)
    }));
    
    // 初始筛选数据
    filteredData = [...data];
    
    // 更新统计
    updateStats();
    
    // 渲染列表
    renderList();
    
    // 初始化Tab切换
    initTabs();
    
    // 初始化筛选器
    initFilters();
}

/**
 * 更新统计数据
 */
function updateStats() {
    document.getElementById('statBooks').textContent = filteredData.length;
    document.getElementById('statReads').textContent = filteredData.reduce((s, d) => s + parseFloat(d.在读人数_万), 0).toFixed(0);
    document.getElementById('statScore').textContent = (filteredData.reduce((s, d) => s + d.评分, 0) / filteredData.length).toFixed(2);
    document.getElementById('statAuthor').textContent = [...new Set(filteredData.map(d => d.作者))].length;
}

// ==========================================
// 列表渲染
// ==========================================

/**
 * 渲染书籍列表
 */
function renderList() {
    let sorted = [...filteredData];
    
    // 根据排序方式排序
    if (currentSort === 'heat') {
        sorted.sort((a, b) => b.热度 - a.热度);
    } else if (currentSort === 'score') {
        sorted.sort((a, b) => b.评分 - a.评分);
    } else if (currentSort === 'new') {
        sorted.sort((a, b) => b.上架时间.localeCompare(a.上架时间));
    }
    
    // 空状态
    if (sorted.length === 0) {
        document.getElementById('bookList').innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>暂无符合条件的数据</p>
            </div>
        `;
        return;
    }
    
    const maxHeat = Math.max(...data.map(d => d.热度));
    
    // 生成HTML
    document.getElementById('bookList').innerHTML = sorted.map((d, i) => {
        const isLiked = likedBooks.includes(d.id);
        const isSelected = compareList.includes(d.id);
        const heatPercent = (d.热度 / maxHeat * 100).toFixed(0);
        const rankClass = d.排名 <= 3 ? 'gold' : d.排名 <= 10 ? 'silver' : d.排名 <= 20 ? 'bronze' : '';
        
        return `
            <div class="book-card ${isCompareMode ? 'compare-mode' : ''} ${isSelected ? 'selected' : ''}" onclick="handleCardClick(${d.id})">
                <div class="book-main">
                    <div class="rank-badge ${rankClass}">${d.排名}</div>
                    <div class="book-info">
                        <div class="book-title">
                            ${d.书名}
                            <span class="book-tag">${d.分类}</span>
                        </div>
                        <div class="book-meta">
                            <span>👤 ${d.作者}</span>
                            <span>📅 ${d.上架时间}</span>
                        </div>
                        <div class="heat-bar">
                            <div class="heat-fill" style="width:${heatPercent}%"></div>
                        </div>
                    </div>
                </div>
                <div class="book-stats-row">
                    <div class="book-stats">
                        <span class="book-stat reads">🔥 ${d.在读人数_万}万</span>
                        <span class="book-stat score">⭐ ${d.评分}</span>
                    </div>
                    <div class="book-actions">
                        <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation();toggleLike(${d.id})">
                            ${isLiked ? '❤️' : '🤍'}
                        </button>
                        ${isCompareMode ? `
                            <button class="action-btn ${isSelected ? 'liked' : ''}" onclick="event.stopPropagation();toggleCompare(${d.id})">
                                ${isSelected ? '✓' : '⚖️'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// 图表渲染
// ==========================================

/**
 * 渲染所有图表
 */
function renderCharts() {
    // 统计数据
    const categoryCount = {};
    const categoryReads = {};
    const categoryScore = {};
    
    data.forEach(d => {
        categoryCount[d.分类] = (categoryCount[d.分类] || 0) + 1;
        categoryReads[d.分类] = (categoryReads[d.分类] || 0) + parseFloat(d.在读人数_万);
        if (!categoryScore[d.分类]) {
            categoryScore[d.分类] = { sum: 0, count: 0 };
        }
        categoryScore[d.分类].sum += d.评分;
        categoryScore[d.分类].count++;
    });
    
    // 配色方案
    const colors = ['#ff6b6b', '#ffa500', '#4ecdc4', '#45b7d1', '#96ceb4', '#a55eea', '#ff8e53', '#26de81', '#fd9644'];
    const cats = Object.keys(categoryCount);
    
    // 饼图 - 题材占比
    charts.pie = echarts.init(document.getElementById('chartPie'));
    charts.pie.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, textStyle: { fontSize: 10 } },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            itemStyle: { borderRadius: 8 },
            label: { fontSize: 10 },
            data: cats.map((c, i) => ({
                value: categoryCount[c],
                name: c,
                itemStyle: { color: colors[i % colors.length] }
            }))
        }]
    });
    
    // 柱状图 - 各题材在读人数
    const sortedReads = Object.entries(categoryReads).sort((a, b) => b[1] - a[1]);
    charts.bar = echarts.init(document.getElementById('chartBar'));
    charts.bar.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: sortedReads.map(x => x[0]), axisLabel: { fontSize: 10 } },
        series: [{
            type: 'bar',
            data: sortedReads.map((x, i) => ({
                value: x[1].toFixed(0),
                itemStyle: { color: colors[i % colors.length] }
            })),
            label: { show: true, position: 'right', fontSize: 10 }
        }],
        grid: { left: 80 }
    });
    
    // Top15 热读榜
    const top15 = data.slice(0, 15);
    charts.top = echarts.init(document.getElementById('chartTop'));
    charts.top.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: top15.map(d => d.书名), axisLabel: { fontSize: 10, interval: 0 } },
        series: [{
            type: 'bar',
            data: top15.map((d, i) => ({
                value: d.在读人数_万,
                itemStyle: { color: colors[i] }
            })),
            label: { show: true, position: 'right' }
        }],
        grid: { left: 150 }
    });
    
    // 评分排行
    const avgScores = cats.map(c => ({
        name: c,
        value: (categoryScore[c].sum / categoryScore[c].count).toFixed(2)
    })).sort((a, b) => b.value - a.value);
    charts.score = echarts.init(document.getElementById('chartScore'));
    charts.score.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: avgScores.map(x => x.name), axisLabel: { rotate: 30, fontSize: 9 } },
        yAxis: { type: 'value', min: 8.5, max: 10 },
        series: [{
            type: 'bar',
            data: avgScores.map((x, i) => ({
                value: x.value,
                itemStyle: { color: colors[i % colors.length] }
            })),
            label: { show: true, position: 'top', fontSize: 10 }
        }]
    });
    
    // 题材热度趋势
    charts.trend = echarts.init(document.getElementById('chartTrend'));
    charts.trend.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月'] },
        yAxis: { type: 'value' },
        series: [
            { name: '都市', type: 'line', data: [320, 380, 420, 480], smooth: true, areaStyle: { color: '#ff6b6b' } },
            { name: '玄幻', type: 'line', data: [280, 320, 350, 400], smooth: true, areaStyle: { color: '#4ecdc4' } },
            { name: '悬疑', type: 'line', data: [200, 250, 300, 380], smooth: true, areaStyle: { color: '#ffa500' } }
        ]
    });
    
    // 调整图表大小
    Object.values(charts).forEach(c => c.resize());
}

/**
 * 渲染排行列表
 */
function renderRanking() {
    let sorted = [...data];
    
    if (currentRank === 'heat') {
        sorted.sort((a, b) => b.热度 - a.热度);
    } else if (currentRank === 'score') {
        sorted.sort((a, b) => b.评分 - a.评分);
    } else if (currentRank === 'rising') {
        // 模拟飙升榜（随机排序）
        sorted.sort((a, b) => Math.random() * 100 - 50);
    }
    
    if (currentRank === 'author') {
        // 作者榜
        const authorData = {};
        data.forEach(d => {
            if (!authorData[d.作者]) {
                authorData[d.作者] = {
                    作者: d.作者,
                    作品数: 0,
                    总热度: 0,
                    均分: 0,
                    分类: d.分类
                };
            }
            authorData[d.作者].作品数++;
            authorData[d.作者].总热度 += d.热度;
            authorData[d.作者].均分 += d.评分;
        });
        
        sorted = Object.values(authorData).map(a => ({
            ...a,
            均分: (a.均分 / a.作品数).toFixed(1),
            热度: a.总热度
        }));
        sorted.sort((a, b) => b.总热度 - a.总热度);
        
        document.getElementById('rankList').innerHTML = sorted.slice(0, 20).map((a, i) => `
            <div class="book-card" onclick="filterByAuthor('${a.作者}')">
                <div class="book-main">
                    <div class="rank-badge ${i < 3 ? 'gold' : ''}">${i + 1}</div>
                    <div class="book-info">
                        <div class="book-title">${a.作者}</div>
                        <div class="book-meta">
                            <span>作品: ${a.作品数}本</span>
                            <span class="book-tag">${a.分类}</span>
                        </div>
                    </div>
                </div>
                <div class="book-stats-row">
                    <div class="book-stats">
                        <span class="book-stat reads">🔥 ${(a.总热度 / 10000).toFixed(0)}万</span>
                        <span class="book-stat score">⭐ ${a.均分}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        document.getElementById('rankList').innerHTML = sorted.map((d, i) => {
            const rankClass = i < 3 ? 'gold' : i < 10 ? 'silver' : '';
            return `
                <div class="book-card" onclick="showModal(${data.indexOf(d)})">
                    <div class="book-main">
                        <div class="rank-badge ${rankClass}">${i + 1}</div>
                        <div class="book-info">
                            <div class="book-title">
                                ${d.书名}
                                <span class="book-tag">${d.分类}</span>
                            </div>
                            <div class="book-meta"><span>👤 ${d.作者}</span></div>
                        </div>
                    </div>
                    <div class="book-stats-row">
                        <div class="book-stats">
                            <span class="book-stat reads">🔥 ${d.在读人数_万}万</span>
                            <span class="book-stat score">⭐ ${d.评分}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

/**
 * 渲染作者页
 */
function renderAuthors() {
    const authorData = {};
    data.forEach(d => {
        if (!authorData[d.作者]) {
            authorData[d.作者] = {
                作者: d.作者,
                作品数: 0,
                总热度: 0,
                均分: 0,
                分类: d.分类,
                在读人数_万: 0
            };
        }
        authorData[d.作者].作品数++;
        authorData[d.作者].总热度 += d.热度;
        authorData[d.作者].均分 += d.评分;
        authorData[d.作者].在读人数_万 += parseFloat(d.在读人数_万);
    });
    
    const sorted = Object.values(authorData).map(a => ({
        ...a,
        均分: (a.均分 / a.作品数).toFixed(1),
        在读人数_万: a.在读人数_万.toFixed(0)
    }));
    sorted.sort((a, b) => b.总热度 - a.总热度);
    
    // 作家影响力图
    charts.author = echarts.init(document.getElementById('chartAuthor'));
    charts.author.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: sorted.slice(0, 10).map(a => a.作者), axisLabel: { fontSize: 10 } },
        series: [{
            type: 'bar',
            data: sorted.slice(0, 10).map(a => ({
                value: (a.总热度 / 10000).toFixed(0),
                itemStyle: { color: '#ff6b6b' }
            })),
            label: { show: true, position: 'right' }
        }],
        grid: { left: 100 }
    });
    
    // 作者列表
    document.getElementById('authorList').innerHTML = sorted.slice(0, 15).map((a, i) => `
        <div class="book-card" onclick="filterByAuthor('${a.作者}')">
            <div class="book-main">
                <div class="rank-badge ${i < 3 ? 'gold' : ''}">${i + 1}</div>
                <div class="book-info">
                    <div class="book-title">${a.作者}</div>
                    <div class="book-meta">
                        <span>作品: ${a.作品数}本</span>
                        <span>总热度: ${(a.总热度 / 10000).toFixed(0)}万</span>
                    </div>
                </div>
            </div>
            <div class="book-stats-row">
                <div class="book-stats">
                    <span class="book-stat reads">👥 ${a.在读人数_万}万</span>
                    <span class="book-stat score">⭐ ${a.均分}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// Tab和筛选初始化
// ==========================================

/**
 * 初始化Tab切换
 */
function initTabs() {
    document.querySelectorAll('.tab, .nav-item').forEach(el => {
        el.addEventListener('click', () => {
            const tab = el.dataset.tab;
            currentTab = tab;
            
            // 更新Tab样式
            document.querySelectorAll('.tab, .nav-item').forEach(e => e.classList.remove('active'));
            document.querySelectorAll(`.tab[data-tab="${tab}"], .nav-item[data-tab="${tab}"]`).forEach(e => e.classList.add('active'));
            
            // 显示对应内容
            document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
            document.getElementById(`content-${tab}`).classList.add('active');
            
            // 渲染对应页面
            if (tab === 'chart') {
                setTimeout(renderCharts, 100);
            } else if (tab === 'rank') {
                renderRanking();
            } else if (tab === 'author') {
                renderAuthors();
            }
        });
    });
}

/**
 * 初始化筛选器
 */
function initFilters() {
    // 题材筛选
    document.querySelectorAll('#categoryChips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCat = chip.dataset.cat;
            filteredData = currentCat === 'all' ? [...data] : data.filter(d => d.分类 === currentCat);
            updateStats();
            renderList();
        });
    });
    
    // 排序筛选
    document.querySelectorAll('#sortChips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#sortChips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentSort = chip.dataset.sort;
            renderList();
        });
    });
    
    // 排行类型筛选
    document.querySelectorAll('#rankChips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#rankChips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentRank = chip.dataset.rank;
            renderRanking();
        });
    });
}

// ==========================================
// 搜索功能
// ==========================================

/**
 * 处理搜索
 */
function handleSearch() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const type = document.getElementById('searchType').value;
    
    filteredData = data.filter(d => {
        const matchKeyword = !keyword || d.书名.toLowerCase().includes(keyword) || d.作者.toLowerCase().includes(keyword);
        const matchType = type === 'all' || d.分类.includes(type);
        const matchCat = currentCat === 'all' || d.分类 === currentCat;
        return matchKeyword && matchType && matchCat;
    });
    
    updateStats();
    renderList();
}

// ==========================================
// 交互功能
// ==========================================

/**
 * 处理卡片点击
 */
function handleCardClick(id) {
    if (isCompareMode) {
        toggleCompare(id);
    } else {
        const idx = data.findIndex(d => d.id === id);
        showModal(idx);
    }
}

/**
 * 切换收藏状态
 */
function toggleLike(id) {
    const idx = likedBooks.indexOf(id);
    if (idx > -1) {
        likedBooks.splice(idx, 1);
        showToast('已取消收藏');
    } else {
        likedBooks.push(id);
        showToast('已添加收藏');
    }
    localStorage.setItem('likedBooks', JSON.stringify(likedBooks));
    renderList();
}

/**
 * 切换对比选中
 */
function toggleCompare(id) {
    const idx = compareList.indexOf(id);
    if (idx > -1) {
        compareList.splice(idx, 1);
    } else if (compareList.length < 2) {
        compareList.push(id);
    } else {
        showToast('最多只能选择2本');
        return;
    }
    
    document.getElementById('compareCount').textContent = compareList.length;
    document.getElementById('compareBar').classList.toggle('show', compareList.length > 0);
    renderList();
}

/**
 * 切换对比模式
 */
function toggleCompareMode() {
    isCompareMode = !isCompareMode;
    if (!isCompareMode) {
        compareList = [];
        document.getElementById('compareBar').classList.remove('show');
    }
    renderList();
    showToast(isCompareMode ? '已进入对比模式' : '已退出对比模式');
}

/**
 * 显示对比结果
 */
function showCompare() {
    if (compareList.length !== 2) return;
    const books = compareList.map(id => data.find(d => d.id === id));
    showToast(`对比: ${books[0].书名} vs ${books[1].书名}`);
}

/**
 * 显示详情弹窗
 */
function showModal(idx) {
    const d = data[idx];
    
    document.getElementById('modalTitle').textContent = d.书名;
    document.getElementById('modalGrid').innerHTML = `
        <div class="modal-stat">
            <div class="value">#${d.排名}</div>
            <div class="label">排名</div>
        </div>
        <div class="modal-stat">
            <div class="value">⭐ ${d.评分}</div>
            <div class="label">评分</div>
        </div>
        <div class="modal-stat">
            <div class="value">${d.在读人数_万}万</div>
            <div class="label">在读</div>
        </div>
    `;
    document.getElementById('modalDesc').textContent = d.简介;
    document.getElementById('modalTags').innerHTML = d.标签.map(t => `<span class="modal-tag">${t}</span>`).join('');
    
    document.getElementById('modal').classList.add('show');
    
    // 渲染热度趋势图
    setTimeout(() => {
        const heatChart = echarts.init(document.getElementById('heatChart'));
        heatChart.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['第1周', '第2周', '第3周', '第4周'] },
            yAxis: { type: 'value' },
            series: [{
                type: 'line',
                data: [d.在读人数_万 * 0.7, d.在读人数_万 * 0.8, d.在读人数_万 * 0.9, d.在读人数_万],
                areaStyle: { color: 'rgba(255,107,107,0.3)' },
                itemStyle: { color: '#ff6b6b' }
            }]
        });
    }, 100);
}

/**
 * 关闭弹窗
 */
function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// 弹窗点击外部关闭
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
});

/**
 * 按作者筛选
 */
function filterByAuthor(author) {
    // 切换到首页
    document.querySelector('[data-tab="home"]').click();
    document.getElementById('searchInput').value = author;
    handleSearch();
    showToast(`已筛选作者: ${author}`);
}

/**
 * 导出数据为CSV
 */
function exportData() {
    const csv = ['排名,书名,作者,分类,热度,评分,在读人数'].concat(
        filteredData.map(d => `${d.排名},${d.书名},${d.作者},${d.分类},${d.热度},${d.评分},${d.在读人数_万}万`)
    ).join('\n');
    
    // 添加BOM以支持Excel正确显示中文
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '番茄小说热榜.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('导出成功！');
}

/**
 * 切换视图模式
 */
function changeView(type) {
    document.querySelectorAll('.list-action').forEach(a => a.classList.remove('active'));
    event.target.classList.add('active');
}

// ==========================================
// 工具函数
// ==========================================

/**
 * 显示Toast提示
 */
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// ==========================================
// 启动应用
// ==========================================

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 窗口大小改变时调整图表
window.addEventListener('resize', () => {
    Object.values(charts).forEach(c => c && c.resize());
});
