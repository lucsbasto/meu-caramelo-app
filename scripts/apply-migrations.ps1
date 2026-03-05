param(
  [string]$Container = "meu_caramelo_db",
  [string]$DbUser = "caramelo",
  [string]$DbName = "meu_caramelo",
  [string]$MigrationsPath = "supabase/migrations"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $MigrationsPath)) {
  throw "Migrations path not found: $MigrationsPath"
}

$files = Get-ChildItem -Path $MigrationsPath -File -Filter *.sql | Sort-Object Name
if ($files.Count -eq 0) {
  throw "No SQL files found in $MigrationsPath"
}

Write-Host "Applying $($files.Count) migration(s) to $Container/$DbName ..."

foreach ($file in $files) {
  Write-Host "-> $($file.Name)"
  Get-Content -Raw $file.FullName | docker exec -i $Container psql -v ON_ERROR_STOP=1 -U $DbUser -d $DbName
  if ($LASTEXITCODE -ne 0) {
    throw "Migration failed: $($file.Name)"
  }
}

Write-Host "Migrations applied successfully."
