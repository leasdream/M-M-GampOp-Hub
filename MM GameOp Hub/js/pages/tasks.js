/* ============================================================
 * 页面 3：我的任务
 * ============================================================ */
(function () {
  const App = window.App;
  App.pages = App.pages || {};

  App.pages.tasks = {
    filter: 'all',

    render() {
      const counts = {
        all: App.state.tasks.length,
        todo: 0,
        in_progress: 0,
        done: 0,
        blocked: 0,
      };
      App.state.tasks.forEach((t) => {
        counts[t.status] += 1;
      });

      const tabs = [
        { key: 'all', label: '全部' },
        { key: 'todo', label: '待处理' },
        { key: 'in_progress', label: '进行中' },
        { key: 'done', label: '已完成' },
        { key: 'blocked', label: '已阻塞' },
      ];

      const rows = App.state.tasks
        .filter((t) => this.filter === 'all' || t.status === this.filter)
        .sort((a, b) => {
          // 未完成在前，再按截止日期升序
          const rank = (t) => (t.status === 'done' ? 1 : 0);
          return rank(a) - rank(b) || a.date.localeCompare(b.date);
        });

      return `
        <div class="page-head">
          <div>
            <h1>我的任务</h1>
            <p class="page-desc">追踪任务状态与截止风险，可直接在“状态”列切换进度</p>
          </div>
          <button class="btn btn-primary" id="btn-new-task">${App.icon('plus')}新建任务</button>
        </div>

        <div class="tabbar">
          ${tabs
            .map(
              (t) => `
            <button class="tab ${this.filter === t.key ? 'active' : ''}" data-status="${t.key}">
              ${t.label}<span class="count">${counts[t.key]}</span>
            </button>`
            )
            .join('')}
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
                  <th>任务状态</th>
                  <th>负责人</th>
                  <th class="col-actions">操作</th>
                </tr>
              </thead>
              <tbody>
                ${rows.length ? rows.map(this.rowHtml).join('') : `<tr><td colspan="7" class="table-empty">当前分类下没有任务</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    rowHtml(t) {
      const page = App.pages.tasks;
      const dl = App.dueLabel(t);
      const pm = App.priorityMeta[t.priority];
      const sm = App.statusMeta[t.status];

      const rowClass =
        dl.warn === 'overdue' || dl.warn === 'today'
          ? 'row-overdue'
          : dl.warn === 'soon'
          ? 'row-soon'
          : '';

      const statusOptions = Object.keys(App.statusMeta)
        .map(
          (k) =>
            `<option value="${k}" ${k === t.status ? 'selected' : ''}>${App.statusMeta[k].label}</option>`
        )
        .join('');

      return `
        <tr class="${rowClass}">
          <td><div class="task-title">${t.status === 'blocked' ? App.icon('alert') : ''}${App.esc(t.title)}</div></td>
          <td>${App.nodeRefCell(t)}</td>
          <td>
            <div class="due-date ${dl.warn ? 'tone-' + dl.tone : ''}">${App.fmtDate(t.date).full}</div>
            ${dl.warn ? `<div class="due-sub tone-${dl.tone}">${dl.text}</div>` : ''}
          </td>
          <td>${App.badge(pm.label, pm.tone, false)}</td>
          <td>
            <select class="status-select tone-${sm.tone}" data-task-id="${t.id}">${statusOptions}</select>
          </td>
          <td>${App.ownerCell(t.owner)}</td>
          <td class="col-actions">${App.actionButtons('task', t.id)}</td>
        </tr>`;
    },

    mount(root) {
      const page = this;

      // 新建任务（手动 / 导入）
      root.querySelector('#btn-new-task').onclick = function () {
        App.openCreateForm('task');
      };

      // 行内编辑 / 删除
      App.bindEntityActions(root);

      // 状态筛选
      root.querySelectorAll('.tab').forEach((tab) => {
        tab.onclick = function () {
          page.filter = tab.dataset.status;
          App.rerender();
        };
      });

      // 内联修改任务状态
      root.querySelectorAll('.status-select').forEach((sel) => {
        sel.onchange = function () {
          const task = App.state.tasks.find((t) => t.id === sel.dataset.taskId);
          if (task) {
            task.status = sel.value;
            App.rerender();
            App.updateNavBadge();
            App.toast(`任务已标记为「${App.statusMeta[sel.value].label}」`);
          }
        };
      });
    },
  };
})();
