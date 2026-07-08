# Frontend Specification — AI CSV Importer for GrowEasy CRM

## 1. Project Goal

Build a modern, responsive frontend for an AI-powered CSV Importer that allows users to upload any valid CSV file, preview the raw data, confirm the import, and view AI-extracted CRM-ready records in GrowEasy CRM format.

The frontend should feel like a real SaaS CRM import feature, not just a simple file upload page.

---

## 2. Core Frontend Flow

```text
User uploads CSV
        ↓
Frontend parses CSV locally
        ↓
Show raw CSV preview table
        ↓
User clicks Confirm Import
        ↓
Show AI processing/loading state
        ↓
Receive structured CRM records from backend
        ↓
Show import summary
        ↓
Display parsed records and skipped records
```

---

## 3. Screens / UI Sections

### 3.1 Header Section

The page should clearly explain what the tool does.

Suggested content:

```text
AI CSV Importer for GrowEasy CRM
Upload messy CSV files and convert them into clean CRM-ready leads.
```

Header should include:

- Product title
- Short subtitle
- Optional badge: `AI Powered`
- Optional theme toggle for dark mode

---

### 3.2 Upload Section

Users should be able to upload a CSV file easily.

Required features:

- Drag and drop CSV upload
- File picker button
- Accept only `.csv` files
- Show selected file name
- Show file size
- Show error if invalid file type is uploaded

Upload area states:

```text
Default State:
Drag & drop your CSV file here or click to browse.

File Selected State:
filename.csv selected successfully.

Error State:
Only CSV files are supported.
```

---

### 3.3 Raw CSV Preview Section

After uploading, the frontend should parse and preview the CSV before calling the backend.

Important rule:

```text
No AI processing should happen before user confirmation.
```

Preview table should show:

- Column headers from uploaded CSV
- First set of parsed rows
- Total row count
- Total column count
- Horizontal scrolling
- Vertical scrolling
- Sticky table headers
- Responsive layout

Suggested UI cards above table:

```text
File Name
Total Rows
Total Columns
Ready to Import
```

Table requirements:

- Sticky header
- Minimum column width
- Horizontal scroll for many columns
- Max height with vertical scroll
- Empty cell fallback: `—`
- Clean styling with borders or row separation

---

### 3.4 Confirm Import Section

After preview, user should manually confirm the import.

Required features:

- `Confirm Import` button
- Button disabled if:
  - No file uploaded
  - CSV parsing failed
  - CSV has zero rows
  - Import is already processing

Suggested button states:

```text
Default:
Confirm Import

Processing:
Processing CSV...

Disabled:
Upload a CSV first
```

On click:

```text
Send parsed CSV data or uploaded file to backend API.
```

---

### 3.5 AI Processing State

After confirmation, show a clear loading experience while backend processes records using AI.

Required UI:

- Loading spinner or progress bar
- Status text
- Disable upload and confirm actions during processing

Suggested status messages:

```text
Uploading CSV...
Analyzing columns...
Mapping fields using AI...
Validating CRM records...
Preparing import summary...
```

Bonus feature:

```text
Processing batch 2 of 5
```

If backend supports progress, show real batch progress.  
If not, show a smooth indeterminate progress bar.

---

### 3.6 Import Summary Section

After successful backend response, show high-level import results.

Summary cards:

```text
Total Rows
Successfully Parsed
Skipped Records
Import Accuracy
```

Example:

```text
Total Rows: 250
Successfully Parsed: 230
Skipped Records: 20
```

This section should be visually clear because it quickly shows whether the import worked.

---

### 3.7 Parsed CRM Records Table

Show successfully parsed records in GrowEasy CRM format.

Columns:

```text
created_at
name
email
country_code
mobile_without_country_code
company
city
state
country
lead_owner
crm_status
crm_note
data_source
possession_time
description
```

Table features:

- Horizontal scroll
- Vertical scroll
- Sticky header
- Search/filter support preferred
- Status badge for `crm_status`
- Empty values shown as `—`
- Long notes truncated with tooltip or expandable cell

CRM status badge values:

```text
GOOD_LEAD_FOLLOW_UP
DID_NOT_CONNECT
BAD_LEAD
SALE_DONE
```

---

### 3.8 Skipped Records Section

Show records that were skipped and explain why.

Required columns:

```text
Row Number
Reason
Original Data
```

Common skipped reason:

```text
Missing email and mobile number
```

UI requirements:

- Make skipped records easy to inspect
- Allow original data to be expanded or viewed in JSON-style format
- Show this section only if skipped records exist

Suggested empty state:

```text
No skipped records. All valid leads were imported successfully.
```

---

### 3.9 Download / Export Section

Bonus but highly recommended.

Allow users to download the final parsed CRM data.

Features:

- Download parsed records as CSV
- Download skipped records as CSV or JSON
- Button disabled if no parsed records exist

Suggested buttons:

```text
Download CRM CSV
Download Skipped Records
```

This feature makes the project feel more practical and production-ready.

---

## 4. Frontend Features Checklist

### Must-Have Features

- Responsive web application
- CSV upload using file picker
- Drag and drop upload
- Client-side CSV parsing for preview
- Raw CSV preview table
- Sticky table headers
- Horizontal and vertical table scrolling
- Confirm Import button
- Backend API call only after confirmation
- Loading state during processing
- Parsed CRM records table
- Skipped records table
- Import summary cards
- Error handling
- Empty states
- Clean UI and folder structure

---

### Good-to-Have Features

- Dark mode
- Progress indicator
- Batch processing progress UI
- Download parsed CRM CSV
- Download skipped records
- Search in parsed records
- Filter by CRM status
- Reset upload button
- Sample CSV download buttons
- Toast notifications
- Table virtualization for large CSV files

---

### Advanced Bonus Features

- Virtualized table for large CSV previews
- Column visibility toggle
- AI confidence score display if backend provides it
- Editable parsed records before final download
- Manual correction UI for skipped records
- Import history if database is added later
- Keyboard-accessible upload and table controls

---

## 5. Main Components

Suggested component structure:

```text
components/
├── upload-zone.tsx
├── csv-preview-table.tsx
├── import-summary.tsx
├── processing-progress.tsx
├── parsed-records-table.tsx
├── skipped-records-table.tsx
├── download-actions.tsx
├── empty-state.tsx
├── error-alert.tsx
└── theme-toggle.tsx
```

---

## 6. Suggested Page Structure

```text
app/
└── page.tsx
```

Page layout:

```text
Page Header
    ↓
Upload Zone
    ↓
Raw CSV Preview
    ↓
Confirm Import Button
    ↓
Processing State
    ↓
Import Summary
    ↓
Tabs:
    - Parsed Records
    - Skipped Records
    ↓
Download Actions
```

---

## 7. Frontend State Management

Suggested states:

```ts
type ImportStep = "idle" | "preview" | "processing" | "completed" | "error";
```

Main state values:

```ts
uploadedFile
rawRows
rawColumns
parsedRecords
skippedRecords
importSummary
isProcessing
errorMessage
currentStep
```

Recommended approach:

- Use React state for simple flow
- Use custom hooks for CSV parsing and API calls
- Avoid unnecessary global state unless the app grows

Suggested hooks:

```text
hooks/
├── use-csv-parser.ts
├── use-import-csv.ts
└── use-download-csv.ts
```

---

## 8. API Integration Contract

Frontend should call backend only after the user clicks `Confirm Import`.

Suggested endpoint:

```http
POST /api/import/csv
```

Request can be either:

```text
Option 1: multipart/form-data with CSV file
Option 2: JSON with parsed records
```

Recommended frontend approach:

```text
Send the original CSV file as FormData.
```

Expected response shape:

```json
{
  "success": true,
  "summary": {
    "totalRows": 250,
    "imported": 230,
    "skipped": 20
  },
  "records": [],
  "skippedRecords": []
}
```

Frontend should not assume the backend will always return perfect data.  
It should handle missing fields, empty arrays, and error responses gracefully.

---

## 9. Error Handling

Frontend should handle these cases:

### File Upload Errors

```text
Invalid file type
Empty CSV file
CSV parsing failed
File too large
```

### API Errors

```text
Backend not reachable
AI processing failed
Invalid response format
Request timeout
```

### UI Error States

Show clear messages like:

```text
Something went wrong while processing your CSV. Please try again.
```

Avoid showing raw technical errors directly to the user.

---

## 10. Empty States

Use friendly empty states for better UX.

Examples:

### Before Upload

```text
Upload a CSV file to preview your leads.
```

### No Parsed Records

```text
No valid CRM records were found.
```

### No Skipped Records

```text
Great! No records were skipped.
```

---

## 11. Responsive Design Requirements

The app should work properly on:

- Desktop
- Tablet
- Mobile

Important responsive rules:

- Upload section should stack on mobile
- Tables should scroll horizontally
- Summary cards should become single-column on mobile
- Buttons should be full-width on small screens
- Text should not overflow outside cards

---

## 12. UX Details That Will Impress

Add small details that make the app feel premium:

- Smooth drag-over effect on upload zone
- Toast after successful upload
- Toast after successful import
- Clean loading messages
- Status badges for CRM status
- Proper disabled button states
- Reset button to upload another file
- Clear visual separation between raw preview and final CRM data
- Table row hover effect
- Truncated long text with tooltip

---

## 13. Suggested Tech Stack

```text
Framework: Next.js
Language: TypeScript
Styling: Tailwind CSS
UI Components: shadcn/ui
CSV Parsing: PapaParse
Drag & Drop: react-dropzone
Tables: TanStack Table
Validation: Zod
Notifications: Sonner
Icons: Lucide React
```

Optional:

```text
Virtualization: TanStack Virtual
Theme: next-themes
```

---

## 14. Frontend Non-Goals

The frontend should not:

- Perform AI extraction directly
- Store imported leads permanently
- Assume fixed CSV column names
- Auto-import immediately after upload
- Hide skipped records
- Ignore empty or invalid files

---

## 15. Final Frontend Acceptance Criteria

The frontend is complete when:

- User can upload a CSV file
- User can preview raw CSV data before AI processing
- User can confirm import manually
- User sees a loading/progress state
- User sees successfully parsed CRM records
- User sees skipped records with reasons
- User sees import summary
- UI is responsive and polished
- Errors are handled clearly
- Code is clean, typed, and reusable

---

## 16. Suggested README Line

```text
The frontend is designed as a production-style CRM import experience where users can safely preview messy CSV data before confirming AI-powered extraction into GrowEasy CRM format.
```
