$file = "c:\Users\rchavez.soc\Documents\IBBS\index.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# ── 1. Fix email field: span 3 + nowrap ──────────────────────────────────────
$emailOld = '<div class="t6-reg-field"><span class="t6-reg-label">Correo Electr'
$emailNew = '<div class="t6-reg-field" style="grid-column: span 3;"><span class="t6-reg-label">Correo Electr'
if ($content.Contains($emailOld)) {
    $content = $content.Replace($emailOld, $emailNew)
    Write-Host "[OK] Email field patched"
} else {
    Write-Host "[SKIP] Email field already patched or not found"
}

# Also add white-space nowrap on the email value span
$emailValOld = 'id="t6-reg-email" style="word-break: break-all;"'
$emailValNew = 'id="t6-reg-email" style="white-space: nowrap;"'
if ($content.Contains($emailValOld)) {
    $content = $content.Replace($emailValOld, $emailValNew)
    Write-Host "[OK] Email value style patched"
} else {
    Write-Host "[SKIP] Email value style not found or already patched"
}

# ── 2. Add search box to right panel card header ──────────────────────────────
$searchOld = @'
              <div class="card-header">
                <div class="card-icon">
'@

# We'll use a different approach - find the closing </div> of the location card-header
# The pattern to find: closing div of the subtitle + closing div of the inner div + closing card-header div
$locHeaderOld = "                </div>`r`n              </div>`r`n`r`n              <!-- Progress steps -->"
$locHeaderNew = @"
                </div>
                <div class="t1-entity-search-wrap">
                  <input type="text" id="t1-entity-search" class="t1-entity-search-input" placeholder="Buscar entidad..." autocomplete="off" />
                  <ul id="t1-entity-suggestions" class="t1-entity-suggestions hidden"></ul>
                </div>
              </div>

              <!-- Progress steps -->
"@

if ($content.Contains($locHeaderOld)) {
    $content = $content.Replace($locHeaderOld, $locHeaderNew)
    Write-Host "[OK] Search box added to right panel"
} else {
    Write-Host "[FAIL] Could not find right panel card header to patch"
    # Show context for debugging
    $idx = $content.IndexOf("Progress steps")
    if ($idx -gt 0) { Write-Host $content.Substring([Math]::Max(0,$idx-200), 250) }
}

# ── Save ──────────────────────────────────────────────────────────────────────
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "[DONE] File saved."
