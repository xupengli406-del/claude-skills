# 汇联易录入与校验

## Entry selection

| Scenario | HuiLianYi entry | Association |
|---|---|---|
| 差旅报销 | 新建报销单 → 差旅报销单 | Link the matching travel request first |
| 日常报销 | 新建报销单 → 日常报销单 | No travel request |

Confirm the applicant, company, department, cost center, and purpose before adding expenses.

## Batch invoice import

1. Open `费用明细`.
2. Choose `发票生成费用` → `识别发票文件`.
3. Upload the generated ZIP.
4. Confirm the recognized invoice count and total.
5. Choose `分别生成费用`.
6. Process every generated expense; do not use `跳过` unless the invoice is intentionally excluded and documented.

## Travel mappings

| Evidence | Expense type | Required corrections |
|---|---|---|
| Flight ticket invoice | `交通工具-飞机` | Actual travel date; route optional unless policy requires |
| Train ticket invoice | `交通工具-火车` | Actual travel date |
| Airline/train agency fee | Same transport type | Date of the related ticket |
| Taxi/ride-hailing invoice | `市内交通` | Actual trip date; attach matching itinerary |
| Hotel invoice | `住宿` | Expense date, stay start/end, actual city |

Invoice recognition often uses the invoice issue date. Replace it with the actual expense date from the trip evidence.

## Daily mappings

Use the invoice service/goods name, user purpose, and available company categories. Do not guess a category solely from the merchant name. If multiple categories are plausible, preserve the expense as a draft and ask the user.

## UI control rules

- Capture a fresh window state before each coordinate or indexed action.
- Prefer accessibility indexes for calendars, search results, and buttons.
- In a date field, use the actual date-picker item when available. For range dates, select the start and end calendar items; typed text may not commit.
- Wait for native file dialogs to become focused before typing the full path.
- After file upload, verify the visible filename before saving.
- After the last expense, confirm the row count and total on the report page.

## Pre-submit readback

Verify:

1. report ID;
2. report type and linked travel request;
3. all expense rows and dates;
4. total reimbursement amount;
5. payment row count, recipient, and payment amount;
6. report status remains `编辑中`.

Then ask for action-time confirmation with all IDs and totals.

## Post-submit readback

Submission is successful only when:

- the detail page shows `审批中` or another confirmed submitted state;
- the report amount is unchanged;
- approval history shows a current step/processor.

Return the report ID, amount, state, and current processor. Do not equate returning to the list page with successful submission until the detail page is read back.
