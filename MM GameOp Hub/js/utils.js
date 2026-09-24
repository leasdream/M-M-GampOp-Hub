/* ============================================================
 * 工具函数：日期、状态映射、统计计算等
 * ============================================================ */
(function () {
  const App = window.App;
  const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // 转义用户输入，避免特殊字符破坏页面（基础的安全习惯）
  App.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  App.parseDate = function (iso) {
    return new Date(iso + 'T00:00:00');
  };

  // 距离今天还有几天（负数表示已过去几天）
  App.diffDays = function (iso) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((App.parseDate(iso) - today) / 86400000);
  };

  App.fmtDate = function (iso) {
    const d = App.parseDate(iso);
    const md = `${d.getMonth() + 1}月${d.getDate()}日`;
    return { md, week: WEEK[d.getDay()], full: `${md} ${WEEK[d.getDay()]}` };
  };

  // 短日期：9/25
  App.fmtShort = function (iso) {
    const d = App.parseDate(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // “关联节点”单元格：节点日期（M/D）+ 节点名称
  // 并对比任务截止日与节点日，给出排布风险提示（更晚=红色风险）
  App.nodeRefCell = function (task) {
    const node = App.nodeById(task.nodeId);
    if (!node) return '<span class="muted">—</span>';
    let delta = '';
    if (task.status !== 'done') {
      const gap = App.diffDays(task.date) - App.diffDays(node.date);
      if (gap > 0) delta = `<div class="node-delta tone-red">截止晚于节点 ${gap} 天</div>`;
      else if (gap === 0) delta = '<div class="node-delta tone-amber">节点当天截止</div>';
    }
    return `
      <div>
        <div class="node-ref">
          <span class="node-date">${App.fmtShort(node.date)}</span>
          <span class="node-ref-name">${App.esc(node.name)}</span>
        </div>
        ${delta}
      </div>`;
  };

  // 任务截止日期的展示信息（含逾期 / 即将到期判定）
  App.dueLabel = function (task) {
    const diff = App.diffDays(task.date);
    if (task.status === 'done') {
      return { tone: 'neutral', text: App.fmtDate(task.date).full, warn: false };
    }
    if (diff < 0) return { tone: 'red', text: `已逾期 ${-diff} 天`, warn: 'overdue' };
    if (diff === 0) return { tone: 'red', text: '今天截止', warn: 'today' };
    if (diff === 1) return { tone: 'amber', text: '明天截止', warn: 'soon' };
    if (diff === 2) return { tone: 'amber', text: '后天截止', warn: 'soon' };
    return { tone: 'neutral', text: App.fmtDate(task.date).full, warn: false };
  };

  App.nodeById = function (id) {
    return App.state.nodes.find((n) => n.id === id);
  };

  // 节点任务进度
  App.nodeProgress = function (nodeId) {
    const ts = App.state.tasks.filter((t) => t.nodeId === nodeId);
    const total = ts.length;
    const done = ts.filter((t) => t.status === 'done').length;
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
  };

  // 全项目任务数量统计
  App.taskStats = function () {
    const s = { todo: 0, in_progress: 0, done: 0, blocked: 0, dueSoon: 0 };
    App.state.tasks.forEach((t) => {
      s[t.status] += 1;
      if (t.status !== 'done' && App.diffDays(t.date) <= 2) s.dueSoon += 1;
    });
    return s;
  };

  // —— 各类枚举与配色（tone 对应 CSS 里的 .tone-* 样式）——
  App.statusMeta = {
    todo:        { label: '待处理', tone: 'neutral' },
    in_progress: { label: '进行中', tone: 'blue' },
    done:        { label: '已完成', tone: 'green' },
    blocked:     { label: '已阻塞', tone: 'red' },
  };

  App.priorityMeta = {
    P0: { label: 'P0 紧急', tone: 'red' },
    P1: { label: 'P1 高',   tone: 'amber' },
    P2: { label: 'P2 普通', tone: 'neutral' },
  };

  App.riskMeta = {
    normal: { label: '正常', tone: 'green' },
    watch:  { label: '关注', tone: 'amber' },
    risk:   { label: '风险', tone: 'red' },
  };

  // 按类型名称查询徽章颜色（类型可自定义，查不到时用中性灰）
  App.nodeTypeTone = function (name) {
    const t = App.state.nodeTypes.find((x) => x.name === name);
    return t ? t.tone : 'neutral';
  };
})();
