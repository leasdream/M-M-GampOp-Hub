/* ============================================================
 * 页面 1：项目总览
 * ============================================================ */
(function () {
  const App = window.App;
  App.pages = App.pages || {};

  App.pages.overview = {
    render() {
      const stats = App.taskStats();
      const total = App.state.tasks.length;
      const overallPct = total ? Math.round((stats.done / total) * 100) : 0;

      // 项目时间范围取全部节点的最早 / 最晚日期
      const dates = App.state.nodes.map((n) => n.date).sort();
      const range = `${App.fmtDate(dates[0]).md} - ${App.fmtDate(dates[dates.length - 1]).md}`;

      // 近期活动节点（未开始，按日期升序，最多 5 个）
      const upcoming = App.state.nodes
        .filter((n) => App.diffDays(n.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);

      // 近期任务：未完成优先，按截止日期升序，最多 7 条
      const recent = App.state.tasks
        .slice()
        .sort((a, b) => {
          const rank = (t) => (t.status === 'done' ? 1 : 0);
          return rank(a) - rank(b) || a.date.localeCompare(b.date);
        })
        .slice(0, 7);

      const statCards = [
        { key: 'todo',        label: '待处理任务', icon: 'inbox',        tone: 'neutral', sub: '等待启动' },
        { key: 'in_progress', label: '进行中',     icon: 'clock',        tone: 'blue',    sub: '正在推进' },
        { key: 'done',        label: '已完成',     icon: 'check-circle', tone: 'green',   sub: `整体完成率 ${overallPct}%` },
        { key: 'dueSoon',     label: '即将逾期',   icon: 'alert',        tone: 'red',     sub: '48 小时内到期或已逾期' },
      ];

      return `
        <div class="page-head">
          <div>
            <h1>项目总览</h1>
            <p class="page-desc">掌握周年庆版本的整体进度、关键节点与任务风险</p>
          </div>
        </div>

        <!-- 当前项目横幅 -->
        <section class="project-hero">
          <div>
            <span class="hero-badge">${App.icon('layers', 13)}当前项目</span>
            <h2>V40周年庆版本</h2>
            <p class="hero-desc">年度最大版本：全新周年主城、限定角色卡池、登录福利与系列社区活动，覆盖预热、上线到长尾运营全周期。</p>
            <div class="hero-meta">
              <span>${App.icon('calendar')}${range}</span>
              <span>${App.icon('user')}版本负责人 · 林晓</span>
              <span>${App.badge('风险关注', 'amber')}</span>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-percent">${overallPct}<small>%</small></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${overallPct}%"></div></div>
            <div class="hero-sub">任务完成 ${stats.done}/${total}</div>
          </div>
        </section>

        <!-- 任务统计 -->
        <section class="stat-grid">
          ${statCards
            .map(
              (c) => `
            <div class="stat-card">
              <div class="stat-top">
                <span class="stat-label">${c.label}</span>
                <span class="stat-icon tone-${c.tone}">${App.icon(c.icon, 16)}</span>
              </div>
              <div class="stat-value">${stats[c.key]}</div>
              <div class="stat-sub">${c.sub}</div>
            </div>`
            )
            .join('')}
        </section>

        <!-- 活动节点 -->
        <section class="section-block">
          <div class="section-head">
            <h3 class="section-title">活动节点</h3>
            <div class="section-actions">
              <a class="link-more" href="#/nodes">全部节点 ${App.icon('chevron-right')}</a>
              <button class="btn btn-sm" id="btn-new-node">${App.icon('plus', 14)}新建节点</button>
            </div>
          </div>
          <div class="milestone-grid">
            ${upcoming.map(this.milestoneCard).join('')}
          </div>
        </section>

        <!-- 近期任务 -->
        <section class="section-block">
          <div class="section-head">
            <h3 class="section-title">近期任务</h3>
            <div class="section-actions">
              <a class="link-more" href="#/tasks">全部任务 ${App.icon('chevron-right')}</a>
              <button class="btn btn-sm" id="btn-new-task">${App.icon('plus', 14)}新建任务</button>
            </div>
          </div>
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>任务名称</th>
                    <th>关联节点</th>
                    <th>截止日期</th>
                    <th>优先级</th>
                    <th>状态</th>
                    <th>负责人</th>
                    <th class="col-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${recent.map(this.taskRow).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      `;
    },

    milestoneCard(n) {
      const d = App.fmtDate(n.date);
      const diff = App.diffDays(n.date);
      const rm = App.riskMeta[n.risk];
      let away = { text: `${diff} 天后`, tone: '' };
      if (diff === 0) away = { text: '今天', tone: 'tone-violet' };
      else if (diff === 1) away = { text: '明天', tone: 'tone-blue' };
      else if (diff === 2) away = { text: '后天', tone: 'tone-amber' };
      return `
        <div class="milestone ${diff === 0 ? 'is-today' : ''}">
          <div class="m-actions">
            <button class="icon-btn icon-btn-sm" title="编辑节点" data-edit="node:${n.id}">${App.icon('edit', 13)}</button>
            <button class="icon-btn icon-btn-sm danger" title="删除节点" data-delete="node:${n.id}">${App.icon('trash', 13)}</button>
          </div>
          <div class="m-date-row">
            <span class="m-date">${d.md.replace(/月(\d+)日/, '/$1')}</span>
            <span class="m-month">${d.week}</span>
          </div>
          <div class="m-name">${App.esc(n.name)}</div>
          <div class="m-foot">
            <span class="m-badges">
              ${App.badge(n.type, App.nodeTypeTone(n.type), false)}
              ${n.risk === 'normal' ? '' : App.badge(rm.label, rm.tone, false)}
            </span>
            <span class="away-chip ${away.tone}">${away.text}</span>
          </div>
        </div>`;
    },

    mount(root) {
      root.querySelector('#btn-new-node').onclick = function () {
        App.openCreateForm('node');
      };
      root.querySelector('#btn-new-task').onclick = function () {
        App.openCreateForm('task');
      };
      App.bindEntityActions(root);
    },

    taskRow(t) {
      const dl = App.dueLabel(t);
      const sm = App.statusMeta[t.status];
      const pm = App.priorityMeta[t.priority];
      return `
        <tr>
          <td><div class="task-title">${t.status === 'blocked' ? App.icon('alert') : ''}${App.esc(t.title)}</div></td>
          <td>${App.nodeRefCell(t)}</td>
          <td>
            <div class="due-date ${dl.warn ? 'tone-' + dl.tone : ''}">${App.fmtDate(t.date).full}</div>
            ${dl.warn ? `<div class="due-sub tone-${dl.tone}">${dl.text}</div>` : ''}
          </td>
          <td>${App.badge(pm.label, pm.tone, false)}</td>
          <td>${App.badge(sm.label, sm.tone)}</td>
          <td>${App.ownerCell(t.owner)}</td>
          <td class="col-actions">${App.actionButtons('task', t.id)}</td>
        </tr>`;
    },
  };
})();
