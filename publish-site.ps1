$ErrorActionPreference = "Stop"

$RepoName = "my-center"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

# Confirm GitHub CLI login.
gh auth status | Out-Null

$user = (gh api user --jq ".login").Trim()
if (-not $user) { throw "Could not determine GitHub username." }

if (-not (Test-Path ".git")) {
    git init
}
git checkout -B main

git add .

git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git -c user.name="$user" -c user.email="$user@users.noreply.github.com" commit -m "Publish site"
}

$remotes = @(git remote)
$remoteUrl = "https://github.com/$user/$RepoName.git"

if ($remotes -contains "origin") {
    git remote set-url origin $remoteUrl
} else {
    git remote add origin $remoteUrl
}

git push -u origin main

# Enable GitHub Pages from main/root.
# First publication: POST should create the Pages site.
gh api -X POST "repos/$user/$RepoName/pages" `
  -f "source[branch]=main" `
  -f "source[path]=/" | Out-Null

$site = "https://$user.github.io/$RepoName/"
Write-Host ""
Write-Host "Published successfully:"
Write-Host $site
Start-Sleep -Seconds 3
Start-Process $site
