/* ============================================================
 * 页面 4：AI 内容助手（纯本地模拟，不调用真实 AI）
 * 工具一：版本文案生成（版本公告 / 社群预热 / FAQ）
 * 工具二：玩家提问应答（根据玩家问题生成客服回复初稿）
 * 工具三：提需单生成（平台推荐位申请 + 美术提需）
 * ============================================================ */
(function () {
  const App = window.App;
  App.pages = App.pages || {};

  /* ============================================================
   * 工具一：版本文案生成
   * ============================================================ */
  const TONES = {
    热血激昂: {
      lead: '集结号已经吹响，属于全体玩家的周年狂欢即将开启！',
      headline: '燃爆周年，全员集结！',
      hot: '福利拉满，就等你归队！',
      cta: '立刻登录，战个痛快！',
    },
    轻松活泼: {
      lead: '好久不见！这次我们准备了超多惊喜，一起来看看吧～',
      headline: '周年庆来啦，快上线薅羊毛～',
      hot: '福利多多，记得叫上小伙伴一起！',
      cta: '快上线看看吧，等你哦～',
    },
    专业沉稳: {
      lead: '为保障版本体验，现将本次版本更新安排说明如下。',
      headline: 'V4.0 周年庆版本上线说明',
      hot: '详细活动规则与时间安排请以官方公告为准。',
      cta: '建议提前完成预加载，合理安排游戏时间。',
    },
    神秘悬念: {
      lead: '当钟声再度敲响，一段被时光掩埋的庆典记忆即将苏醒。',
      headline: '尘封的庆典，即将开启……',
      hot: '有些秘密，只在周年庆当晚揭晓。',
      cta: '保持关注，答案即将浮现。',
    },
  };

  const AUDIENCE_CALL = {
    全体玩家: '亲爱的各位冒险者',
    回归玩家: '欢迎回来，老朋友们',
    核心玩家: '致各位核心冒险者',
    新玩家: '欢迎来到 MM 世界的新朋友',
  };

  // 拆亮点：textarea 每行一条，去掉 “1.” 之类序号
  function toBullets(text) {
    return text
      .split(/\n+/)
      .map((s) => s.replace(/^\s*\d+[.、)]\s*/, '').trim())
      .filter(Boolean);
  }

  // 类型可被用户重命名，按顺序取（第 1 类=版本上线位，第 2 类=活动预热位）
  function typeName(i, fallback) {
    const t = App.state.nodeTypes[i];
    return t ? t.name : fallback;
  }

  function launchDate() {
    const launchType = typeName(0, '版本上线');
    const n =
      App.state.nodes.find((x) => x.type === launchType && App.diffDays(x.date) >= 0) ||
      App.state.nodes.find((x) => x.type === launchType);
    return n ? App.fmtDate(n.date).full : '近期';
  }

  App.generateCopy = function (input) {
    const tone = TONES[input.tone] || TONES['热血激昂'];
    const bullets = toBullets(input.content);

    const scheduleNodes = App.state.nodes
      .filter((n) => n.type === typeName(0, '版本上线') || n.type === typeName(1, '活动预热'))
      .sort((a, b) => a.date.localeCompare(b.date));
    const schedule = scheduleNodes
      .map((n, i) => `${i + 1}. ${App.fmtDate(n.date).md}（${App.fmtDate(n.date).week}）「${n.name}」`)
      .join('\n');

    const callName = AUDIENCE_CALL[input.audience] || AUDIENCE_CALL['全体玩家'];
    const highlightList = bullets.length
      ? bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')
      : '1. 更多版本内容请以后续官方公告为准。';
    const ld = launchDate();
    const now = new Date();

    const notice =
`【${input.name}】版本公告

${callName}：

${tone.lead}
「${input.name}」预计于 ${ld} 正式上线，将面向${input.audience}带来以下全新内容：

${highlightList}

【活动日程】
${schedule}

【温馨提示】
1. 上线当日将进行停服维护，具体维护时间请以后续发布的维护公告为准；
2. 维护结束后，我们将通过游戏内邮件统一发放维护补偿；
3. 活动期间如遇到任何问题，可通过游戏内客服入口或官方社群联系我们。

感谢大家一直以来的支持与陪伴，周年庆见！

MM 运营团队
${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;

    const firstPoint = bullets[0] || '全新周年庆内容';
    const topPoints = bullets.slice(0, 2).join('；') || '登录即可领取周年庆专属福利';
    const social =
`【倒计时 3 天】
${tone.headline}
「${input.name}」${ld} 上线！${firstPoint}，更多惊喜正在路上。${tone.hot}
#MM周年庆# #新版本倒计时#

【上线当天】
各位玩家久等了！「${input.name}」今日正式上线。
${topPoints}。
${tone.cta}

【社群互动】
转发并评论“你最期待的版本内容”，我们将抽取 10 位玩家送出周年限定周边！
互动截止时间：${ld} 23:59。${tone.hot}`;

    const welfare = bullets
      .filter((b) => /福利|礼|抽|券|折扣|返利|头像框/.test(b))
      .join('；');
    const welfareText = welfare || '登录奖励、十连抽券与周年限定头像框等多重福利';

    let q4;
    if (input.audience === '回归玩家') {
      q4 =
        'Q4：我是回归玩家，很久没玩了，会不会跟不上版本？\n' +
        'A：不用担心。本次版本为回归玩家准备了专属回归指引、登录奖励与一键追赶任务，上线后跟着活动中心的指引即可快速融入。';
    } else if (input.audience === '新玩家') {
      q4 =
        'Q4：我是新玩家，这个版本适合入坑吗？\n' +
        'A：非常适合。周年庆版本福利丰厚、上手门槛低，新玩家完成新手引导后即可参与周年庆主线活动并领取专属福利。';
    } else {
      q4 =
        'Q4：不同进度的玩家都能参与周年庆活动吗？\n' +
        'A：可以。本次活动面向全体玩家设计，新老玩家均可参与，部分高难度玩法会提供对应档位的奖励，大家按自己的节奏体验即可。';
    }

    const faq =
`【${input.name}】常见问题 FAQ（初稿）

Q1：版本什么时候正式上线？需要停服维护吗？
A：「${input.name}」计划于 ${ld} 正式上线。上线前将进行例行停服维护，具体维护时间与补偿安排请以后续发布的维护公告为准。

Q2：需要重新下载客户端吗？安装包有多大？
A：本次更新支持补丁更新，建议在 Wi-Fi 环境下提前完成预加载，无需重新安装。具体包体大小以后续应用商店页面显示为准。

Q3：周年庆有哪些福利？要怎么领取？
A：本次为大家准备了 ${welfareText}。福利将通过游戏内邮件与活动中心陆续发放，登录后按页面指引即可领取。

${q4}

Q5：活动期间遇到问题如何反馈？
A：可通过游戏内「设置 - 客服中心」提交工单，也可在官方 QQ 群 / 社群中联系值班运营，我们会在活动期间加快响应速度。`;

    return { notice, social, faq };
  };

  /* ============================================================
   * 工具二：玩家提问应答（关键词命中 + 分类兜底，纯模拟）
   * ============================================================ */
  App.generateAnswer = function (input) {
    const q = input.question.trim();
    const related = input.related.trim() || '本次活动';
    const ld = launchDate();
    const friendly = input.manner === '友好安抚';

    const greeting = friendly
      ? '您好呀，非常理解您的心情，给您带来困扰真的很抱歉，我们这就帮您核实处理～'
      : '您好，已收到您反馈的问题，现回复如下：';
    const ending = friendly
      ? '如果还有其他疑问，欢迎随时联系我们，祝您游戏愉快，周年庆玩得开心～'
      : '如仍有疑问，欢迎继续反馈，我们会持续跟进。感谢您对 MM 的支持。';

    const RULES = [
      {
        re: /维护|停服|更新时间|几点.*(更新|开服)|补偿/,
        points: ['记录玩家区服与 UID，便于补偿核查', '维护时间以最终公告为准，不提前承诺具体开服点数'],
        answer:
          `关于「${related}」的时间安排：版本预计于 ${ld} 正式上线，上线前会进行例行停服维护，预计时长约 3-5 小时，维护期间将无法登录。维护结束后将通过游戏内邮件统一发放维护补偿（体力×120、金币×50000）。具体开服时间可能根据实际进度提前或延后，建议您留意游戏内公告与官方社群通知。`,
      },
      {
        re: /卡池|抽卡|十连|概率|保底|限定角色/,
        points: ['概率、保底次数必须与卡池公示页一致', '不承诺“必出”等超出公示规则的内容'],
        answer:
          '关于卡池规则：本次限定卡池将在版本上线后同步开放，基础 SSR 概率为 2%，每 90 抽保底 SSR，每 180 抽可通过兑换必得本期限定角色；活动期间每期卡池的保底次数独立计算。十连抽券可通过周年庆登录福利与活动任务获取，完整概率公示请以卡池页面信息为准。',
      },
      {
        re: /充值|扣费|扣款|退款|未到账|发票|支付/,
        points: ['引导玩家提供订单截图（含订单号、支付时间）、区服、UID', '退款规则按 iOS / 安卓各渠道政策处理，不私下转账'],
        answer:
          '关于充值问题，请您先不要重复支付。若已扣款但道具未到账，一般会在 24 小时内自动补发；超过 24 小时仍未到账，请提供：① 支付订单截图（含订单号与支付时间）；② 角色区服与 UID；③ 购买的商品名称，我们会在 1 个工作日内为您核查处理。',
      },
      {
        re: /登录|登不上|闪退|黑屏|卡顿|bug|BUG|异常|报错|进不去/,
        points: ['收集设备型号、系统版本、网络环境、发生时间与录屏', '给出排查步骤后仍未解决，及时转技术工单'],
        answer:
          '关于您遇到的异常，建议您先尝试以下操作：① 切换网络（Wi-Fi / 4G）后重新登录；② 在登录界面点击「修复」校验游戏资源；③ 清理客户端缓存（不会影响账号数据）；④ 将游戏更新至最新版本。若操作后问题仍存在，请回复您的设备型号、系统版本、网络环境与问题发生时间（如有录屏更佳），我们会立即提交技术同学定位。',
      },
      {
        re: /福利|奖励|邮件|没收到|领取|没发/,
        points: ['核对玩家是否满足领取条件，邮件附件有效期 30 天', '确认漏发后登记 UID 统一补发，不承诺规则外福利'],
        answer:
          '关于福利领取：本次周年庆福利将通过游戏内邮件与活动中心分批次发放，不同奖励的解锁条件不同，麻烦您先在活动中心确认领取条件；邮件附件有效期为 30 天，请及时领取。若您确认已满足条件但未收到，请提供角色 UID 与对应活动名称，我们会为您登记核查。',
      },
      {
        re: /好友|组队|公会|协力|保卫战/,
        points: ['说明玩法开启条件与奖励结算方式', '引导玩家通过活动中心查看玩法说明'],
        answer:
          '关于协作玩法：「公会庆典保卫战」为限时协作玩法，需要先加入公会并通关主线第三章后开启，支持 3 人组队匹配；活动奖励按个人贡献与公会总进度分别结算，未领取的奖励会在活动结束后通过邮件补发。',
      },
    ];

    const FALLBACK = {
      活动规则: '本次活动的参与条件、时间与奖励规则以活动中心页面和官方公告为准。若您看到的信息与页面不一致，建议先更新至最新版本，并附上活动页面截图，我们帮您进一步核实。',
      充值与道具: '请您提供订单截图、角色区服与 UID，我们会在 1 个工作日内为您核查扣费与道具到账情况，在此之前请不要重复支付。',
      异常与BUG: '建议先尝试切换网络、修复资源与清理缓存；若问题依旧，请提供设备型号、系统版本与问题录屏，我们会立即提交技术同学定位。',
      账号与登录: '为保障账号安全，请勿在社群中透露密码或验证码。您可通过登录页「遇到问题」自助找回账号；若仍无法解决，请提供 UID 与注册信息，由客服人工核实。',
      福利发放: '福利将分批次通过游戏内邮件发放，邮件附件有效期 30 天。若确认符合条件但未收到，请提供 UID 与活动名称，我们为您登记核查。',
      其他: '您反馈的问题我们已经记录，请补充角色 UID、问题发生时间与相关截图，我们会尽快核实并回复；在结论确认前，相关信息请以官方公告为准。',
    };

    const hit = RULES.find((r) => r.re.test(q));
    const body = hit ? hit.answer : (FALLBACK[input.category] || FALLBACK['其他']);
    const points = hit
      ? hit.points
      : ['确认玩家问题分类，必要时流转对应负责同学', '信息不足时按模板追问 UID / 截图 / 发生时间'];

    return `【玩家问题】
${q}
问题分类：${input.category}　相关版本/活动：${related}

【建议回复初稿】
${greeting}
${body}
${ending}

【处理要点（内部参考，请勿直接发送）】
${points.map((p, i) => `${i + 1}. ${p}`).join('\n')}
${hit ? `${points.length + 1}. 若玩家情绪激动或再次催促，立即升级值班运营介入。` : ''}

【口径提醒】
1. 不承诺规则外补偿，所有时间与概率以官方公告 / 公示页为准；
2. 回复中避免出现“肯定、一定、马上解决”等绝对化表述；
3. 涉及账号安全的信息一律走官方客服渠道，不通过私聊索取密码。`;
  };

  /* ============================================================
   * 工具三：提需单生成（推荐位申请 + 美术提需）
   * ============================================================ */
  App.generateBrief = function (input) {
    const bullets = toBullets(input.highlights);
    const name = input.name.trim() || '未命名活动';
    const first = bullets[0] || '全新周年庆内容';
    const second = bullets[1] || '登录领取周年庆专属福利';
    const ld = launchDate();

    const launchMd = (function () {
      const n = App.state.nodes.find((x) => x.type === typeName(0, '版本上线'));
      return n ? App.fmtShort(n.date) : '上线日';
    })();

    /* ----- 3-1 推荐位申请提需 ----- */
    const slotApply =
`【推荐位申请提需单】

一、基础信息
· 申请活动：${name}
· 推荐位置：${input.slot}
· 建议投放周期：${ld} 前 3 天（预热期）至上线后 3 天
· 目标用户：全量玩家，重点覆盖近 30 天活跃用户与流失召回用户
· 跳转位置：活动中心 / 版本专题页（落地页链接待补充）
· 申请方：MM 版本运营组

二、推荐标题候选（5 选 1，可 A/B 测试）
1.【悬念型】${launchMd}，一场筹备了一整年的庆典即将开启
2.【福利型】十连免费送！${name}今日开启
3.【情怀型】陪 MM 走过的第四年，这次换我们给你惊喜
4.【紧迫型】限时 14 天！${firstPointShort(first)}，错过再等一年
5.【玩法型】${firstPointShort(first)}！周年庆全新玩法抢先看

三、广告语候选
· 短标题（≤12 字）
  - 周年庆，全服狂欢
  - 登录领十连抽
  - 新版本今日上线
· Banner 主副标题
  - 主标题：${name} 盛大开启
    副标题：${first}；${second}
  - 主标题：一整年的等待，就在今天
    副标题：限定角色 + 全员福利，登录即领
· Push 推送文案（≤30 字）
  - 【周年庆】您的十连抽券已到账，登录即可领取！
  - 限定角色已上线，周年庆典只开 14 天，速来！

四、素材与排期要求
1. 主视觉与文案需在投放前 3 个工作日提交平台审核；
2. 同一位置提供 2 组标题做 A/B 测试，预留替换素材；
3. 跳转落地页需与推荐位同日就绪，避免断链；
4. 涉及概率、价格的信息以合规终审文案为准，素材中不做承诺。`;

    /* ----- 3-2 美术提需 ----- */
    const artBrief =
`【美术提需单】

一、基础信息
· 需求项目：${name}
· 用途：${input.slot}推荐位 + 社群传播物料
· 初稿时间：上线前 5 个工作日（${launchMd} 前）
· 定稿时间：上线前 2 个工作日
· 需求方：版本运营组　协作方：视觉设计组

二、需求背景
${name}为年度重点版本，核心亮点包括：
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
物料需同时承担“平台引流”与“社群传播”两个目标，要求氛围热闹、有记忆点、信息层级清晰。

三、主视觉方向（提供 3 个候选方案）
· 方案 A｜庆典氛围：以周年主城「星愿广场」夜景为背景，礼花、灯光与漂浮的星光粒子营造盛典感，中央突出周年 Logo 与数字“4”。
· 方案 B｜角色聚焦：限定 SSR「时光旅人·菲娜」C 位立绘，身后时钟齿轮与金色绸带，突出“限定、稀有”，用于卡池相关推荐位。
· 方案 C｜玩法场景：展示「公会庆典保卫战」协作战斗场面，多角色同屏、技能特效饱满，突出“组队、热闹、福利掉落”。

四、画面必含元素
${bullets.map((b) => `· ${b}`).join('\n')}
· 周年庆专属 Logo 与 “4th Anniversary” 标识
· 活动时间角标与“登录领福利”利益点标签

五、色彩与氛围
以金色 + 深紫为主色调（呼应品牌色），搭配礼花高光与星空暗部；整体明亮、温暖、有庆典仪式感，避免阴沉与战斗压迫感。

六、构图与文案层级
· 顶部 1/3 预留主标题安全区，左上角预留游戏 Logo；
· 右下角放活动时间角标，左下角放福利利益点；
· 四周安全边距不小于画面短边的 8%，关键元素不贴边。

七、交付尺寸清单
· 首页焦点 Banner：1920×1080（16:9）
· 移动端 Banner：1242×600
· 开屏 / 弹窗主视觉：750×1334（竖版，含上下安全区）
· Push 通知图标：192×192
· 社群物料：方图 1080×1080、长图 1080×1920
· 统一提供 @2x / @3x 切图，并附 PSD / AI 源文件

八、注意事项
1. 预留多语言文案空间（英文长度约为中文 1.5 倍）；
2. 概率、价格、返利数值不入图，以最终合规文案为准；
3. 每个方案同时输出深色底 / 浅色底两个版本，适配不同推荐位；
4. 角色造型、特效严格以游戏内最终资源为准，不自行二设。`;

    return { slotApply, artBrief };
  };

  function firstPointShort(s) {
    return s.length > 14 ? s.slice(0, 14) + '…' : s;
  }

  /* ============================================================
   * 页面结构与交互
   * ============================================================ */
  const TOOLS = [
    { key: 'copy',  icon: 'sparkles',  title: '版本文案生成', desc: '版本公告 · 社群预热 · FAQ' },
    { key: 'qa',    icon: 'message',   title: '玩家提问应答', desc: '根据玩家问题生成回复初稿' },
    { key: 'brief', icon: 'clipboard', title: '提需单生成',   desc: '推荐位申请 · 美术提需' },
  ];

  App.pages.ai = {
    render() {
      return `
        <div class="page-head">
          <div>
            <h1>AI 内容助手</h1>
            <p class="page-desc">运营文案、客服应答与跨团队提需，一键生成初稿（本地模拟）</p>
          </div>
        </div>

        <div class="mode-grid" id="ai-tools">
          ${TOOLS.map(
            (t, i) => `
            <button class="mode-card ${i === 0 ? 'active' : ''}" data-tool="${t.key}">
              <span class="mode-icon">${App.icon(t.icon, 18)}</span>
              <span>
                <strong>${t.title}</strong>
                <small>${t.desc}</small>
              </span>
            </button>`
          ).join('')}
        </div>

        <div class="ai-grid">
          <!-- 左侧：三个工具的输入面板（切换显示，保留已填内容） -->
          <div class="card ai-form-card">
            <div class="tool-panel" data-panel="copy">${this.copyFormHtml()}</div>
            <div class="tool-panel hidden" data-panel="qa">${this.qaFormHtml()}</div>
            <div class="tool-panel hidden" data-panel="brief">${this.briefFormHtml()}</div>
          </div>

          <!-- 右侧：三个工具各自的输出区 -->
          <div class="ai-output">
            <div class="out-panel" data-out="copy">${this.emptyHtml(
              '填写左侧版本信息',
              '将根据版本名称、内容、目标用户与风格，模拟生成版本公告、社群预热文案和 FAQ 初稿。',
              ['版本公告', '社群预热文案', 'FAQ 初稿']
            )}</div>
            <div class="out-panel hidden" data-out="qa">${this.emptyHtml(
              '粘贴玩家的真实提问',
              '选择问题分类后，将结合关键词与客服口径，模拟生成可直接参考的回复初稿（含内部处理要点）。',
              ['回复初稿', '处理要点', '口径提醒']
            )}</div>
            <div class="out-panel hidden" data-out="brief">${this.emptyHtml(
              '输入活动 / 版本亮点',
              '每行一条亮点，将模拟生成给平台运营的推荐位申请提需，以及给美术同学的配图提需。',
              ['推荐标题', '广告语', '配图思路']
            )}</div>
          </div>
        </div>
      `;
    },

    /* ---------- 三个表单 ---------- */
    copyFormHtml() {
      return `
        <h3>版本信息</h3>
        <p class="form-sub">信息越完整，生成的文案越贴合实际</p>
        <div class="field">
          <label>版本名称</label>
          <input class="input" id="ai-name" value="V40周年庆版本" maxlength="30" />
        </div>
        <div class="field">
          <label>版本内容</label>
          <textarea class="textarea" id="ai-content" rows="7" placeholder="每行填写一条版本亮点">1. 全新周年主城「星愿广场」与周年庆典剧情
2. 限定 SSR 角色「时光旅人·菲娜」上线
3. 登录即领十连抽券与周年限定头像框
4. 全新协作玩法「公会庆典保卫战」开放
5. 周年庆专属累充返利与外观折扣</textarea>
        </div>
        <div class="field">
          <label>目标用户</label>
          <select class="select" id="ai-audience">
            <option>全体玩家</option><option>回归玩家</option>
            <option>核心玩家</option><option>新玩家</option>
          </select>
        </div>
        <div class="field">
          <label>文案风格</label>
          <select class="select" id="ai-tone">
            <option>热血激昂</option><option>轻松活泼</option>
            <option>专业沉稳</option><option>神秘悬念</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" id="btn-gen-copy">${App.icon('sparkles', 15)}生成文案</button>
        <div class="form-hint">${App.icon('sparkles', 13)}本地模拟生成，不会发送任何数据</div>`;
    },

    qaFormHtml() {
      return `
        <h3>玩家问题</h3>
        <p class="form-sub">把玩家在社群 / 工单里的提问粘进来，生成客服回复初稿</p>
        <div class="field">
          <label>玩家提问<i>*</i></label>
          <textarea class="textarea" id="qa-question" rows="5" placeholder="例如：为什么我充值了月卡但是没有到账？"></textarea>
        </div>
        <div class="field">
          <label>问题分类</label>
          <select class="select" id="qa-category">
            <option>活动规则</option><option>充值与道具</option>
            <option>异常与BUG</option><option>账号与登录</option>
            <option>福利发放</option><option>其他</option>
          </select>
        </div>
        <div class="form-row">
          <div class="field">
            <label>相关版本/活动</label>
            <input class="input" id="qa-related" value="V40周年庆版本" maxlength="30" />
          </div>
          <div class="field">
            <label>回复语气</label>
            <select class="select" id="qa-manner">
              <option>友好安抚</option><option>专业简洁</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary btn-block" id="btn-gen-qa">${App.icon('message', 15)}生成回复初稿</button>
        <div class="form-hint">${App.icon('sparkles', 13)}关键词 + 分类双匹配，初稿请人工核对口径后再发送</div>`;
    },

    briefFormHtml() {
      return `
        <h3>活动 / 版本亮点</h3>
        <p class="form-sub">每行一条亮点，用于生成推荐位文案与美术配图思路</p>
        <div class="field">
          <label>活动 / 版本名称</label>
          <input class="input" id="brief-name" value="V40周年庆版本" maxlength="30" />
        </div>
        <div class="field">
          <label>核心亮点</label>
          <textarea class="textarea" id="brief-highlights" rows="6">1. 限定 SSR 角色「时光旅人·菲娜」与主题卡池
2. 全新周年主城「星愿广场」与庆典剧情
3. 登录领十连抽券、限定头像框等全员福利
4. 限时协作玩法「公会庆典保卫战」</textarea>
        </div>
        <div class="field">
          <label>推荐位位置</label>
          <select class="select" id="brief-slot">
            <option>首页焦点 Banner</option><option>开屏弹窗</option>
            <option>启动页</option><option>Push 推送</option>
            <option>应用商店推荐位</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" id="btn-gen-brief">${App.icon('clipboard', 15)}生成提需单</button>
        <div class="form-hint">${App.icon('sparkles', 13)}一次生成两份：推荐位申请提需 + 美术提需</div>`;
    },

    /* ---------- 空状态 / 加载态 ---------- */
    emptyHtml(title, desc, tips) {
      return `
        <div class="card empty-output">
          <div class="empty-spark">${App.icon('sparkles', 26)}</div>
          <h3>${title}</h3>
          <p>${desc}</p>
          <div class="empty-tips">
            ${tips.map((t) => `<span><i></i>${t}</span>`).join('')}
          </div>
        </div>`;
    },

    loadingHtml() {
      return `
        <div class="card loading-card">
          <div class="loading-title">${App.icon('sparkles', 16)}AI 正在创作中，请稍候…</div>
          <div class="skeleton w-40"></div>
          <div class="skeleton w-80"></div>
          <div class="skeleton w-60"></div>
          <div class="skeleton block"></div>
          <div class="skeleton w-80"></div>
          <div class="skeleton w-40"></div>
          <div class="skeleton block"></div>
        </div>`;
    },

    /* ---------- 结果卡片框架 ---------- */
    // tabs: [{key,label}]；为空时不显示 tab（单文档场景）
    resultFrame(docs, activeKey, tabs) {
      const tabsHtml = tabs
        ? `<div class="rtabs">${tabs
            .map(
              (t) =>
                `<button class="rtab ${t.key === activeKey ? 'active' : ''}" data-doc="${t.key}">${t.label}</button>`
            )
            .join('')}</div>`
        : '';
      return `
        <div class="card result-card">
          <div class="result-head">
            ${tabsHtml}
            <button class="btn btn-ghost btn-sm ai-copy">${App.icon('copy', 13)}复制</button>
          </div>
          <div class="result-body">
            ${docs
              .map(
                (d) =>
                  `<pre class="doc-block ${d.key === activeKey ? '' : 'hidden'}" data-doc="${d.key}">${App.esc(d.text)}</pre>`
              )
              .join('')}
          </div>
        </div>`;
    },

    bindCopyAndTabs(panel) {
      panel.querySelectorAll('.rtab').forEach((tab) => {
        tab.onclick = function () {
          panel.querySelectorAll('.rtab').forEach((t) => t.classList.toggle('active', t === tab));
          panel.querySelectorAll('.doc-block').forEach((doc) => {
            doc.classList.toggle('hidden', doc.dataset.doc !== tab.dataset.doc);
          });
        };
      });
      const copyBtn = panel.querySelector('.ai-copy');
      if (copyBtn) {
        copyBtn.onclick = function () {
          const doc = panel.querySelector('.doc-block:not(.hidden)');
          if (!doc) return;
          App.copyText(doc.textContent).then(function () {
            copyBtn.innerHTML = `${App.icon('check', 13)}已复制`;
            setTimeout(() => {
              copyBtn.innerHTML = `${App.icon('copy', 13)}复制`;
            }, 1500);
          });
        };
      }
    },

    /* ---------- 挂载事件 ---------- */
    mount(root) {
      const page = this;

      // 工具切换：只切显隐，保留各面板已填内容与已生成结果
      root.querySelectorAll('.mode-card').forEach((card) => {
        card.onclick = function () {
          const key = card.dataset.tool;
          root.querySelectorAll('.mode-card').forEach((c) => c.classList.toggle('active', c === card));
          root.querySelectorAll('.tool-panel').forEach((p) =>
            p.classList.toggle('hidden', p.dataset.panel !== key)
          );
          root.querySelectorAll('.out-panel').forEach((p) =>
            p.classList.toggle('hidden', p.dataset.out !== key)
          );
        };
      });

      // 工具一：版本文案
      root.querySelector('#btn-gen-copy').onclick = function () {
        const btn = this;
        const payload = {
          name: root.querySelector('#ai-name').value.trim() || '未命名版本',
          content: root.querySelector('#ai-content').value.trim(),
          audience: root.querySelector('#ai-audience').value,
          tone: root.querySelector('#ai-tone').value,
        };
        const out = root.querySelector('.out-panel[data-out="copy"]');
        btn.disabled = true;
        btn.innerHTML = `${App.icon('clock', 15)}生成中…`;
        out.innerHTML = page.loadingHtml();
        setTimeout(function () {
          const r = App.generateCopy(payload);
          out.innerHTML = page.resultFrame(
            [
              { key: 'notice', text: r.notice },
              { key: 'social', text: r.social },
              { key: 'faq', text: r.faq },
            ],
            'notice',
            [
              { key: 'notice', label: '版本公告' },
              { key: 'social', label: '社群预热文案' },
              { key: 'faq', label: 'FAQ 初稿' },
            ]
          );
          page.bindCopyAndTabs(out);
          btn.disabled = false;
          btn.innerHTML = `${App.icon('sparkles', 15)}重新生成`;
          App.toast('版本文案已生成（模拟）');
        }, 1200);
      };

      // 工具二：玩家提问应答
      root.querySelector('#btn-gen-qa').onclick = function () {
        const btn = this;
        const qEl = root.querySelector('#qa-question');
        const question = qEl.value.trim();
        if (!question) {
          qEl.classList.add('invalid');
          qEl.focus();
          App.toast('请先填写玩家的问题');
          return;
        }
        qEl.classList.remove('invalid');
        const payload = {
          question,
          category: root.querySelector('#qa-category').value,
          related: root.querySelector('#qa-related').value,
          manner: root.querySelector('#qa-manner').value,
        };
        const out = root.querySelector('.out-panel[data-out="qa"]');
        btn.disabled = true;
        btn.innerHTML = `${App.icon('clock', 15)}生成中…`;
        out.innerHTML = page.loadingHtml();
        setTimeout(function () {
          const text = App.generateAnswer(payload);
          out.innerHTML = page.resultFrame([{ key: 'answer', text }], 'answer', null);
          page.bindCopyAndTabs(out);
          btn.disabled = false;
          btn.innerHTML = `${App.icon('message', 15)}重新生成`;
          App.toast('回复初稿已生成（模拟）');
        }, 1000);
      };

      // 工具三：提需单
      root.querySelector('#btn-gen-brief').onclick = function () {
        const btn = this;
        const payload = {
          name: root.querySelector('#brief-name').value.trim() || '未命名活动',
          highlights: root.querySelector('#brief-highlights').value.trim(),
          slot: root.querySelector('#brief-slot').value,
        };
        const out = root.querySelector('.out-panel[data-out="brief"]');
        btn.disabled = true;
        btn.innerHTML = `${App.icon('clock', 15)}生成中…`;
        out.innerHTML = page.loadingHtml();
        setTimeout(function () {
          const r = App.generateBrief(payload);
          out.innerHTML = page.resultFrame(
            [
              { key: 'slot', text: r.slotApply },
              { key: 'art', text: r.artBrief },
            ],
            'slot',
            [
              { key: 'slot', label: '推荐位申请提需' },
              { key: 'art', label: '美术提需' },
            ]
          );
          page.bindCopyAndTabs(out);
          btn.disabled = false;
          btn.innerHTML = `${App.icon('clipboard', 15)}重新生成`;
          App.toast('提需单已生成（模拟）');
        }, 1200);
      };
    },
  };
})();
