/* ============================================================
 * 应用入口：简易哈希路由 + 顶栏渲染
 * 路由规则：#/overview  项目总览
 *           #/nodes     节点管理
 *           #/tasks     我的任务
 *           #/ai        AI 内容助手
 * ============================================================ */
(function () {
  const App = window.App;

  const PAGE_TITLE = {
    overview: '项目总览',
    nodes: '节点管理',
    tasks: '我的任务',
    ai: 'AI 内容助手',
  };

  // 侧边栏“我的任务”角标：显示 48 小时内到期 / 已逾期的任务数
  App.updateNavBadge = function () {
    const badge = document.getElementById('nav-task-badge');
    if (!badge) return;
    const dueSoon = App.state.tasks.filter(
      (t) => t.status !== 'done' && App.diffDays(t.date) <= 2
    ).length;
    badge.textContent = dueSoon;
    badge.classList.toggle('show', dueSoon > 0);
  };

  function renderTopbar(name) {
    const d = new Date();
    const week = '日一二三四五六'[d.getDay()];
    const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${week}`;
    document.getElementById('topbar').innerHTML = `
      <div class="crumbs">MM GameOps Hub <span class="sep">/</span> ${name}</div>
      <div class="topbar-right">
        <span class="date-chip">${App.icon('calendar', 14)}${dateStr}</span>
        <span class="avatar avatar-sm">我</span>
      </div>`;
  }

  const router = {
    render() {
      const route = location.hash.replace(/^#\//, '') || 'overview';
      const key = App.pages[route] ? route : 'overview';
      const page = App.pages[key];

      const el = document.getElementById('page');
      el.innerHTML = page.render();
      if (page.mount) page.mount(el);

      document.querySelectorAll('.nav-item').forEach((a) => {
        a.classList.toggle('active', a.dataset.route === key);
      });
      document.title = `${PAGE_TITLE[key]} · MM GameOps Hub`;
      renderTopbar(PAGE_TITLE[key]);
      window.scrollTo(0, 0);
    },

    init() {
      if (!location.hash) location.replace('#/overview');
      window.addEventListener('hashchange', () => this.render());
      this.render();
      App.updateNavBadge();
    },
  };

  // 供各页面在数据变化后重新渲染当前页
  App.rerender = function () {
    router.render();
    App.updateNavBadge();
  };

  App.router = router;
  document.addEventListener('DOMContentLoaded', function () {
    router.init();
  });
})();
