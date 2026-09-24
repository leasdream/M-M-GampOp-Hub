/* ============================================================
 * 模拟数据（Mock Data）
 * - 所有数据都写在前端，不连接任何后端 / 数据库
 * - 日期使用“相对于今天的偏移天数”动态生成，
 *   保证任何时候打开 Demo，都能看到逾期、今天、即将到期等状态
 * ============================================================ */
(function () {
  const App = (window.App = window.App || {});

  // 生成相对今天 N 天的日期字符串（N 为负数表示过去），格式 YYYY-MM-DD
  App.dateOffset = function (days) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 节点类型（可在“节点管理 → 类型管理”中新增 / 重命名 / 删除）
  // tone 决定类型徽章颜色：violet / blue / green / amber / red
  App.seedNodeTypes = [
    { id: 'nt1', name: '版本上线', tone: 'violet' },
    { id: 'nt2', name: '活动预热', tone: 'amber' },
    { id: 'nt3', name: '每周更新', tone: 'blue' },
    { id: 'nt4', name: '社区活动', tone: 'green' },
  ];

  // 类型名称列表（随 state.nodeTypes 实时变化，供表单下拉、筛选 chips 使用）
  Object.defineProperty(App, 'NODE_TYPES', {
    configurable: true,
    get() {
      return App.state.nodeTypes.map((t) => t.name);
    },
  });

  // 节点（里程碑）
  App.seedNodes = [
    { id: 'n1', name: '周年庆预热开启',           date: App.dateOffset(-6), type: '活动预热', owner: '陈默', risk: 'normal' },
    { id: 'n2', name: '开发团队前瞻直播',         date: App.dateOffset(-1), type: '社区活动', owner: '王昊', risk: 'risk'   },
    { id: 'n3', name: '每周例行更新 W39',         date: App.dateOffset(-3), type: '每周更新', owner: '张远', risk: 'normal' },
    { id: 'n4', name: '周年庆限定卡池上线',       date: App.dateOffset(2),  type: '活动预热', owner: '苏晴', risk: 'normal' },
    { id: 'n5', name: '版本下载预加载开启',       date: App.dateOffset(3),  type: '版本上线', owner: '孙涛', risk: 'normal' },
    { id: 'n6', name: 'V4.0 周年庆版本正式上线',  date: App.dateOffset(4),  type: '版本上线', owner: '林晓', risk: 'watch'  },
    { id: 'n7', name: '周年庆全员福利发放',       date: App.dateOffset(5),  type: '活动预热', owner: '赵宇', risk: 'watch'  },
    { id: 'n8', name: '玩家二创征集活动',         date: App.dateOffset(8),  type: '社区活动', owner: '李雯', risk: 'normal' },
  ];

  // 任务（nodeId 关联到节点）
  // status: todo 待处理 / in_progress 进行中 / done 已完成 / blocked 已阻塞
  // priority: P0 紧急 / P1 高 / P2 普通
  App.seedTasks = [
    { id: 't01', title: '社群预热文案第一轮发布',       nodeId: 'n1', date: App.dateOffset(-6), priority: 'P0', status: 'done',       owner: '李雯' },
    { id: 't02', title: '周年庆预热 H5 页面上线',       nodeId: 'n1', date: App.dateOffset(-5), priority: 'P1', status: 'done',       owner: '陈默' },
    { id: 't03', title: '预热 H5 数据埋点联调验证',     nodeId: 'n1', date: App.dateOffset(0),  priority: 'P1', status: 'in_progress', owner: '陈默' },
    { id: 't04', title: '周年庆登录界面氛围音效验收',   nodeId: 'n1', date: App.dateOffset(1),  priority: 'P2', status: 'todo',       owner: '苏晴' },

    { id: 't05', title: '前瞻直播脚本与法务口径确认',   nodeId: 'n2', date: App.dateOffset(-2), priority: 'P0', status: 'blocked',    owner: '王昊' },
    { id: 't06', title: '直播间布景与抽奖道具准备',     nodeId: 'n2', date: App.dateOffset(-1), priority: 'P1', status: 'in_progress', owner: '苏晴' },
    { id: 't07', title: '直播预热短视频剪辑发布',       nodeId: 'n2', date: App.dateOffset(0),  priority: 'P2', status: 'todo',       owner: '王昊' },
    { id: 't08', title: '周年庆社区话题主持排班',       nodeId: 'n2', date: App.dateOffset(1),  priority: 'P2', status: 'in_progress', owner: '王昊' },

    { id: 't09', title: 'W39 停服维护公告发布',         nodeId: 'n3', date: App.dateOffset(-4), priority: 'P1', status: 'done',       owner: '张远' },
    { id: 't10', title: 'W39 热更补丁回归测试',         nodeId: 'n3', date: App.dateOffset(-3), priority: 'P0', status: 'done',       owner: '张远' },

    { id: 't11', title: '限定角色立绘终稿确认',         nodeId: 'n4', date: App.dateOffset(-3), priority: 'P1', status: 'done',       owner: '苏晴' },
    { id: 't12', title: '限定卡池概率公示页制作',       nodeId: 'n4', date: App.dateOffset(1),  priority: 'P1', status: 'in_progress', owner: '苏晴' },
    { id: 't13', title: '卡池宣传 Banner 多语言适配',   nodeId: 'n4', date: App.dateOffset(2),  priority: 'P2', status: 'todo',       owner: '李雯' },

    { id: 't14', title: '预加载包体 CDN 分发配置',      nodeId: 'n5', date: App.dateOffset(2),  priority: 'P0', status: 'todo',       owner: '孙涛' },
    { id: 't15', title: '预加载公告与下载引导文案',     nodeId: 'n5', date: App.dateOffset(3),  priority: 'P2', status: 'todo',       owner: '李雯' },

    { id: 't16', title: '周年庆版本功能清单封版',       nodeId: 'n6', date: App.dateOffset(-2), priority: 'P0', status: 'done',       owner: '林晓' },
    { id: 't17', title: '应用商店版本包提交与审核',     nodeId: 'n6', date: App.dateOffset(1),  priority: 'P0', status: 'todo',       owner: '林晓' },
    { id: 't18', title: '版本上线 Checklist 终审',      nodeId: 'n6', date: App.dateOffset(4),  priority: 'P0', status: 'in_progress', owner: '林晓' },
    { id: 't19', title: '周年庆客服 FAQ 培训',          nodeId: 'n6', date: App.dateOffset(3),  priority: 'P1', status: 'todo',       owner: '赵宇' },

    { id: 't20', title: '全服福利邮件模板配置',         nodeId: 'n7', date: App.dateOffset(4),  priority: 'P1', status: 'todo',       owner: '赵宇' },

    { id: 't21', title: '二创活动规则页设计',           nodeId: 'n8', date: App.dateOffset(6),  priority: 'P2', status: 'todo',       owner: '李雯' },
    { id: 't22', title: '社区 KOL 邀请名单确认',        nodeId: 'n8', date: App.dateOffset(5),  priority: 'P1', status: 'blocked',    owner: '李雯' },
  ];

  // 初始化 / 重置内存中的状态（新建节点、修改任务状态都作用于这里）
  App.resetState = function () {
    App.state = {
      nodeTypes: JSON.parse(JSON.stringify(App.seedNodeTypes)),
      nodes: JSON.parse(JSON.stringify(App.seedNodes)),
      tasks: JSON.parse(JSON.stringify(App.seedTasks)),
    };
  };
  App.resetState();
})();
