<!--
  feature-point.md — 单个功能点片段模板

  使用方法：
  1. 直接拷贝下面整段（含起始 ### 和末尾 ---）到 PRD 的「六、功能详细说明」对应模块下。
  2. 替换所有 {{占位符}}。
  3. 截图未出时保留 token="待补"，不要删 image 标签。
  4. 严格遵守 feature-point-template.md 的"必填项 checklist"。

  ※ 模板预设左 40% 文字 / 右 60% 截图。如果是反过来或纯文字，参考 feature-point-template.md
     的「格子比例选择」一节调整。
-->

### 功能点 {{x}}.{{y}}：{{feature_point_name}}
<grid cols="2">
  <column width="40">
    **页面/交互**
    - 触发方式：{{trigger}}
    - 形态/尺寸：{{shape_and_size}}

    **{{view_1_name}}**：
    - {{element_1_1}}
    - {{element_1_2}}
    - {{element_1_3}}

    **{{view_2_name}}**：
    - {{element_2_1}}
    - {{element_2_2}}
  </column>
  <column width="60">
    **{{view_1_name}}：**
    <image token="待补" width="2559" height="1398" align="center"/>

    **{{view_2_name}}：**
    <image token="待补" width="2559" height="1398" align="center"/>

  </column>
</grid>

**规则**
- {{业务规则_1}}
- {{状态/校验_2}}
- {{边界/异常_3}}
- {{Mock 标记或第三方对接_4}}

---
