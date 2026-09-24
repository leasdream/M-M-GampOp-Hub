/* ============================================================
 * 页面 2：节点管理
 * ============================================================ */
(function () {
  const App = window.App;
  App.pages = App.pages || {};

  App.pages.nodes = {
    filter: '全部',

    render() {
      const types = ['全部'].concat(App.NODE_TYPES);
      const rows = App.state.nodes
        .filter((n) => this.filter === '全部' || n.type === this.filter)
        .sort((a, b) => a.date.localeCompare(b.date));

      return `
        <div class="page-head">
          <div>
            <h1>节点管理</h1>
            <p class="page-desc">统一管理各类版本与活动节点，节点类型也可以自定义</p>
          </div>
          <div class="section-actions">
            <button class="btn" id="btn-manage-types">${App.icon('layers', 15)}类型管理</button>
            <button class="btn btn-primary" id="btn-new-node">${App.icon('plus')}新建节点</button>
          </div>
        </div>

        <div class="chip-row">
          ${types
            .map(
              (t) =>
                `<button class="chip ${t === this.filter ? 'active' : ''}" data-type="${App.esc(t)}">${App.esc(t)}</button>`
            )
            .join('')}
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>节点名称</th>
                  <th>日期</th>
                  <th>类型</th>
                  <th>负责人</th>
                  <th style="min-width:200px">任务完成进度</th>
                  <th>风险状态</th>
                  <th class="col-actions">操作</th>
                </tr>
              </thead>
              <tbody>
                ${rows.length ? rows.map(this.rowHtml).join('') : `<tr><td colspan="7" class="table-empty">该类型下暂无节点</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    rowHtml(n) {
      const p = App.nodeProgress(n.id);
      const rm = App.riskMeta[n.risk];
      return `
        <tr>
          <td><div class="node-name">${App.icon('flag')}<span>${App.esc(n.name)}</span></div></td>
          <td class="muted" style="white-space:nowrap">${App.fmtDate(n.date).full}</td>
          <td>${App.badge(n.type, App.nodeTypeTone(n.type), false)}</td>
          <td>${App.ownerCell(n.owner)}</td>
          <td>${App.progressBar(p)}</td>
          <td>${App.badge(rm.label, rm.tone)}</td>
          <td class="col-actions">${App.actionButtons('node', n.id)}</td>
        </tr>`;
    },

    mount(root) {
      const page = this;
      root.querySelector('#btn-new-node').onclick = function () {
        App.openCreateForm('node', {
          onCreated() {
            page.filter = '全部';
          },
        });
      };
      root.querySelector('#btn-manage-types').onclick = function () {
        App.openTypeManager({
          onChanged() {
            page.filter = '全部';
          },
        });
      };
      root.querySelectorAll('.chip').forEach((btn) => {
        btn.onclick = function () {
          page.filter = btn.dataset.type;
          App.rerender();
        };
      });
      App.bindEntityActions(root);
    },
  };
})();
