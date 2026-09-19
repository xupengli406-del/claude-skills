---
name: invoice-reimbursement
description: End-to-end Chinese invoice reimbursement workflow covering Feishu email invoice discovery, local download and filing, invoice/itinerary reconciliation, upload preparation, and HuiLianYi draft creation and submission for both travel reimbursements and daily reimbursements. Use when the user mentions 发票报销、差旅报销、日常报销、飞书邮箱发票、汇联易/汇易联, asks to download and organize invoices, associate travel requests, fill reimbursement forms, or submit reimbursement applications.
---

# 发票报销

## Objective

Complete the reimbursement from source evidence to verified submission while preserving every original invoice, amount, date, and association. Optimize for one-pass batch work: collect and reconcile first, then enter HuiLianYi, then read back.

## Required preparation

- Invoke and fully read the `computer-use:computer-use` skill before controlling Feishu or HuiLianYi. Read its guidance, API, and confirmation rules.
- Read [references/file-and-mail-workflow.md](references/file-and-mail-workflow.md) before searching email or organizing files.
- Read [references/huilianyi-workflow.md](references/huilianyi-workflow.md) immediately before creating or editing a HuiLianYi reimbursement.
- Use `scripts/prepare-invoice-upload.ps1` after the source folders are finalized.

## Workflow

### 1. Establish scope

Extract or discover:

- reimbursement type: `差旅报销` or `日常报销`;
- event/purpose, service dates, city, and target folder;
- for travel: the associated travel request and its dates;
- whether the user asks only for organization/draft or also eventual submission.

Discover missing facts from email, files, or HuiLianYi before asking. Never invent an invoice, amount, date, city, travel request, or category.

### 2. Collect from Feishu email

Search a bounded date window using event, city, merchant, airline/train, hotel, taxi platform, “发票”, “电子发票”, and “行程单”. Download invoice attachments and supporting itineraries. Keep source email evidence traceable through filenames or the manifest.

Treat ground transport broadly: flights/trains plus every relevant taxi/ride-hailing trip. For travel, expect transport and lodging unless evidence shows otherwise. For daily reimbursement, infer expense families from invoice content and user purpose; do not force travel categories.

### 3. Organize and reconcile

Create one reimbursement folder per event, then category subfolders. Preserve originals; rename only when it improves traceability and does not overwrite. Keep invoice and corresponding itinerary as separate files.

Run the preparation script to produce:

- an upload ZIP that excludes itinerary/supporting files;
- a CSV manifest with dates, categories, amounts, and matching itineraries;
- count, total, and missing-amount diagnostics.

Resolve every duplicate, missing amount, unexplained gap, or cross-event invoice before data entry. Compare the manifest total to the invoice total independently.

### 4. Create the HuiLianYi draft

Choose the reimbursement type first:

- `差旅报销单`: link the matching travel request before importing invoices.
- `日常报销单`: do not link a travel request; use the daily reimbursement entry.

Import the ZIP through invoice recognition and generate separate expenses. Edit each expense once, in sequence:

- set the actual expense/consumption date, not the invoice issue date;
- set the correct expense category;
- attach each taxi itinerary to its matching taxi invoice;
- set hotel stay dates and destination city;
- classify ticket agency service fees with the corresponding flight/train;
- use invoice nature and company policy for daily reimbursement categories.

Prefer accessibility element indexes from a fresh window state over coordinates. Refresh state after each significant action and after every user interruption.

### 5. Verify before submission

Keep every form in `编辑中` while verifying:

- reimbursement ID and linked travel request, if applicable;
- expense row count and per-row categories/dates;
- invoice total equals reimbursement total and payment total;
- recipient, currency, purpose, city, and attachment presence;
- no invoice appears in more than one reimbursement.

Present a compact review summary to the user. If the user asked to inspect the files first, stop here.

### 6. Submit with action-time confirmation

Immediately before clicking `提交`, show every reimbursement ID, amount, and combined total and ask for explicit confirmation. A prior instruction to prepare the forms is not sufficient if the final IDs and totals were not yet known.

After confirmation, submit each form, handle validation messages, then reopen each reimbursement and read back:

- status;
- exact submitted amount;
- current approval step and processor;
- any rejection or validation issue.

Report only confirmed results.

## Recovery and cleanup

- If Windows locks, stop and ask the user to unlock; never request or enter credentials.
- If a window binding is lost, re-list apps/windows and rehydrate the current Feishu window.
- If the user interacts with the window, refresh state before continuing.
- Never delete or alter original invoices or itineraries.
- After successful upload and verification, send only generated temporary ZIPs/manifests to the Recycle Bin; keep organized source folders.
- If the workflow or company policy is ambiguous, preserve the draft and ask rather than guessing.
