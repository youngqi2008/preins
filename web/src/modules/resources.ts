export interface Option {
  label: string;
  value: string | number;
}

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'password';
  options?: Option[];
  required?: boolean;
  placeholder?: string;
  section?: string;
  optionsFrom?: {
    endpoint: string;
    label: string;
    value: string;
    fill?: string;
    fillFrom?: string;
  };
}

export interface ColumnDef {
  key: string;
  label: string;
  options?: Option[];
  width?: string;
}

export interface ResourceDef {
  key: string;
  title: string;
  group: string;
  subtitle: string;
  endpoint: string;
  columns: ColumnDef[];
  search: FieldDef[];
  fields: FieldDef[];
  creatable?: boolean;
  editable?: boolean;
  deletable?: boolean;
  copyable?: boolean;
}

const online = [
  { label: '下线', value: 0 },
  { label: '在线', value: 1 },
];

const online3 = [
  { label: '下线', value: 0 },
  { label: '在线', value: 1 },
  { label: '拉空', value: 2 },
];

const settle = [
  { label: '下载', value: 0 },
  { label: '安装', value: 1 },
  { label: '激活', value: 2 },
  { label: '注册', value: 3 },
  { label: '次留', value: 4 },
  { label: '召回', value: 5 },
  { label: '付费', value: 6 },
  { label: '7日留存', value: 7 },
  { label: '拉活', value: 9 },
];

const interval = [
  { label: '天', value: 0 },
  { label: '周', value: 1 },
  { label: '月', value: 2 },
  { label: '季', value: 3 },
  { label: '年', value: 4 },
];

const priceType = [
  { label: 'CPM', value: 0 },
  { label: 'CPC', value: 1 },
  { label: 'CPA', value: 2 },
];

const transResult = [
  { label: '点击', value: 0 },
  { label: '表单留资', value: 1 },
  { label: '领取', value: 2 },
  { label: '下单', value: 3 },
];

const osType = [
  { label: 'Android', value: 1 },
  { label: 'iOS', value: 2 },
];

const rewardSide = [
  { label: '我方', value: 0 },
  { label: '渠道方', value: 1 },
];

const taskTypes = [
  { label: '应用下载', value: '0' },
  { label: '游戏试玩', value: '1' },
  { label: '文章阅读', value: '2' },
];

const pkgType = [
  { label: '电商活动', value: 0 },
  { label: '品牌宣传', value: 1 },
  { label: '表单留资', value: 2 },
  { label: '游戏活动', value: 3 },
  { label: '其它', value: 4 },
];

const payStatus = [
  { label: '未完成', value: 0 },
  { label: '审核中', value: 1 },
  { label: '未发奖', value: 2 },
  { label: '发奖成功', value: 3 },
  { label: '发奖失败', value: 4 },
  { label: '驳回', value: 5 },
];

const orderType = [
  { label: '应用下载', value: 0 },
  { label: '游戏试玩', value: 1 },
];

const attribution = [
  { label: '广告主归因', value: 0 },
  { label: '自归因', value: 1 },
];

const yesNo = [
  { label: '否', value: 0 },
  { label: '是', value: 1 },
];

const jumpType = [
  { label: '跳转链接', value: 0 },
  { label: '复制链接', value: 1 },
];

export const resources: ResourceDef[] = [
  {
    key: 'customer',
    title: '广告主管理',
    group: '推广',
    subtitle: '维护广告主账户、联系人与安全密钥',
    endpoint: '/preinstall/cTCustomer',
    columns: [
      { key: 'id', label: 'ID', width: '160px' },
      { key: 'componyid', label: '公司编号', width: '140px' },
      { key: 'compony', label: '公司名称' },
      { key: 'contact', label: '联系人', width: '120px' },
      { key: 'mobile', label: '电话', width: '140px' },
      { key: 'address', label: '常用地址' },
      { key: 'createTime', label: '入驻时间', width: '180px' },
    ],
    search: [
      { key: 'componyid', label: '公司编号', placeholder: '公司编号' },
      { key: 'compony', label: '公司名称', placeholder: '公司名称' },
      { key: 'contact', label: '联系人', placeholder: '联系人' },
    ],
    fields: [
      { key: 'componyid', label: '公司编号', required: true, section: '基本信息' },
      { key: 'compony', label: '公司名称', required: true },
      { key: 'contact', label: '联系人', required: true },
      { key: 'mobile', label: '电话' },
      { key: 'address', label: '常用地址', type: 'textarea' },
      { key: 'seckey', label: '安全密钥', section: '安全' },
    ],
  },
  {
    key: 'channel',
    title: '分销渠道管理',
    group: '推广',
    subtitle: '管理渠道接入、奖励货币与回调地址',
    endpoint: '/preinstall/cTDistribution',
    columns: [
      { key: 'id', label: 'ID', width: '150px' },
      { key: 'componyid', label: '渠道编号', width: '130px' },
      { key: 'compony', label: '渠道名称' },
      { key: 'contact', label: '联系人', width: '110px' },
      { key: 'mobile', label: '电话', width: '130px' },
      { key: 'ostype', label: '系统', width: '110px', options: osType },
      { key: 'currency', label: '货币', width: '100px' },
      { key: 'exchangerate', label: '汇率', width: '90px' },
      { key: 'createTime', label: '入驻时间', width: '170px' },
    ],
    search: [
      { key: 'id', label: 'ID', placeholder: '渠道 ID' },
      { key: 'componyid', label: '渠道编号', placeholder: '渠道编号' },
      { key: 'compony', label: '渠道名称', placeholder: '渠道名称' },
      { key: 'contact', label: '联系人', placeholder: '联系人' },
    ],
    fields: [
      { key: 'componyid', label: '渠道编号', required: true, section: '基本信息' },
      { key: 'compony', label: '渠道名称', required: true },
      { key: 'ostype', label: '系统类型', type: 'select', options: osType },
      { key: 'contact', label: '联系人' },
      { key: 'mobile', label: '电话' },
      { key: 'address', label: '常用地址', type: 'textarea' },
      { key: 'ifthird', label: '奖励体系', type: 'select', options: rewardSide, section: '奖励' },
      { key: 'currency', label: '货币名称' },
      { key: 'exchangerate', label: '货币汇率', type: 'number', placeholder: '1 元可兑换额度' },
      { key: 'currencyname', label: '货币单位' },
      { key: 'tasktypes', label: '接入任务类型', type: 'select', options: taskTypes },
      { key: 'callbackurl', label: '任务回调地址', section: '接口', type: 'textarea' },
      { key: 'loginurl', label: '登录检验接口', type: 'textarea' },
      { key: 'orderpushurl', label: '订单/发奖推送', type: 'textarea' },
      { key: 'taskpushurl', label: '任务量推送接口', type: 'textarea' },
      { key: 'appid', label: 'appId', section: '密钥' },
      { key: 'appsecret', label: 'appSecret / RSA 私钥', type: 'textarea' },
      { key: 'rsapubkey', label: 'RSA 公钥', type: 'textarea' },
      { key: 'seckey', label: '密钥' },
    ],
  },
  {
    key: 'product',
    title: '产品管理',
    group: '推广',
    subtitle: '管理 H5 活动物料、分类与投放周期',
    endpoint: '/preinstall/cTInspackages',
    columns: [
      { key: 'id', label: 'ID', width: '150px' },
      { key: 'appname', label: '活动名称' },
      { key: 'pkgfrom', label: '渠道来源', width: '140px' },
      { key: 'pkgtype', label: '分类', width: '120px', options: pkgType },
      { key: 'startTime', label: '开始', width: '170px' },
      { key: 'endTime', label: '结束', width: '170px' },
      { key: 'createTime', label: '创建时间', width: '170px' },
    ],
    search: [
      { key: 'id', label: 'ID', placeholder: '产品 ID' },
      { key: 'appname', label: '活动名称', placeholder: 'H5 活动名称' },
    ],
    fields: [
      { key: 'appname', label: 'H5 活动名称', required: true, section: '活动' },
      { key: 'pkgfrom', label: '投放渠道来源' },
      { key: 'pkgtype', label: '分类标签', type: 'select', options: pkgType },
      { key: 'appdesc', label: '活动描述', type: 'textarea' },
      { key: 'logourl', label: '封面图地址', section: '物料' },
      { key: 'images', label: '内页截图', type: 'textarea', placeholder: '多个地址用逗号分隔' },
      { key: 'startTime', label: '活动开始', type: 'date', required: true, section: '周期' },
      { key: 'endTime', label: '活动结束', type: 'date', required: true },
    ],
  },
  {
    key: 'budget',
    title: '广告投放管理',
    group: '推广',
    subtitle: '管理投放预算、结算规则与上下线状态',
    endpoint: '/preinstall/cTBudget',
    columns: [
      { key: 'id', label: '计划 ID', width: '150px' },
      { key: 'taskname', label: '计划名称' },
      { key: 'supplier', label: '广告主账户' },
      { key: 'upprice', label: '计划总预算', width: '120px' },
      { key: 'transobjdesc', label: '结算规则' },
      { key: 'onlinestatus', label: '状态', width: '90px', options: online3 },
      { key: 'createTime', label: '创建时间', width: '170px' },
      { key: 'updateTime', label: '更新时间', width: '170px' },
    ],
    search: [
      { key: 'id', label: '计划 ID', placeholder: '计划 ID' },
      { key: 'taskname', label: '计划名称', placeholder: '计划名称' },
      {
        key: 'supplierid',
        label: '广告主',
        type: 'select',
        placeholder: '全部广告主',
        optionsFrom: { endpoint: '/preinstall/cTCustomer', label: 'compony', value: 'id' },
      },
      { key: 'onlinestatus', label: '状态', type: 'select', options: online3, placeholder: '全部状态' },
    ],
    fields: [
      { key: 'taskname', label: '计划名称', required: true, section: '计划' },
      {
        key: 'supplierid',
        label: '广告主账户',
        type: 'select',
        required: true,
        optionsFrom: {
          endpoint: '/preinstall/cTCustomer',
          label: 'compony',
          value: 'id',
          fill: 'supplier',
          fillFrom: 'compony',
        },
      },
      { key: 'appname', label: 'APP / 活动名称' },
      { key: 'appid', label: 'APPID' },
      { key: 'onlinestatus', label: '投放状态', type: 'select', options: online3 },
      { key: 'upprice', label: '计划总预算', type: 'number', required: true, section: '预算与结算' },
      { key: 'pricetype', label: '出价方式', type: 'select', options: priceType },
      { key: 'transobj', label: '结算指标', type: 'select', options: settle },
      { key: 'transobjdesc', label: '结算规则描述' },
      { key: 'transresult', label: '转化目标', type: 'select', options: transResult },
      { key: 'intervaltype', label: '投放周期类型', type: 'select', options: interval },
      { key: 'intervalnum', label: '投放周期数量', type: 'number' },
      { key: 'totalnum', label: '任务总数量', type: 'number' },
      { key: 'weight', label: '权重', type: 'number' },
      { key: 'daystart', label: '每日开始时段', type: 'number', placeholder: '0-23' },
      { key: 'daystop', label: '每日结束时段', type: 'number', placeholder: '0-23' },
      { key: 'startTime', label: '投放开始', type: 'date', section: '周期与定向' },
      { key: 'endTime', label: '投放结束', type: 'date' },
      { key: 'addirect', label: '投放定向' },
      { key: 'putchannel', label: '投放渠道' },
      { key: 'putchannelid', label: '投放渠道 ID' },
      { key: 'downurl', label: '下载地址', type: 'textarea', section: '物料与回调' },
      { key: 'h5url', label: '落地 H5 链接', type: 'textarea' },
      { key: 'h5cont', label: 'H5 物料', type: 'textarea' },
      { key: 'rtaurl', label: 'RTA 接口', type: 'textarea' },
      { key: 'expreporturl', label: '曝光回调地址', type: 'textarea' },
      { key: 'clireporturl', label: '点击回调地址', type: 'textarea' },
      { key: 'transcallback', label: '转化回调地址', type: 'textarea' },
    ],
  },
  {
    key: 'plan',
    title: '投放计划',
    group: '推广',
    subtitle: '把预算分配到渠道，配置单价、回调与上下线',
    endpoint: '/preinstall/cTDowntask',
    copyable: true,
    columns: [
      { key: 'id', label: '任务 ID', width: '150px' },
      { key: 'taskname', label: '计划名称' },
      { key: 'putchannel', label: '投放渠道' },
      { key: 'channelprice', label: '强国分润单价', width: '130px' },
      { key: 'weight', label: '权重', width: '80px' },
      { key: 'onlinestatus', label: '状态', width: '90px', options: online },
      { key: 'startTime', label: '开始', width: '170px' },
      { key: 'endTime', label: '结束', width: '170px' },
    ],
    search: [
      { key: 'id', label: '任务 ID', placeholder: '任务 ID' },
      { key: 'taskname', label: '计划名称', placeholder: '计划名称' },
      { key: 'putchannel', label: '投放渠道', placeholder: '渠道名称' },
      { key: 'onlinestatus', label: '状态', type: 'select', options: online, placeholder: '全部状态' },
    ],
    fields: [
      { key: 'taskname', label: '计划名称', required: true, section: '计划' },
      { key: 'taskdesc', label: '计划备注', type: 'textarea' },
      {
        key: 'putchannelid',
        label: '投放渠道',
        type: 'select',
        optionsFrom: {
          endpoint: '/preinstall/cTDistribution',
          label: 'compony',
          value: 'id',
          fill: 'putchannel',
          fillFrom: 'compony',
        },
      },
      {
        key: 'supplierid',
        label: '广告主',
        type: 'select',
        optionsFrom: {
          endpoint: '/preinstall/cTCustomer',
          label: 'compony',
          value: 'id',
          fill: 'supplier',
          fillFrom: 'compony',
        },
      },
      { key: 'appname', label: '应用名称' },
      { key: 'appid', label: 'APPID' },
      { key: 'onlinestatus', label: '投放状态', type: 'select', options: online },
      { key: 'upprice', label: '供应商报价', type: 'number', section: '价格' },
      { key: 'channelprice', label: '强国分润单价', type: 'number' },
      { key: 'outprice', label: '任务奖励金额', type: 'number' },
      { key: 'weight', label: '投放权重', type: 'number' },
      { key: 'transobj', label: '用户转化目标', type: 'select', options: settle },
      { key: 'chnsettlement', label: '渠道结算依据', type: 'select', options: settle },
      { key: 'attributiontype', label: '归因方式', type: 'select', options: attribution, section: '上报' },
      { key: 'iswaittime', label: '上报延时', type: 'select', options: yesNo },
      { key: 'minwaittime', label: '最小延时', type: 'number' },
      { key: 'maxwaittime', label: '最大延时', type: 'number' },
      { key: 'reportcount', label: '延时发送条数', type: 'number' },
      { key: 'actionctrl', label: '落地跳转方式', type: 'select', options: jumpType },
      { key: 'startTime', label: '投放开始', type: 'date', section: '周期与物料' },
      { key: 'endTime', label: '投放结束', type: 'date' },
      { key: 'downurl', label: '下载地址', type: 'textarea' },
      { key: 'reporturl', label: '事件回调地址', type: 'textarea' },
      { key: 'rtaurl', label: 'RTA 人群接口', type: 'textarea' },
      { key: 'egimgs', label: '创意配图地址', type: 'textarea' },
      { key: 'egvideo', label: '创意视频地址', type: 'textarea' },
    ],
  },
  {
    key: 'order',
    title: '计划明细',
    group: '推广',
    subtitle: '查看计划消费、发奖状态与审核说明',
    endpoint: '/preinstall/cTOrder',
    columns: [
      { key: 'id', label: '订单号', width: '160px' },
      { key: 'userid', label: '用户 ID', width: '140px' },
      { key: 'channel', label: '来源渠道', width: '120px' },
      { key: 'taskname', label: '任务名称' },
      { key: 'taskid', label: '任务 ID', width: '140px' },
      { key: 'budgetid', label: '预算 ID', width: '140px' },
      { key: 'tasktype', label: '类型', width: '110px', options: orderType },
      { key: 'outprice', label: '奖励金额', width: '110px' },
      { key: 'paystatus', label: '发奖状态', width: '110px', options: payStatus },
      { key: 'createTime', label: '订单时间', width: '170px' },
    ],
    search: [
      { key: 'userid', label: '用户 ID', placeholder: '用户 ID' },
      { key: 'id', label: '订单号', placeholder: '订单号' },
      { key: 'channel', label: '来源渠道', placeholder: '渠道' },
      { key: 'taskid', label: '任务 ID', placeholder: '任务 ID' },
      { key: 'budgetid', label: '预算 ID', placeholder: '预算 ID' },
      { key: 'paystatus', label: '发奖状态', type: 'select', options: payStatus, placeholder: '全部' },
    ],
    fields: [
      { key: 'userid', label: '用户 ID', required: true, section: '订单' },
      { key: 'channel', label: '来源渠道' },
      { key: 'chnaneluserid', label: '渠道用户 ID' },
      { key: 'tasktype', label: '任务类型', type: 'select', options: orderType },
      { key: 'taskid', label: '任务 ID' },
      { key: 'taskname', label: '任务名称' },
      { key: 'budgetid', label: '预算 ID' },
      { key: 'taskevent', label: '发奖事件' },
      { key: 'outprice', label: '奖励金额', type: 'number', section: '发奖' },
      { key: 'channelprice', label: '开发者分润', type: 'number' },
      { key: 'paystatus', label: '发奖处理', type: 'select', options: payStatus },
      { key: 'payTime', label: '结算日期', type: 'date' },
      { key: 'reviewnote', label: '审核说明', type: 'textarea' },
      { key: 'downimg', label: '下载截图', section: '凭证' },
      { key: 'insimg', label: '安装截图' },
      { key: 'regimg', label: '注册截图' },
      { key: 'day2img', label: '次留截图' },
      { key: 'day7img', label: '7日留存截图' },
      { key: 'payimg', label: '支付截图' },
    ],
  },
  {
    key: 'callback',
    title: '回调日志',
    group: '推广',
    subtitle: '追踪转化回调的校验结果、上报 IP 与原始参数',
    endpoint: '/preinstall/cTCallback',
    creatable: false,
    editable: false,
    columns: [
      { key: 'createTime', label: '上报时间', width: '170px' },
      { key: 'taskid', label: '广告计划 ID', width: '150px' },
      { key: 'budgetid', label: '预算 ID', width: '140px' },
      { key: 'orderid', label: '订单 ID', width: '140px' },
      { key: 'eventtype', label: '事件类型', width: '100px' },
      { key: 'ipaddr', label: '上报 IP', width: '140px' },
      { key: 'userid', label: '设备指纹' },
      { key: 'crcresult', label: '校验结果', width: '100px' },
      { key: 'respcode', label: '返回码', width: '100px' },
    ],
    search: [
      { key: 'userid', label: '设备指纹', placeholder: '设备指纹' },
      { key: 'taskid', label: '广告计划 ID', placeholder: '计划 ID' },
      { key: 'orderid', label: '订单 ID', placeholder: '订单 ID' },
      { key: 'budgetid', label: '预算 ID', placeholder: '预算 ID' },
    ],
    fields: [
      { key: 'taskid', label: '广告计划 ID' },
      { key: 'budgetid', label: '预算 ID' },
      { key: 'orderid', label: '订单 ID' },
      { key: 'ader', label: '广告主' },
      { key: 'chnid', label: '渠道 ID' },
      { key: 'userid', label: '设备指纹' },
      { key: 'eventtype', label: '事件类型' },
      { key: 'optype', label: '操作结果值' },
      { key: 'transobj', label: '内部结果' },
      { key: 'crcresult', label: '校验结果' },
      { key: 'respcode', label: '返回码' },
      { key: 'ipaddr', label: '上报 IP' },
      { key: 'cburl', label: '回调 URL', type: 'textarea' },
      { key: 'paras', label: '原始参数', type: 'textarea' },
    ],
  },
];

export function findResource(key: string) {
  return resources.find((item) => item.key === key);
}
