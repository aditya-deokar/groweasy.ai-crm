import type { ImportedRecord, SkippedRecord } from "@/lib/imports/contracts"

const SAMPLE_IMPORT_CSV = [
  "created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description",
  '2026-07-01 10:30,Ananya Mehta,ananya@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,Owner One,GOOD_LEAD_FOLLOW_UP,"Requested a callback",Facebook,2h,"Interested in pricing"',
].join("\n")

export function downloadImportedRecordsCsv(records: ImportedRecord[]) {
  const rows = records.map(({ rowIndex, record }) => ({
    rowIndex,
    ...record,
  }))

  downloadCsv("groweasy-imported-records.csv", rows)
}

export function downloadSkippedRecordsCsv(records: SkippedRecord[]) {
  const rows = records.map((record) => ({
    rowIndex: record.rowIndex,
    reason: record.reason,
    rawData: JSON.stringify(record.rawData),
  }))

  downloadCsv("groweasy-skipped-records.csv", rows)
}

export function downloadSampleCsvTemplate() {
  downloadTextFile(
    "groweasy-sample-import.csv",
    SAMPLE_IMPORT_CSV,
    "text/csv;charset=utf-8;"
  )
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key))
      return set
    }, new Set<string>())
  )

  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    ),
  ]

  downloadTextFile(filename, csvLines.join("\n"), "text/csv;charset=utf-8;")
}

function escapeCsvValue(value: unknown) {
  const rawValue =
    value == null
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value)
  const normalized = escapeSpreadsheetFormula(rawValue)

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }

  return normalized
}

function escapeSpreadsheetFormula(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  if (typeof window === "undefined") {
    return
  }

  const blob = new Blob([content], { type: mimeType })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")

  anchor.href = objectUrl
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(objectUrl)
}
