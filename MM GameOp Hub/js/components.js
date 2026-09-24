/* ============================================================
 * 公共组件：图标、徽章、进度条、弹窗、轻提示
 * ============================================================ */
(function () {
  const App = window.App;

  // 线性图标（内联 SVG，风格接近 Lucide / Linear）
  const ICONS = {
    alert: '<path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M8 3v3M16 3v3M3 9.5h18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    sparkles: '<path d="M12 4l1.8 4.5L18 10.5l-4.2 2L12 17l-1.8-4.5L6 10.5l4.2-2z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/><path d="M5.5 14.5l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-3.8 4.3-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  };

  App.icon = function (name, size) {
    const s = size || 16;
    return `<svg class="icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  };

  // 彩色徽章
  App.badge = function (label, tone, dot) {
    tone = tone || 'neutral';
    return `<span class="badge tone-${tone}">${dot ? '<i class="badge-dot"></i>' : ''}${App.esc(label)}</span>`;
  };

  // 负责人单元格
  App.ownerCell = function (name) {
    return `<span class="user-cell"><span class="avatar avatar-xs">${App.esc(name.charAt(0))}</span>${App.esc(name)}</span>`;
  };

  // 进度条
  App.progressBar = function (p) {
    const fill = p.percent === 100 ? 'var(--success)' : 'var(--accent)';
    const meta = p.total ? `${p.done}/${p.total} · ${p.percent}%` : '暂无任务';
    return `<div class="progress" title="${p.done}/${p.total} 已完成">
      <div class="progress-bar"><div class="progress-fill" style="width:${p.percent}%;background:${fill}"></div></div>
      <span class="progress-meta">${meta}</span>
    </div>`;
  };

  // 模态弹窗
  // onOk(form) 返回 false 可阻止关闭（用于校验）
  App.openModal = function (opts) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <h3>${App.esc(opts.title)}</h3>
            <button class="icon-btn" id="modal-close" title="关闭">${App.icon('x', 18)}</button>
          </div>
          <form id="modal-form" class="modal-body">${opts.body}</form>
          <div class="modal-foot">
            <button class="btn" type="button" id="modal-cancel">取消</button>
            <button class="btn ${opts.okClass || 'btn-primary'}" type="button" id="modal-ok">${App.esc(opts.okText || '保存')}</button>
          </div>
        </div>
      </div>`;

    let closed = false;
    const close = function () {
      if (closed) return;
      closed = true;
      root.innerHTML = '';
      document.removeEventListener('keydown', onKey);
      if (opts.onClose) opts.onClose();
    };
    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    root.querySelector('#modal-close').onclick = close;
    root.querySelector('#modal-cancel').onclick = close;
    root.querySelector('#modal-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'modal-overlay') close();
    });
    root.querySelector('#modal-ok').onclick = function () {
      const form = root.querySelector('#modal-form');
      if (opts.onOk && opts.onOk(form) === false) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    setTimeout(function () {
      const first = root.querySelector('input, select, textarea');
      if (first) first.focus();
    }, 30);
  };

  // 右下角轻提示
  App.toast = function (msg) {
    let host = document.getElementById('toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toast-host';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${App.icon('check', 15)}<span>${App.esc(msg)}</span>`;
    host.appendChild(el);
    setTimeout(function () {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 250);
    }, 2200);
  };

  // 复制文本（兼容 file:// 直接打开的场景）
  App.copyText = function (text) {
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => { fallback(); });
    }
    fallback();
    return Promise.resolve();
  };
})();
