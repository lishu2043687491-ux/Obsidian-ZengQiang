export type AdvancedTableActionId =
  | 'next-cell'
  | 'previous-cell'
  | 'next-row'
  | 'escape-table'
  | 'format-table'
  | 'format-all-tables'
  | 'insert-column'
  | 'insert-row'
  | 'delete-column'
  | 'delete-row'
  | 'move-column-left'
  | 'move-column-right'
  | 'move-row-up'
  | 'move-row-down'
  | 'left-align-column'
  | 'center-align-column'
  | 'right-align-column'
  | 'sort-rows-ascending'
  | 'sort-rows-descending'
  | 'transpose'
  | 'evaluate-formulas'
  | 'export-csv'
  | 'table-control-bar';

export type AdvancedTableAction = {
  id: AdvancedTableActionId;
  label: string;
  icon: string;
  danger?: boolean;
};

export type AdvancedTableActionGroup = {
  label: string;
  hint: string;
  actions: AdvancedTableAction[];
};

export const ADVANCED_TABLE_ACTION_GROUPS: AdvancedTableActionGroup[] = [
  {
    label: '单元格跳转',
    hint: '在表格中移动，不改变单元格内容。',
    actions: [
      { id: 'next-cell', label: '下一个单元格', icon: 'arrowtab' },
      { id: 'previous-cell', label: '上一个单元格', icon: 'arrow-left' },
      { id: 'next-row', label: '下一行', icon: 'arrowenter' },
      { id: 'escape-table', label: '跳出表格', icon: 'log-out' },
    ],
  },
  {
    label: '格式与对齐',
    hint: '使用 Advanced Tables 原版格式化与列对齐。',
    actions: [
      { id: 'format-table', label: '格式化当前表格', icon: 'wand-sparkles' },
      { id: 'format-all-tables', label: '格式化本页全部表格', icon: 'file-spreadsheet' },
      { id: 'left-align-column', label: '当前列左对齐', icon: 'alignLeft' },
      { id: 'center-align-column', label: '当前列居中', icon: 'alignCenter' },
      { id: 'right-align-column', label: '当前列右对齐', icon: 'alignRight' },
    ],
  },
  {
    label: '行操作',
    hint: '按光标所在行执行。',
    actions: [
      { id: 'insert-row', label: '上方插入行', icon: 'insertRow' },
      { id: 'move-row-up', label: '当前行上移', icon: 'moveRowUp' },
      { id: 'move-row-down', label: '当前行下移', icon: 'moveRowDown' },
      { id: 'delete-row', label: '删除当前行', icon: 'deleteRow', danger: true },
    ],
  },
  {
    label: '列操作',
    hint: '按光标所在列执行。',
    actions: [
      { id: 'insert-column', label: '左侧插入列', icon: 'insertColumn' },
      { id: 'move-column-left', label: '当前列左移', icon: 'moveColumnLeft' },
      { id: 'move-column-right', label: '当前列右移', icon: 'moveColumnRight' },
      { id: 'delete-column', label: '删除当前列', icon: 'deleteColumn', danger: true },
    ],
  },
  {
    label: '数据处理',
    hint: '排序、转置和公式均沿用 Advanced Tables 原版逻辑。',
    actions: [
      { id: 'sort-rows-ascending', label: '按当前列升序', icon: 'sortAsc' },
      { id: 'sort-rows-descending', label: '按当前列降序', icon: 'sortDesc' },
      { id: 'transpose', label: '转置表格', icon: 'transpose' },
      { id: 'evaluate-formulas', label: '计算表格公式', icon: 'formula' },
    ],
  },
  {
    label: '导出与备用入口',
    hint: '导出逗号分隔文本，或打开原版右侧工具栏。',
    actions: [
      { id: 'export-csv', label: '导出 CSV', icon: 'csv' },
      { id: 'table-control-bar', label: '打开右侧工具栏', icon: 'panel-right-open' },
    ],
  },
];

export const ADVANCED_TABLE_ACTION_IDS = new Set<AdvancedTableActionId>(
  ADVANCED_TABLE_ACTION_GROUPS.flatMap((group) => group.actions.map((action) => action.id)),
);
