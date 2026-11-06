class DemandAnalyzer {
    constructor() {
        this.initializeEventListeners();
        this.keywords = {
            highFrequency: {
                daily: ['每天', '日常', '每日', '频繁', '经常', '重复', '习惯', '定时', '周期', '规律'],
                weekly: ['每周', '周常', '定期', '周期性', '反复'],
                monthly: ['每月', '月度', '按月', '月常']
            },
            wideReach: {
                universal: ['所有人', '全民', '通用', '普适', '大众', '广泛', '普遍', '全年龄段'],
                demographic: ['学生', '上班族', '职场', '家庭', '老人', '儿童', '青少年', '中年人', '专业人士'],
                geographic: ['全国', '全球', '国际', '城市', '农村', '线上线下']
            },
            essentialNeed: {
                basic: ['必需', '必要', '必须', '基础', '核心', '关键', '重要', '不可或缺'],
                problem: ['痛点', '困难', '问题', '挑战', '障碍', '麻烦', '困扰'],
                emotion: ['焦虑', '压力', '担忧', '恐惧', '渴望', '需求', '追求', '期望']
            }
        };
        this.marketSizeScores = {
            small: 5,
            medium: 15,
            large: 25,
            huge: 33
        };
    }

    initializeEventListeners() {
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzeDemand());

        // 添加回车键支持
        document.getElementById('demand-title').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.analyzeDemand();
        });
        document.getElementById('demand-description').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) this.analyzeDemand();
        });
    }

    analyzeDemand() {
        const title = document.getElementById('demand-title').value.trim();
        const description = document.getElementById('demand-description').value.trim();
        const targetUsers = document.getElementById('target-users').value.trim();
        const marketSize = document.getElementById('market-size').value;

        if (!title || !description) {
            this.showNotification('请填写需求标题和描述', 'error');
            return;
        }

        const analysis = this.performAnalysis(title, description, targetUsers, marketSize);
        this.displayResults(analysis);
    }

    performAnalysis(title, description, targetUsers, marketSize) {
        const fullText = `${title} ${description} ${targetUsers}`.toLowerCase();

        const highFrequency = this.analyzeHighFrequency(fullText, marketSize);
        const wideReach = this.analyzeWideReach(fullText, targetUsers, marketSize);
        const essentialNeed = this.analyzeEssentialNeed(fullText);

        const totalScore = highFrequency.score + wideReach.score + essentialNeed.score;
        const recommendation = this.generateRecommendation(totalScore, highFrequency, wideReach, essentialNeed);
        const optimizations = this.generateOptimizations(highFrequency, wideReach, essentialNeed);

        return {
            total: totalScore,
            highFrequency,
            wideReach,
            essentialNeed,
            recommendation,
            optimizations
        };
    }

    analyzeHighFrequency(text, marketSize) {
        let score = 0;
        let points = [];
        let matches = [];

        // 检查频率关键词
        Object.entries(this.keywords.highFrequency).forEach(([level, keywords]) => {
            const found = keywords.filter(keyword => text.includes(keyword));
            if (found.length > 0) {
                matches.push(...found);
                switch (level) {
                    case 'daily':
                        score += 25;
                        points.push('✓ 包含日常使用频率关键词');
                        break;
                    case 'weekly':
                        score += 15;
                        points.push('✓ 包含周期性使用频率关键词');
                        break;
                    case 'monthly':
                        score += 8;
                        points.push('✓ 包含月度使用频率关键词');
                        break;
                }
            }
        });

        // 市场规模不证明使用频率；只在广度维度计分。

        // 检查场景高频性
        const dailyScenarios = ['通勤', '工作', '学习', '生活', '用餐', '购物', '娱乐'];
        const foundScenarios = dailyScenarios.filter(scenario => text.includes(scenario));
        if (foundScenarios.length > 0) {
            score += 5;
            points.push(`✓ 涉及高频使用场景: ${foundScenarios.join(', ')}`);
        }

        // 检查重复性行为
        if (text.includes('重复') || text.includes('反复') || text.includes('循环')) {
            score += 3;
            points.push('✓ 具有重复性行为特征');
        }

        score = Math.min(score, 33);

        return {
            score,
            points,
            matches
        };
    }

    analyzeWideReach(text, targetUsers, marketSize) {
        let score = 0;
        let points = [];
        let matches = [];

        // 检查广泛性关键词
        Object.entries(this.keywords.wideReach).forEach(([category, keywords]) => {
            const found = keywords.filter(keyword => text.includes(keyword));
            if (found.length > 0) {
                matches.push(...found);
                switch (category) {
                    case 'universal':
                        score += 25;
                        points.push('✓ 具有普适性特征');
                        break;
                    case 'demographic':
                        score += 15;
                        points.push(`✓ 覆盖特定人群: ${found.join(', ')}`);
                        break;
                    case 'geographic':
                        score += 10;
                        points.push(`✓ 地域覆盖广泛: ${found.join(', ')}`);
                        break;
                }
            }
        });

        // 市场规模加分
        if (marketSize && this.marketSizeScores[marketSize]) {
            score += this.marketSizeScores[marketSize];
            points.push(`✓ 市场规模加分 (+${this.marketSizeScores[marketSize]}分)`);
        }

        // 分析目标用户群体
        if (targetUsers) {
            const userCount = new Set(targetUsers.split(/[，,、]/)
                .map(user => user.trim()).filter(Boolean)).size;
            if (userCount > 2) {
                score += 8;
                points.push('✓ 目标用户群体多元化');
            }
        }

        // 检查平台无关性
        if (text.includes('多平台') || text.includes('跨平台') || text.includes('全平台')) {
            score += 5;
            points.push('✓ 支持多平台使用');
        }

        score = Math.min(score, 33);

        return {
            score,
            points,
            matches
        };
    }

    analyzeEssentialNeed(text) {
        let score = 0;
        let points = [];
        let matches = [];

        // 检查刚需关键词
        Object.entries(this.keywords.essentialNeed).forEach(([category, keywords]) => {
            const found = keywords.filter(keyword => text.includes(keyword));
            if (found.length > 0) {
                matches.push(...found);
                switch (category) {
                    case 'basic':
                        score += 20;
                        points.push('✓ 具有基础必要性特征');
                        break;
                    case 'problem':
                        score += 15;
                        points.push(`✓ 解决特定问题: ${found.join(', ')}`);
                        break;
                    case 'emotion':
                        score += 12;
                        points.push(`✓ 满足情感需求: ${found.join(', ')}`);
                        break;
                }
            }
        });

        // 检查解决方案必要性
        if (text.includes('替代') || text.includes('解决') || text.includes('改善')) {
            score += 8;
            points.push('✓ 提供替代性解决方案');
        }

        // 检查成本效益
        if (text.includes('省钱') || text.includes('效率') || text.includes('时间') || text.includes('成本')) {
            score += 6;
            points.push('✓ 具有成本效益优势');
        }

        score = Math.min(score, 34);

        return {
            score,
            points,
            matches
        };
    }

    generateRecommendation(totalScore, highFrequency, wideReach, essentialNeed) {
        if (totalScore >= 80) {
            return {
                level: '优秀',
                text: '这是一个非常优秀的市场需求！具备高频、广泛、刚需的核心特征，建议优先投入开发。',
                color: '#10b981'
            };
        } else if (totalScore >= 60) {
            return {
                level: '良好',
                text: '这是一个不错的市场需求，但在某些方面还有提升空间。建议根据优化建议进行调整。',
                color: '#3b82f6'
            };
        } else if (totalScore >= 40) {
            return {
                level: '一般',
                text: '这个市场需求有一定的潜力，但需要在核心要素上进一步加强。建议仔细分析优化建议。',
                color: '#f59e0b'
            };
        } else {
            return {
                level: '需改进',
                text: '这个市场需求还需要进一步完善。建议重新审视需求的核心价值主张。',
                color: '#ef4444'
            };
        }
    }

    generateOptimizations(highFrequency, wideReach, essentialNeed) {
        const optimizations = [];

        if (highFrequency.score < 20) {
            optimizations.push({
                title: '提升使用频率',
                description: '考虑如何让用户更频繁地使用产品，如添加日常任务、习惯养成功能或周期性提醒。'
            });
        }

        if (wideReach.score < 20) {
            optimizations.push({
                title: '扩大用户覆盖',
                description: '思考如何让产品适用于更多用户群体，如简化使用门槛、支持多语言或多平台。'
            });
        }

        if (essentialNeed.score < 20) {
            optimizations.push({
                title: '强化刚需属性',
                description: '深入挖掘用户的真正痛点，确保产品解决的是用户无法回避的核心问题。'
            });
        }

        if (highFrequency.score > 25 && wideReach.score > 25) {
            optimizations.push({
                title: '构建网络效应',
                description: '考虑如何让用户之间的互动产生网络效应，进一步提升产品的价值和粘性。'
            });
        }

        optimizations.push({
            title: '差异化竞争',
            description: '分析市场上现有解决方案，找到独特的差异化优势，避免同质化竞争。'
        });

        return optimizations;
    }

    displayResults(analysis) {
        const resultsSection = document.getElementById('results-section');
        resultsSection.style.display = 'block';

        // 显示总体评分
        document.getElementById('total-score').textContent = analysis.total;

        // 显示建议
        const recommendation = analysis.recommendation;
        document.getElementById('recommendation-text').textContent = recommendation.text;
        document.getElementById('recommendation-text').style.color = recommendation.color;

        // 显示各项分析结果
        this.displayAnalysisCard('high-frequency', analysis.highFrequency);
        this.displayAnalysisCard('wide-reach', analysis.wideReach);
        this.displayAnalysisCard('essential-need', analysis.essentialNeed);

        // 显示优化建议
        this.displayOptimizations(analysis.optimizations);

        // 滚动到结果区域
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayAnalysisCard(type, analysis) {
        const prefix = type === 'high-frequency' ? 'high-frequency' :
                      type === 'wide-reach' ? 'wide-reach' : 'essential-need';

        document.getElementById(`${prefix}-value`).textContent = analysis.score;

        const scoreFill = document.getElementById(`${prefix}-score`);
        const maxScore = prefix === 'essential-need' ? 34 : 33;
        scoreFill.style.width = `${(analysis.score / maxScore) * 100}%`;

        const pointsContainer = document.getElementById(`${prefix}-points`);
        pointsContainer.innerHTML = '<ul>' + analysis.points.map(point => `<li>${point}</li>`).join('') + '</ul>';
    }

    displayOptimizations(optimizations) {
        const container = document.getElementById('optimization-list');
        container.innerHTML = optimizations.map(opt => `
            <div class="suggestion-item">
                <h4>${opt.title}</h4>
                <p>${opt.description}</p>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // 设置样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        // 设置颜色
        const colors = {
            info: '#3b82f6',
            error: '#ef4444',
            success: '#10b981'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new DemandAnalyzer();
});
