/* ============================================================
 * 节点 / 任务的增删改
 * - 新建：手动填写 / 上传 Excel·Word 文档“识别”导入（纯前端模拟）
 * - 编辑：复用同一套表单，预填后保存（id 不变，关联关系不断）
 * - 删除：二次确认；删除节点时可选是否一并删除其下任务
 * ============================================================ */
(function () {
  const App = window.App;
  const ACCEPT = '.xlsx,.xls,.csv,.doc,.docx';

  // —— 模拟“文档识别”出来的记录（正式版将由解析服务返回同样结构的数据）——
  function mockNodeRecords() {
    return [
      { name: '周年庆限时双倍掉落', date: App.dateOffset(10), type: '活动预热', owner: '赵宇', risk: 'normal' },
      { name: '国庆主题周登录福利',   date: App.dateOffset(13), type: '活动预热', owner: '苏晴', risk: 'normal' },
      { name: '十月版本社区共创计划', date: App.dateOffset(16), type: '社区活动', owner: '李雯', risk: 'watch' },
    ];
  }

  function mockTaskRecords() {
    return [
      { title: '双倍掉落活动数值配置与联调', nodeId: 'n7', date: App.dateOffset(9),  priority: 'P1', status: 'todo', owner: '赵宇' },
      { title: '主题周福利邮件模板制作',     nodeId: 'n7', date: App.dateOffset(11), priority: 'P2', status: 'todo', owner: '李雯' },
      { title: '共创计划活动页需求评审',     nodeId: 'n8', date: App.dateOffset(12), priority: 'P1', status: 'todo', owner: '李雯' },
    ];
  }

  function uid(prefix, i) {
    return `${prefix}-${Date.now().toString(36)}-${i}`;
  }

  /* ============================================================
   * 通用表单弹窗（新建 / 编辑）
   * opts: { mode: 'create'|'edit', item: 编辑对象, onChanged: 保存成功后回调 }
   * ============================================================ */
  function openEntityForm(kind, opts) {
    opts = opts || {};
    const isNode = kind === 'node';
    const label = isNode ? '节点' : '任务';
    const isEdit = opts.mode === 'edit';
    const item = opts.item || null;

    let tab = 'manual';              // manual | import（仅新建可用）
    let parsed = [];
    let selected = new Set();
    let recognizeTimer = null;

    /* ---------- 手动填写 / 编辑表单 ---------- */
    function manualBody() {
      if (isNode) {
        const v = item || {};
        const riskVal = v.risk || 'normal';
        return `
          <div class="field">
            <label>节点名称<i>*</i></label>
            <input class="input" id="f-name" maxlength="30" placeholder="例如：周年庆限时双倍掉落" value="${App.esc(v.name || '')}" />
          </div>
          <div class="form-row">
            <div class="field">
              <label>节点日期</label>
              <input class="input" type="date" id="f-date" value="${v.date || App.dateOffset(7)}" />
            </div>
            <div class="field">
              <label>节点类型</label>
              <select class="select" id="f-type">
                ${App.NODE_TYPES.map((t) => `<option ${v.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>负责人</label>
              <input class="input" id="f-owner" value="${App.esc(v.owner || '运营同学')}" maxlength="10" />
            </div>
            <div class="field">
              <label>风险状态</label>
              <select class="select" id="f-risk">
                <option value="normal" ${riskVal === 'normal' ? 'selected' : ''}>正常</option>
                <option value="watch" ${riskVal === 'watch' ? 'selected' : ''}>关注</option>
                <option value="risk" ${riskVal === 'risk' ? 'selected' : ''}>风险</option>
              </select>
            </div>
          </div>`;
      }

      // 任务：关联节点下拉按日期排序；新建默认选最近的未来节点，编辑选当前关联节点
      const sortedNodes = App.state.nodes.slice().sort((a, b) => a.date.localeCompare(b.date));
      const v = item || {};
      const fallbackNode = sortedNodes.find((n) => App.diffDays(n.date) >= 0) || sortedNodes[0];
      const selectedNode = v.nodeId || (fallbackNode && fallbackNode.id);
      const priorityVal = v.priority || 'P1';
      const statusVal = v.status || 'todo';
      return `
        <div class="field">
          <label>任务名称<i>*</i></label>
          <input class="input" id="f-title" maxlength="40" placeholder="例如：预热海报终稿确认" value="${App.esc(v.title || '')}" />
        </div>
        <div class="field">
          <label>关联节点<i>*</i></label>
          <select class="select" id="f-node" ${sortedNodes.length ? '' : 'disabled'}>
            ${
              sortedNodes.length
                ? sortedNodes
                    .map(
                      (n) =>
                        `<option value="${n.id}" ${n.id === selectedNode ? 'selected' : ''}>${App.fmtShort(n.date)} · ${App.esc(n.name)}</option>`
                    )
                    .join('')
                : '<option value="">（暂无节点，请先新建节点）</option>'
            }
          </select>
        </div>
        <div class="form-row">
          <div class="field">
            <label>截止日期</label>
            <input class="input" type="date" id="f-date" value="${v.date || App.dateOffset(2)}" />
          </div>
          <div class="field">
            <label>负责人</label>
            <input class="input" id="f-owner" value="${App.esc(v.owner || '运营同学')}" maxlength="10" />
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>优先级</label>
            <select class="select" id="f-priority">
              <option value="P0" ${priorityVal === 'P0' ? 'selected' : ''}>P0 紧急</option>
              <option value="P1" ${priorityVal === 'P1' ? 'selected' : ''}>P1 高</option>
              <option value="P2" ${priorityVal === 'P2' ? 'selected' : ''}>P2 普通</option>
            </select>
          </div>
          <div class="field">
            <label>任务状态</label>
            <select class="select" id="f-status">
              <option value="todo" ${statusVal === 'todo' ? 'selected' : ''}>待处理</option>
              <option value="in_progress" ${statusVal === 'in_progress' ? 'selected' : ''}>进行中</option>
              <option value="done" ${statusVal === 'done' ? 'selected' : ''}>已完成</option>
              <option value="blocked" ${statusVal === 'blocked' ? 'selected' : ''}>已阻塞</option>
            </select>
          </div>
        </div>`;
    }

    function importBody() {
      return `
        <label class="uploader" id="uploader">
          <input type="file" id="import-file" class="hidden" accept="${ACCEPT}" />
          <span class="uploader-icon">${App.icon('upload', 22)}</span>
          <span class="uploader-text">点击选择 Excel / Word 文档</span>
          <span class="uploader-hint">支持 .xlsx / .xls / .csv / .doc / .docx，自动识别其中的${label}信息</span>
        </label>
        <div id="import-result"></div>
        <div class="form-hint">${App.icon('sparkles', 13)}演示环境使用模拟识别结果，正式版将解析文档中的真实表格内容</div>`;
    }

    // 编辑模式只有手动表单；新建模式才有“手动 / 导入”分段
    const body = isEdit
      ? `<div id="panel-manual">${manualBody()}</div>`
      : `
        <div class="seg" id="form-seg">
          <button type="button" class="seg-btn active" data-mode="manual">手动填写</button>
          <button type="button" class="seg-btn" data-mode="import">导入 Excel/Word</button>
        </div>
        <div id="panel-manual">${manualBody()}</div>
        <div id="panel-import" class="hidden">${importBody()}</div>`;

    App.openModal({
      title: `${isEdit ? '编辑' : '新建'}${label}`,
      okText: isEdit ? '保存修改' : `创建${label}`,
      body,
      onOk() {
        if (!isEdit && tab === 'import') return submitImport();
        return submitManual();
      },
    });

    const root = document.getElementById('modal-root');
    const okBtn = root.querySelector('#modal-ok');

    function refreshOkText() {
      if (isEdit || tab === 'manual') {
        okBtn.textContent = isEdit ? '保存修改' : `创建${label}`;
        okBtn.disabled = false;
      } else {
        okBtn.textContent = parsed.length ? `确认导入（${selected.size}）` : '识别后可导入';
        okBtn.disabled = !parsed.length;
      }
    }

    /* ---------- 模式切换（仅新建） ---------- */
    root.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.onclick = function () {
        tab = btn.dataset.mode;
        root.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        root.querySelector('#panel-manual').classList.toggle('hidden', tab !== 'manual');
        root.querySelector('#panel-import').classList.toggle('hidden', tab !== 'import');
        refreshOkText();
      };
    });

    /* ---------- 读取表单值 ---------- */
    function readNodeForm() {
      return {
        name: root.querySelector('#f-name').value.trim(),
        date: root.querySelector('#f-date').value || App.dateOffset(7),
        type: root.querySelector('#f-type').value,
        owner: root.querySelector('#f-owner').value.trim() || '未指派',
        risk: root.querySelector('#f-risk').value,
      };
    }
    function readTaskForm() {
      return {
        title: root.querySelector('#f-title').value.trim(),
        nodeId: root.querySelector('#f-node').value,
        date: root.querySelector('#f-date').value || App.dateOffset(2),
        priority: root.querySelector('#f-priority').value,
        status: root.querySelector('#f-status').value,
        owner: root.querySelector('#f-owner').value.trim() || '未指派',
      };
    }

    /* ---------- 手动提交（新建或编辑） ---------- */
    function submitManual() {
      if (isNode) {
        const nameEl = root.querySelector('#f-name');
        const vals = readNodeForm();
        if (!vals.name) {
          nameEl.classList.add('invalid');
          nameEl.focus();
          App.toast('请先填写节点名称');
          return false;
        }
        if (isEdit) {
          Object.assign(item, vals);
          if (opts.onChanged) opts.onChanged();
          App.rerender();
          App.updateNavBadge();
          App.toast(`节点「${vals.name}」已更新`);
        } else {
          App.state.nodes.push(Object.assign({ id: uid('n', 0) }, vals));
          if (opts.onChanged) opts.onChanged();
          App.rerender();
          App.updateNavBadge();
          App.toast(`节点「${vals.name}」已创建`);
        }
        return true;
      }

      const titleEl = root.querySelector('#f-title');
      const vals = readTaskForm();
      if (!vals.title) {
        titleEl.classList.add('invalid');
        titleEl.focus();
        App.toast('请先填写任务名称');
        return false;
      }
      if (!vals.nodeId) {
        App.toast('请先在「节点管理」中新建节点，再关联任务');
        return false;
      }
      if (isEdit) {
        Object.assign(item, vals);
        if (opts.onChanged) opts.onChanged();
        App.rerender();
        App.updateNavBadge();
        App.toast(`任务「${vals.title}」已更新`);
      } else {
        App.state.tasks.push(Object.assign({ id: uid('t', 0) }, vals));
        if (opts.onChanged) opts.onChanged();
        App.rerender();
        App.updateNavBadge();
        App.toast(`任务「${vals.title}」已创建`);
      }
      return true;
    }

    /* ---------- 文档识别（模拟，仅新建） ---------- */
    const fileInput = root.querySelector('#import-file');
    if (fileInput) {
      fileInput.onchange = function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        parsed = [];
        selected = new Set();
        const result = root.querySelector('#import-result');

        result.innerHTML = `
          <div class="file-pill">
            <span class="file-pill-icon">${App.icon('file', 16)}</span>
            <span class="file-pill-name">${App.esc(file.name)}</span>
            <span class="file-pill-size">${(file.size / 1024).toFixed(1)} KB</span>
          </div>
          <div class="recognize">
            <span class="recognize-bar"></span>
            <span class="recognize-text">${App.icon('clock', 13)}正在识别文档内容…</span>
          </div>`;

        clearTimeout(recognizeTimer);
        recognizeTimer = setTimeout(function () {
          if (!document.body.contains(result)) return; // 弹窗可能已关闭
          parsed = isNode ? mockNodeRecords() : mockTaskRecords();
          parsed.forEach((_, i) => selected.add(i));
          renderPreview();
          refreshOkText();
        }, 1100);
        refreshOkText();
      };
    }

    function recordMeta(r) {
      if (isNode) {
        return `${App.fmtDate(r.date).full} · ${r.type} · 负责人 ${r.owner}`;
      }
      const node = App.nodeById(r.nodeId);
      return `${node ? App.fmtShort(node.date) + ' · ' + node.name : '未关联节点'} · 截止 ${App.fmtDate(r.date).md} · ${App.priorityMeta[r.priority].label}`;
    }

    function renderPreview() {
      const result = root.querySelector('#import-result');
      result.innerHTML = `
        <div class="pick-list">
          <label class="pick-item pick-head">
            <input type="checkbox" id="pick-all" ${selected.size === parsed.length ? 'checked' : ''} />
            <span>识别到 <strong>${parsed.length}</strong> 条${label}，勾选需要导入的记录</span>
          </label>
          ${parsed
            .map(
              (r, i) => `
            <label class="pick-item">
              <input type="checkbox" class="pick-one" data-i="${i}" ${selected.has(i) ? 'checked' : ''} />
              <span class="pick-main">
                <span class="pick-title">${App.esc(isNode ? r.name : r.title)}</span>
                <span class="pick-meta">${App.esc(recordMeta(r))}</span>
              </span>
            </label>`
            )
            .join('')}
        </div>`;

      const all = result.querySelector('#pick-all');
      all.onchange = function () {
        selected = new Set(all.checked ? parsed.map((_, i) => i) : []);
        renderPreview();
        refreshOkText();
      };
      result.querySelectorAll('.pick-one').forEach((cb) => {
        cb.onchange = function () {
          const i = Number(cb.dataset.i);
          if (cb.checked) selected.add(i);
          else selected.delete(i);
          refreshOkText();
          all.checked = selected.size === parsed.length;
        };
      });
    }

    function submitImport() {
      if (!parsed.length) {
        App.toast('请先选择要识别的文档');
        return false;
      }
      if (!selected.size) {
        App.toast('请至少勾选一条记录');
        return false;
      }
      const prefix = isNode ? 'n' : 't';
      let count = 0;
      parsed.forEach((r, i) => {
        if (!selected.has(i)) return;
        const rec = JSON.parse(JSON.stringify(r));
        // 模拟数据里的类型可能已被用户改名 / 删除，兜底归入当前第一个类型
        if (isNode && App.NODE_TYPES.indexOf(rec.type) === -1) {
          rec.type = App.NODE_TYPES[0];
        }
        App.state[isNode ? 'nodes' : 'tasks'].push(Object.assign({ id: uid(prefix, i) }, rec));
        count += 1;
      });
      if (opts.onChanged) opts.onChanged();
      App.rerender();
      App.updateNavBadge();
      App.toast(`已从文档导入 ${count} 条${label}（模拟）`);
      return true;
    }
  }

  // 对外入口
  App.openCreateForm = function (kind, opts) {
    openEntityForm(kind, Object.assign({ mode: 'create' }, opts));
  };
  App.openEditForm = function (kind, item) {
    openEntityForm(kind, { mode: 'edit', item });
  };

  /* ============================================================
   * 删除确认
   * ============================================================ */
  App.confirmDelete = function (kind, item) {
    const isNode = kind === 'node';
    const label = isNode ? '节点' : '任务';
    const name = isNode ? item.name : item.title;
    let relatedHtml = '';

    if (isNode) {
      const related = App.state.tasks.filter((t) => t.nodeId === item.id);
      if (related.length) {
        relatedHtml = `
          <div class="del-related">
            该节点下还有 <strong>${related.length}</strong> 个关联任务：
            <ul>
              ${related.slice(0, 4).map((t) => `<li>${App.esc(t.title)}</li>`).join('')}
              ${related.length > 4 ? `<li>……等共 ${related.length} 个</li>` : ''}
            </ul>
            <label class="check-field">
              <input type="checkbox" id="del-cascade" />
              <span>同时删除这 ${related.length} 个关联任务</span>
            </label>
            <p class="del-hint">不勾选时，任务会保留，但会变为“未关联节点”，之后可在编辑任务时重新关联。</p>
          </div>`;
      } else {
        relatedHtml = '<p class="del-hint">该节点下暂无关联任务。</p>';
      }
    }

    App.openModal({
      title: `删除${label}`,
      okText: `确认删除`,
      okClass: 'btn-danger',
      body: `
        <div class="del-confirm">
          <p>确定要删除${label} <strong>「${App.esc(name)}」</strong> 吗？此操作不可撤销。</p>
          ${relatedHtml}
        </div>`,
      onOk(form) {
        if (isNode) {
          const cascade = form.querySelector('#del-cascade');
          if (cascade && cascade.checked) {
            App.state.tasks = App.state.tasks.filter((t) => t.nodeId !== item.id);
          }
          App.state.nodes = App.state.nodes.filter((n) => n.id !== item.id);
        } else {
          App.state.tasks = App.state.tasks.filter((t) => t.id !== item.id);
        }
        App.rerender();
        App.updateNavBadge();
        App.toast(`${label}「${name}」已删除`);
      },
    });
  };

  /* ============================================================
   * 行内 / 卡片上的编辑、删除按钮统一绑定
   * 约定：data-edit="node:id" / data-delete="task:id"
   * ============================================================ */
  App.bindEntityActions = function (root) {
    function findItem(kind, id) {
      return App.state[kind === 'node' ? 'nodes' : 'tasks'].find((x) => x.id === id);
    }
    root.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.onclick = function () {
        const [kind, id] = btn.dataset.edit.split(':');
        const item = findItem(kind, id);
        if (item) App.openEditForm(kind, item);
      };
    });
    root.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.onclick = function () {
        const [kind, id] = btn.dataset.delete.split(':');
        const item = findItem(kind, id);
        if (item) App.confirmDelete(kind, item);
      };
    });
  };

  // 编辑 / 删除小图标按钮组
  App.actionButtons = function (kind, id) {
    return `
      <span class="row-actions">
        <button class="icon-btn icon-btn-sm" title="编辑" data-edit="${kind}:${id}">${App.icon('edit', 14)}</button>
        <button class="icon-btn icon-btn-sm danger" title="删除" data-delete="${kind}:${id}">${App.icon('trash', 14)}</button>
      </span>`;
  };

  /* ============================================================
   * 节点类型管理：新增 / 重命名（联动所有节点）/ 删除（迁移节点）
   * opts.onChanged: 数据变化后、页面重渲染前调用（用于重置筛选）
   * ============================================================ */
  const TYPE_TONES = ['violet', 'blue', 'green', 'amber', 'red'];

  App.openTypeManager = function (opts) {
    opts = opts || {};
    let editingId = null;

    App.openModal({
      title: '节点类型管理',
      okText: '完成',
      body: `
        <p class="tm-tip">类型用于给节点分类。重命名会同步到该类型下的所有节点；删除类型时，需要先把它的节点迁移到其他类型。</p>
        <div class="tm-list" id="type-list"></div>
        <div class="tm-add">
          <input class="input" id="type-new-name" maxlength="10" placeholder="输入新类型名称，如：活动上线" />
          <button class="btn btn-sm" type="button" id="type-new-add">${App.icon('plus', 14)}添加类型</button>
        </div>`,
      onOk() {
        return true;
      },
    });

    const root = document.getElementById('modal-root');
    const listEl = root.querySelector('#type-list');
    const addInput = root.querySelector('#type-new-name');

    function typeCount(name) {
      return App.state.nodes.filter((n) => n.type === name).length;
    }

    function renderList() {
      listEl.innerHTML = App.state.nodeTypes
        .map((t) => {
          if (editingId === t.id) {
            return `
              <div class="tm-row editing" data-row="${t.id}">
                <input class="input tm-input" id="type-edit-input" maxlength="10" value="${App.esc(t.name)}" />
                <span class="row-actions">
                  <button class="icon-btn icon-btn-sm" type="button" title="保存" data-type-save="${t.id}">${App.icon('check', 14)}</button>
                  <button class="icon-btn icon-btn-sm" type="button" title="取消" data-type-cancel="${t.id}">${App.icon('x', 14)}</button>
                </span>
              </div>`;
          }
          const count = typeCount(t.name);
          const isLast = App.state.nodeTypes.length <= 1;
          return `
            <div class="tm-row" data-row="${t.id}">
              <span class="tm-main">
                ${App.badge(t.name, t.tone, true)}
                <span class="tm-count">${count} 个节点</span>
              </span>
              <span class="row-actions">
                <button class="icon-btn icon-btn-sm" type="button" title="重命名" data-type-edit="${t.id}">${App.icon('edit', 14)}</button>
                <button class="icon-btn icon-btn-sm danger" type="button" title="${isLast ? '至少保留一个节点类型' : '删除类型'}" data-type-delete="${t.id}" ${isLast ? 'disabled' : ''}>${App.icon('trash', 14)}</button>
              </span>
            </div>`;
        })
        .join('');
      bindRow();
    }

    function bindRow() {
      listEl.querySelectorAll('[data-type-edit]').forEach((btn) => {
        btn.onclick = function () {
          editingId = btn.dataset.typeEdit;
          renderList();
          const input = listEl.querySelector('#type-edit-input');
          input.focus();
          input.select();
        };
      });
      listEl.querySelectorAll('[data-type-cancel]').forEach((btn) => {
        btn.onclick = function () {
          editingId = null;
          renderList();
        };
      });
      listEl.querySelectorAll('[data-type-save]').forEach((btn) => {
        btn.onclick = function () {
          saveRename(btn.dataset.typeSave);
        };
      });
      listEl.querySelectorAll('[data-type-delete]').forEach((btn) => {
        btn.onclick = function () {
          const t = App.state.nodeTypes.find((x) => x.id === btn.dataset.typeDelete);
          // 关闭确认弹窗（无论确认还是取消）后回到类型管理
          if (t) App.confirmDeleteType(t, { onChanged: opts.onChanged, onClose: () => App.openTypeManager(opts) });
        };
      });
      const editInput = listEl.querySelector('#type-edit-input');
      if (editInput) {
        editInput.onkeydown = function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            saveRename(editingId);
          } else if (e.key === 'Escape') {
            editingId = null;
            renderList();
          }
        };
      }
    }

    function saveRename(id) {
      const t = App.state.nodeTypes.find((x) => x.id === id);
      const input = listEl.querySelector('#type-edit-input');
      if (!t || !input) return;
      const newName = input.value.trim();
      if (!newName) {
        App.toast('类型名称不能为空');
        input.focus();
        return;
      }
      if (App.state.nodeTypes.some((x) => x.id !== id && x.name === newName)) {
        App.toast('已存在同名类型，请换一个名称');
        input.focus();
        return;
      }
      const oldName = t.name;
      t.name = newName;
      App.state.nodes.forEach((n) => {
        if (n.type === oldName) n.type = newName;
      });
      editingId = null;
      if (opts.onChanged) opts.onChanged();
      App.rerender();
      renderList();
      App.toast(`类型已重命名为「${newName}」，相关节点已同步`);
    }

    function addType() {
      const name = addInput.value.trim();
      if (!name) {
        App.toast('请输入新类型名称');
        addInput.focus();
        return;
      }
      if (App.state.nodeTypes.some((t) => t.name === name)) {
        App.toast('该类型已存在，请换一个名称');
        addInput.focus();
        return;
      }
      const used = App.state.nodeTypes.map((t) => t.tone);
      const tone =
        TYPE_TONES.find((c) => used.indexOf(c) === -1) ||
        TYPE_TONES[App.state.nodeTypes.length % TYPE_TONES.length];
      App.state.nodeTypes.push({ id: uid('nt', App.state.nodeTypes.length), name, tone });
      addInput.value = '';
      if (opts.onChanged) opts.onChanged();
      App.rerender();
      renderList();
      App.toast(`已添加类型「${name}」`);
    }

    renderList();
    root.querySelector('#type-new-add').onclick = addType;
    addInput.onkeydown = function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addType();
      }
    };
  };

  // 删除类型确认：该类型下有节点时，必须选择迁移目标类型
  App.confirmDeleteType = function (t, opts) {
    opts = opts || {};
    const count = App.state.nodes.filter((n) => n.type === t.name).length;
    const others = App.state.nodeTypes.filter((x) => x.id !== t.id);

    App.openModal({
      title: '删除节点类型',
      okText: '确认删除',
      okClass: 'btn-danger',
      body: `
        <div class="del-confirm">
          <p>确定要删除类型 <strong>「${App.esc(t.name)}」</strong> 吗？</p>
          ${
            count > 0
              ? `<div class="del-related">
                   有 <strong>${count}</strong> 个节点正在使用该类型，删除前请选择它们要迁移到的类型：
                   <div class="field" style="margin-top:12px">
                     <label>节点迁移到</label>
                     <select class="select" id="type-reassign">
                       ${others.map((o, i) => `<option ${i === 0 ? 'selected' : ''}>${App.esc(o.name)}</option>`).join('')}
                     </select>
                   </div>
                 </div>`
              : '<p class="del-hint">当前没有节点使用该类型，可直接删除。</p>'
          }
        </div>`,
      onOk(form) {
        let target = '';
        if (count > 0) {
          target = form.querySelector('#type-reassign').value;
          if (!others.some((o) => o.name === target)) {
            App.toast('请选择节点迁移的目标类型');
            return false;
          }
          App.state.nodes.forEach((n) => {
            if (n.type === t.name) n.type = target;
          });
        }
        App.state.nodeTypes = App.state.nodeTypes.filter((x) => x.id !== t.id);
        if (opts.onChanged) opts.onChanged();
        App.rerender();
        App.toast(count > 0 ? `类型已删除，${count} 个节点已迁移到「${target}」` : `类型「${t.name}」已删除`);
      },
      onClose() {
        if (opts.onClose) opts.onClose();
      },
    });
  };
})();
