# 邮件检索与文件整理

## 邮件检索

1. Start with the reimbursement service dates.
2. Search from three days before the start through seven days after the end; extend only when invoices arrive later.
3. Combine these terms:
   - purpose/event and city;
   - `发票`, `电子发票`, `行程单`, `报销凭证`;
   - airline/train number, hotel, taxi platform, ticket agent, booking platform.
4. Inspect threads and attachments, not only subject lines.
5. Download both invoice and supporting evidence. Do not treat an itinerary or order screenshot as an invoice.
6. Record unresolved gaps instead of silently omitting them.

## Folder convention

Use one root folder and one numbered folder per reimbursement:

```text
报销事项根目录/
├── 01_事项名称_YYYY-MM-DD至MM-DD/
│   ├── 交通/
│   │   ├── 飞机/
│   │   ├── 火车/
│   │   └── 打车/
│   └── 住宿/
└── 02_事项名称_YYYY-MM-DD至MM-DD/
```

For daily reimbursement, replace travel folders with evidence-based expense families:

```text
日常报销_事项名称_YYYY-MM-DD/
├── 办公及软件/
├── 业务招待/
├── 市内交通/
└── 其他待确认/
```

Do not create empty category folders unless they help the user inspect expected-but-missing evidence.

## Filename convention

Prefer:

```text
YYYY-MM-DD_商户或路线_发票_金额元.ext
YYYY-MM-DD_商户或路线_行程单_金额元.ext
YYYY-MM-DD至MM-DD_酒店_金额元.ext
```

Preserve the original extension. Avoid overwriting; add a short disambiguator for duplicates.

## Prepare the upload bundle

Run:

```powershell
powershell -ExecutionPolicy Bypass -File "<skill>/scripts/prepare-invoice-upload.ps1" `
  -SourcePath "<one reimbursement folder>"
```

Optional:

```powershell
-OutputDirectory "<temporary folder>"
```

The script excludes filenames containing `行程单`, `订单截图`, `订单明细`, or `说明`; all other supported invoice files are included. Review the CSV before uploading. Missing amounts remain blank and must be resolved manually.

## Reconciliation checklist

- Each invoice belongs to exactly one reimbursement.
- Taxi invoice amount/date matches its itinerary.
- Hotel stay overlaps the associated travel request.
- Flight/train route and date fit the trip.
- Agency fee is kept separate but associated with its ticket.
- Manifest count equals invoice count.
- Sum of known amounts equals the intended reimbursement total.
- Source folders remain untouched after creating the upload bundle.
