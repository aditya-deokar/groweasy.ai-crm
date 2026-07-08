param(
  [string]$BaseUrl = "http://localhost:5000",
  [string]$CsvPath = ".\tests\fixtures\csv\basic-leads.csv",
  [int]$PollAttempts = 12,
  [int]$PollDelaySeconds = 2
)

$ErrorActionPreference = "Stop"

function Invoke-JsonCurl {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $raw = & curl.exe @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "curl.exe failed with exit code $LASTEXITCODE"
  }

  return $raw | ConvertFrom-Json
}

$resolvedCsv = (Resolve-Path -LiteralPath $CsvPath).Path
$apiBase = "$BaseUrl/api/v1"

Write-Host "Previewing CSV: $resolvedCsv"
$preview = Invoke-JsonCurl -Arguments @(
  "--silent",
  "--show-error",
  "--fail",
  "-X",
  "POST",
  "-F",
  "file=@$resolvedCsv;type=text/csv",
  "$apiBase/imports/preview"
)

$importId = $preview.data.importId
Write-Host "Import ID: $importId"
Write-Host "Preview summary:"
$preview.data.summary | ConvertTo-Json -Depth 10

Write-Host "Confirming import..."
$confirm = Invoke-JsonCurl -Arguments @(
  "--silent",
  "--show-error",
  "--fail",
  "-X",
  "POST",
  "$apiBase/imports/$importId/confirm"
)
$confirm.data.progress | ConvertTo-Json -Depth 10

$status = $confirm
for ($attempt = 1; $attempt -le $PollAttempts; $attempt += 1) {
  Start-Sleep -Seconds $PollDelaySeconds
  $status = Invoke-JsonCurl -Arguments @(
    "--silent",
    "--show-error",
    "--fail",
    "$apiBase/imports/$importId/status"
  )

  Write-Host "Poll $attempt status: $($status.data.status), percent: $($status.data.progress.percent)"

  if ($status.data.status -in @("COMPLETED", "FAILED", "CANCELLED")) {
    break
  }
}

Write-Host "Final status:"
$status.data | ConvertTo-Json -Depth 10

Write-Host "Fetching result summary..."
$result = Invoke-JsonCurl -Arguments @(
  "--silent",
  "--show-error",
  "--fail",
  "$apiBase/imports/$importId/result?limit=100&includeSkipped=true"
)

$result.data.summary | ConvertTo-Json -Depth 10

Write-Host "Skipped reason counts:"
$result.data.skippedReasonCounts | ConvertTo-Json -Depth 10

Write-Host "Smoke import flow completed."
