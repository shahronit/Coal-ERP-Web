<#
.SYNOPSIS
  Install/start PostgreSQL 16 and create the tradecrm database for VK Trading ERP.
#>
$ErrorActionPreference = 'Stop'

$PgRoot = 'C:\Program Files\PostgreSQL\16'
$PgBin = Join-Path $PgRoot 'bin'
$PgData = Join-Path $PgRoot 'data'
$ServiceName = 'postgresql-x64-16'
$SuperPassword = 'postgres'
$AppUser = 'tradecrm'
$AppPassword = 'tradecrm'
$AppDb = 'tradecrm'
$Port = 5432
$InstallerUrl = 'https://get.enterprisedb.com/postgresql/postgresql-16.14-2-windows-x64.exe'
$InstallerPath = Join-Path $env:TEMP 'postgresql-16.14-2-windows-x64.exe'

function Test-PortOpen([int]$Port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient('127.0.0.1', $Port)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Invoke-Psql([string]$Sql, [string]$User = 'postgres', [string]$Password = $SuperPassword, [string]$Database = 'postgres') {
  $env:PGPASSWORD = $Password
  & (Join-Path $PgBin 'psql.exe') -h 127.0.0.1 -p $Port -U $User -d $Database -v ON_ERROR_STOP=1 -c $Sql
  if ($LASTEXITCODE -ne 0) { throw "psql failed: $Sql" }
}

Write-Host '=== VK Trading ERP — PostgreSQL setup ===' -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $PgBin 'psql.exe'))) {
  Write-Host 'Downloading PostgreSQL 16 installer...'
  Invoke-WebRequest -Uri $InstallerUrl -OutFile $InstallerPath -UseBasicParsing
  Write-Host 'Running unattended PostgreSQL install (this may take a few minutes)...'
  $args = @(
    '--mode', 'unattended',
    '--unattendedmodeui', 'none',
    '--superpassword', $SuperPassword,
    '--servicename', $ServiceName,
    '--servicepassword', $SuperPassword,
    '--serverport', "$Port",
    '--enable-components', 'server,commandlinetools',
    '--disable-components', 'stackbuilder,pgAdmin'
  )
  $proc = Start-Process -FilePath $InstallerPath -ArgumentList $args -Wait -PassThru
  if ($proc.ExitCode -ne 0) { throw "PostgreSQL installer exited with code $($proc.ExitCode)" }
}

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -ne 'Running') {
  Write-Host "Starting service $ServiceName..."
  Start-Service $ServiceName
  Start-Sleep -Seconds 3
}

if (-not (Test-PortOpen $Port)) {
  throw "PostgreSQL is not listening on port $Port. If a PostgreSQL Setup window is open, complete it (set superuser password to 'postgres', port 5432), then run this script again."
}

Write-Host 'Creating application database and user...'
$env:PGPASSWORD = $SuperPassword
$psql = Join-Path $PgBin 'psql.exe'

$dbExists = & $psql -h 127.0.0.1 -p $Port -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$AppDb'"
if (-not $dbExists) {
  & $psql -h 127.0.0.1 -p $Port -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $AppDb OWNER $AppUser;"
}
& $psql -h 127.0.0.1 -p $Port -U postgres -d postgres -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE $AppDb TO $AppUser;"

Write-Host ''
Write-Host 'PostgreSQL is ready.' -ForegroundColor Green
Write-Host "Connection: postgresql://${AppUser}:${AppPassword}@127.0.0.1:${Port}/${AppDb}"
Write-Host 'Superuser: postgres / postgres (keep this secure in production)'
