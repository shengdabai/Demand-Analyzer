const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

function loadAnalyzer() {
    const elements = new Map();
    function createElement(tagName) {
        return {
            tagName, style: {}, children: [], textContent: '',
            addEventListener() {},
            appendChild(child) { this.children.push(child); },
            replaceChildren(...children) { this.children = children; },
            set innerHTML(value) { throw new Error('HTML parsing is not allowed'); }
        };
    }
    const document = {
        addEventListener() {},
        createElement,
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, createElement('div'));
            return elements.get(id);
        }
    };
    const context = vm.createContext({ document });
    vm.runInContext(readFileSync(join(__dirname, '../script.js'), 'utf8') + '\nthis.Analyzer = DemandAnalyzer;', context);
    return { analyzer: new context.Analyzer(), document };
}

test('34/34 essential need fills exactly 100% of the bar', () => {
    const { analyzer, document } = loadAnalyzer();
    analyzer.displayAnalysisCard('essential-need', { score: 34, points: [] });
    assert.equal(document.getElementById('essential-need-score').style.width, '100%');
});

test('33-point dimensions retain their own scale', () => {
    const { analyzer, document } = loadAnalyzer();
    for (const type of ['high-frequency', 'wide-reach']) {
        analyzer.displayAnalysisCard(type, { score: 33, points: [] });
        assert.equal(document.getElementById(`${type}-score`).style.width, '100%');
    }
});

test('empty and duplicate target groups do not earn diversity points', () => {
    const { analyzer } = loadAnalyzer();
    for (const users of ['甲，，', '甲,  ,', '甲、甲、甲', ' ，、 ']) {
        assert.equal(analyzer.analyzeWideReach('', users, '').score, 0, users);
    }
});

test('three distinct target groups earn diversity points', () => {
    const { analyzer } = loadAnalyzer();
    assert.equal(analyzer.analyzeWideReach('', '甲、乙, 丙', '').score, 8);
});

test('market size affects reach only and scores stay within 100', () => {
    const { analyzer } = loadAnalyzer();
    const small = analyzer.performAnalysis('工具', '每天学习，解决基础问题，提高效率', '学生', 'small');
    const huge = analyzer.performAnalysis('工具', '每天学习，解决基础问题，提高效率', '学生', 'huge');
    assert.equal(small.highFrequency.score, huge.highFrequency.score);
    assert.equal(small.essentialNeed.score, huge.essentialNeed.score);
    assert.ok(huge.total <= 100);
    assert.ok(huge.wideReach.score >= small.wideReach.score);
});

test('unknown market sizes, including inherited property names, earn no points', () => {
    const { analyzer } = loadAnalyzer();
    for (const marketSize of ['', 'unknown', 'toString', 'constructor', '__proto__']) {
        const result = analyzer.performAnalysis('工具', '描述', '', marketSize);
        assert.equal(result.total, 0, marketSize);
        assert.equal(result.wideReach.points.length, 0, marketSize);
    }
    for (const [marketSize, score] of Object.entries({ small: 5, medium: 15, large: 25, huge: 33 })) {
        assert.equal(analyzer.analyzeWideReach('', '', marketSize).score, score);
    }
});

test('analysis points render markup as literal text and replace previous results', () => {
    const { analyzer, document } = loadAnalyzer();
    const payload = '<img src=x onerror=alert(1)> & <script>alert(2)</script>';
    analyzer.displayAnalysisCard('wide-reach', { score: 0, points: [payload] });
    const container = document.getElementById('wide-reach-points');
    assert.equal(container.children.length, 1);
    const [list] = container.children;
    assert.equal(list.tagName, 'ul');
    assert.equal(list.children[0].tagName, 'li');
    assert.equal(list.children[0].textContent, payload);
    assert.equal(list.children[0].children.length, 0);
    analyzer.displayAnalysisCard('wide-reach', { score: 0, points: [] });
    assert.equal(container.children.length, 1);
    assert.equal(container.children[0].children.length, 0);
});

test('optimization titles and descriptions render as text and clear stale suggestions', () => {
    const { analyzer, document } = loadAnalyzer();
    const title = '<svg onload=alert(1)>';
    const description = '<a href="javascript:alert(2)">click</a>';
    analyzer.displayOptimizations([{ title, description }]);
    const container = document.getElementById('optimization-list');
    assert.equal(container.children.length, 1);
    const [suggestion] = container.children;
    assert.equal(suggestion.className, 'suggestion-item');
    assert.equal(suggestion.children[0].tagName, 'h4');
    assert.equal(suggestion.children[0].textContent, title);
    assert.equal(suggestion.children[1].tagName, 'p');
    assert.equal(suggestion.children[1].textContent, description);
    analyzer.displayOptimizations([]);
    assert.equal(container.children.length, 0);
});
