const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

function loadAnalyzer() {
    const elements = new Map();
    const document = {
        addEventListener() {},
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, { style: {}, addEventListener() {} });
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
