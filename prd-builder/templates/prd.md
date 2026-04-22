# 一、 版本信息
<grid cols="3">
  <column width="33">
    <callout emoji="alarm_clock">
    版本号：{{version}}
    </callout>

  </column>
  <column width="33">
    <callout emoji="calendar">
    创建日期：{{date}}
    </callout>

  </column>
  <column width="33">
    <callout emoji="cop">
    审核人：{{reviewer}}
    </callout>

  </column>
</grid>

# 二、 变更日志

<lark-table rows="1" cols="4" column-widths="109,117,116,399">

  <lark-tr>
    <lark-td>
      <text color="red">{{date}}</text>
    </lark-td>
    <lark-td>
      <text color="red">{{version}}</text>
    </lark-td>
    <lark-td>
      <text color="red">{{author}}</text>
    </lark-td>
    <lark-td>
      1. <text color="red">{{change_1}}</text>
      1. <text color="red">{{change_2}}</text>
      1. <text color="red">{{change_3}}</text>
    </lark-td>
  </lark-tr>
</lark-table>


# 三、 文档说明
## 名词解释

<lark-table rows="3" cols="2" column-widths="179,719">

  <lark-tr>
    <lark-td>
      **术语 / 缩略词** {align="center"}
    </lark-td>
    <lark-td>
      **说明** {align="center"}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      {{term_1}}
    </lark-td>
    <lark-td>
      {{term_1_desc}}
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      {{term_2}}
    </lark-td>
    <lark-td>
      {{term_2_desc}}
    </lark-td>
  </lark-tr>
</lark-table>


# 四、 需求背景
## 产品 / 数据现状

{{现状一句话陈述。例：现有产品在 AI 短剧赛道 demo 阶段，已完成 工作区/图片生成/视频生成/文件管理 4 个模块的 UI 原型，本期需补齐账户、计费、商业化闭环。}}

## 用户调研
<mention-doc token="{{user_research_token}}" type="docx">{{user_research_title}}</mention-doc>；

## 竞品分析
<mention-doc token="{{competitor_token}}" type="docx">{{competitor_title}}</mention-doc>；


# 五、 需求范围
## 模块总览

按用户使用路径排序：登录 → 工作区 → 创作（图片/视频）→ 整理文件 → 计费

<lark-table rows="7" cols="4" header-row="true" column-widths="183,183,183,183">

  <lark-tr>
    <lark-td>编号</lark-td>
    <lark-td>模块名称</lark-td>
    <lark-td>能力描述</lark-td>
    <lark-td>Demo实现状态</lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>1</lark-td>
    <lark-td>{{module_1_name}}</lark-td>
    <lark-td>{{module_1_desc}}</lark-td>
    <lark-td>{{module_1_status}}</lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>2</lark-td>
    <lark-td>{{module_2_name}}</lark-td>
    <lark-td>{{module_2_desc}}</lark-td>
    <lark-td>{{module_2_status}}</lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>3</lark-td>
    <lark-td>{{module_3_name}}</lark-td>
    <lark-td>{{module_3_desc}}</lark-td>
    <lark-td>{{module_3_status}}</lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>4</lark-td>
    <lark-td>{{module_4_name}}</lark-td>
    <lark-td>{{module_4_desc}}</lark-td>
    <lark-td>{{module_4_status}}</lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>5</lark-td>
    <lark-td>{{module_5_name}}</lark-td>
    <lark-td>{{module_5_desc}}</lark-td>
    <lark-td>{{module_5_status}}</lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>6</lark-td>
    <lark-td>{{module_6_name}}</lark-td>
    <lark-td>{{module_6_desc}}</lark-td>
    <lark-td>{{module_6_status}}</lark-td>
  </lark-tr>
</lark-table>

## 说明

**本期不做**：
- {{out_of_scope_1}}
- {{out_of_scope_2}}

**本期做**：
- {{in_scope_1}}
- {{in_scope_2}}


# 六、 功能详细说明

<!--
  每个模块按下面骨架展开。每个功能点严格走 feature-point-template.md 的 grid 模板。
  示例只放一个，实际产出时按模块×功能点全量展开。
-->

## 模块 1：{{module_1_name}}

### 功能点 1.1：{{fp_1_1_name}}
<grid cols="2">
  <column width="40">
    **页面/交互**
    - 触发方式：{{trigger}}
    - 形态/尺寸：{{size}}
    - 元素清单：
      - {{element_1}}
      - {{element_2}}
  </column>
  <column width="60">
    **截图：**
    <image token="待补" width="2559" height="1398" align="center"/>

  </column>
</grid>

**规则**
- {{rule_1}}
- {{rule_2}}
- {{rule_3}}

---

## 模块 2：{{module_2_name}}

### 功能点 2.1：{{fp_2_1_name}}
<!-- 同上骨架 -->


# <text color="red">六（附）、系统架构与核心数据流转</text>

## <text color="red">系统节点说明</text>

<lark-table rows="6" cols="3" header-row="true" column-widths="244,244,244">

  <lark-tr>
    <lark-td><text color="red">节点</text></lark-td>
    <lark-td><text color="red">类型</text></lark-td>
    <lark-td><text color="red">职责</text></lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td><text color="red">{{node_1}}</text></lark-td>
    <lark-td><text color="red">{{node_1_type}}</text></lark-td>
    <lark-td><text color="red">{{node_1_resp}}</text></lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td><text color="red">{{node_2}}</text></lark-td>
    <lark-td><text color="red">{{node_2_type}}</text></lark-td>
    <lark-td><text color="red">{{node_2_resp}}</text></lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td><text color="red">{{node_3}}</text></lark-td>
    <lark-td><text color="red">{{node_3_type}}</text></lark-td>
    <lark-td><text color="red">{{node_3_resp}}</text></lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td><text color="red">{{node_4}}</text></lark-td>
    <lark-td><text color="red">{{node_4_type}}</text></lark-td>
    <lark-td><text color="red">{{node_4_resp}}</text></lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td><text color="red">{{node_5}}</text></lark-td>
    <lark-td><text color="red">{{node_5_type}}</text></lark-td>
    <lark-td><text color="red">{{node_5_resp}}</text></lark-td>
  </lark-tr>
</lark-table>

## <text color="red">流程 1：注册/登录流</text>

```plaintext
{{ascii_flow_1}}
```

<text color="red">**关键设计点**：</text>
- <text color="red">{{flow_1_design_1}}</text>
- <text color="red">{{flow_1_design_2}}</text>

## <text color="red">流程 2：AI 生成调用流（预扣 Token 模式）</text>

```plaintext
{{ascii_flow_2}}
```

<text color="red">**关键设计点**：</text>
- <text color="red">{{flow_2_design_1}}</text>
- <text color="red">{{flow_2_design_2}}</text>

## <text color="red">各方职责总结</text>

<!-- 矩阵表，参见 system-flow-template.md 第六节 -->


# <text color="red">六（附二）、用户旅程图</text>

## <text color="red">旅程 1：新用户从注册到付费转化</text>

```plaintext
{{journey_1}}
```

## <text color="red">旅程 2：付费用户生命周期</text>

```plaintext
{{journey_2}}
```

## <text color="red">旅程 3：异常路径处理</text>

```plaintext
{{journey_3}}
```


# 七、 非功能需求

| 子项 | 要求 |
| --- | --- |
| 性能 | {{performance}} |
| 兼容性 | {{compatibility}} |
| 安全 | {{security}} |
| 国际化 | {{i18n}} |


# 八、 埋点

| 事件 | 触发条件 | 上报字段 |
| --- | --- | --- |
| {{event_1}} | {{trigger_1}} | {{props_1}} |
| {{event_2}} | {{trigger_2}} | {{props_2}} |


# 九、 项目规划

| 周次 | 起止日期 | 模块 | 责任人 | 交付物 |
| --- | --- | --- | --- | --- |
| W1 | {{w1_dates}} | {{w1_module}} | {{w1_owner}} | {{w1_deliverable}} |
| W2 | {{w2_dates}} | {{w2_module}} | {{w2_owner}} | {{w2_deliverable}} |


# 附录

- 接口文档：{{api_doc_link}}
- 原型链接：{{figma_link}}
- 引用飞书文档：{{related_docs}}
