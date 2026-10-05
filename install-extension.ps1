$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$destination = Join-Path $env:APPDATA 'Adobe\CEP\extensions\com.contasimples.reducecomp'

New-Item -ItemType Directory -Path $destination -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $source 'CSXS') -Destination $destination -Recurse -Force
Copy-Item -LiteralPath (Join-Path $source 'client') -Destination $destination -Recurse -Force
Copy-Item -LiteralPath (Join-Path $source 'host') -Destination $destination -Recurse -Force

Write-Host "Extensão instalada em: $destination"
Write-Host 'Reinicie o After Effects e abra: Janela > Extensões (Legado) > Fast Comp Collect.'
