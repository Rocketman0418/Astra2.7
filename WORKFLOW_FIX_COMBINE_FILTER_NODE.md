# Fix for "Combine & Filter NEW Files (Improved)" Node

## Problems Identified

### Problem 1: Incorrect team_id Assignment
**Root Cause:** The node uses `.first()` when accessing Tag nodes, which returns the FIRST execution from ALL teams, not the current team's execution.

```javascript
// WRONG - Gets first team's data regardless of current loop iteration
const meetingsData = $('Tag Meeting Files').first();
const strategyData = $('Tag Strategy Files').first();
const financialData = $('Tag Financial Files').first();
```

This causes files from one team to be tagged with another team's ID.

### Problem 2: Existing Files Marked as New
**Root Cause:** The `existingMap` is built from "Get Team's Existing Documents", but the files being checked come from the Tag nodes which include `team_id` in the file object. However, the map lookup only checks `file.id`, not considering which team's context we're in.

Additionally, when Tag nodes return files with their own `team_id` already set (from the previous nodes), and we overwrite it with `context.team_id`, we create a mismatch.

## The Fix

Replace the entire jsCode in the "Combine & Filter NEW Files (Improved)" node with this corrected version:

```javascript
// FIXED: Properly access current team's data from Tag nodes
const MAX_FILES_PER_RUN = 5;

console.log('=== COMBINE & FILTER (FIXED - CURRENT TEAM ONLY) ===');

// ============================================
// 1. GET TEAM CONTEXT FROM LOOP NODE
// ============================================
let context;
try {
  const loopData = $('Loop Over Each Team').item.json;
  context = {
    team_id: loopData.team_id,
    user_id: loopData.user_id,
    access_token: loopData.access_token,
    meetings_folder_id: loopData.meetings_folder_id,
    strategy_folder_id: loopData.strategy_folder_id,
    financial_folder_id: loopData.financial_folder_id
  };
  console.log(`✅ Processing Team: ${context.team_id}`);
} catch (e) {
  console.error('❌ CRITICAL: Cannot access Loop Over Each Team');
  return [];
}

// ============================================
// 2. GET EXISTING DOCUMENTS FOR THIS TEAM
// ============================================
let existingDocs = [];
try {
  const existingResponse = $("Get Team's Existing Documents").item.json;

  if (Array.isArray(existingResponse)) {
    existingDocs = existingResponse;
  } else {
    existingDocs = [existingResponse];
  }

  console.log(`📋 Existing docs for team ${context.team_id}: ${existingDocs.length}`);
} catch (e) {
  console.log(`⚠️ Could not access existing docs: ${e.message}`);
}

// ============================================
// 3. GET FILES FROM EACH FOLDER (CURRENT TEAM'S EXECUTION)
// ============================================
let meetingsFiles = [];
let strategyFiles = [];
let financialFiles = [];

// FIX: Use .item instead of .first() to get current team's data
try {
  const meetingsData = $('Tag Meeting Files').item.json;
  if (meetingsData && meetingsData.files) {
    meetingsFiles = meetingsData.files;
    console.log(`📁 Meetings files: ${meetingsFiles.length}`);

    // Verify team_id matches
    if (meetingsData.team_id && meetingsData.team_id !== context.team_id) {
      console.log(`⚠️ WARNING: Meetings data team_id mismatch!`);
      console.log(`   Expected: ${context.team_id}`);
      console.log(`   Got: ${meetingsData.team_id}`);
    }
  }
} catch (e) {
  console.log(`ℹ️ No meetings files (folder not configured or empty)`);
}

try {
  const strategyData = $('Tag Strategy Files').item.json;
  if (strategyData && strategyData.files) {
    strategyFiles = strategyData.files;
    console.log(`📁 Strategy files: ${strategyFiles.length}`);

    // Verify team_id matches
    if (strategyData.team_id && strategyData.team_id !== context.team_id) {
      console.log(`⚠️ WARNING: Strategy data team_id mismatch!`);
      console.log(`   Expected: ${context.team_id}`);
      console.log(`   Got: ${strategyData.team_id}`);
    }
  }
} catch (e) {
  console.log(`ℹ️ No strategy files (folder not configured or empty)`);
}

try {
  const financialData = $('Tag Financial Files').item.json;
  if (financialData && financialData.files) {
    financialFiles = financialData.files;
    console.log(`📁 Financial files: ${financialFiles.length}`);

    // Verify team_id matches
    if (financialData.team_id && financialData.team_id !== context.team_id) {
      console.log(`⚠️ WARNING: Financial data team_id mismatch!`);
      console.log(`   Expected: ${context.team_id}`);
      console.log(`   Got: ${financialData.team_id}`);
    }
  }
} catch (e) {
  console.log(`ℹ️ No financial files (folder not configured or empty)`);
}

const totalFilesToCheck = meetingsFiles.length + strategyFiles.length + financialFiles.length;
console.log(`\n📊 Total files to check: ${totalFilesToCheck}`);
console.log(`📋 Existing docs to check against: ${existingDocs.length}`);

// ============================================
// 4. BUILD EXISTING DOCS LOOKUP MAP
// ============================================
const existingMap = new Map();

existingDocs.forEach((doc) => {
  if (doc && doc.source_id) {
    const modTime = doc.source_modified_time ? new Date(doc.source_modified_time) : null;
    existingMap.set(doc.source_id, modTime);
  }
});

console.log(`\n✅ Built existingMap with ${existingMap.size} entries`);

// Debug: Sample entries
if (existingMap.size > 0) {
  console.log(`   └─ Sample entries:`);
  let count = 0;
  for (const [sourceId, modTime] of existingMap) {
    if (count < 5) {
      console.log(`      ${sourceId}: ${modTime ? modTime.toISOString() : 'null'}`);
      count++;
    }
  }
}

// ============================================
// 5. FILTER FILES - NEW OR UPDATED ONLY
// ============================================
const allNewFiles = [];
let counters = { new: 0, updated: 0, skipped: 0 };

function createFileObject(file, folderType, parentFolderId, reason, isSheet) {
  return {
    file_id: file.id,
    file_name: file.name,
    mime_type: file.mimeType,
    modified_time: file.modifiedTime,
    web_view_link: file.webViewLink,
    size: file.size,
    folder_type: folderType,
    parent_folder_id: parentFolderId,
    team_id: context.team_id,
    user_id: context.user_id,
    access_token: context.access_token,
    processing_reason: reason,
    is_google_sheet: isSheet
  };
}

function processFile(file, folderType, parentFolderId) {
  if (!file || !file.id) return;

  // Skip PDFs
  if (file.mimeType === 'application/pdf') {
    console.log(`   ⏭️ SKIP (PDF): ${file.name}`);
    counters.skipped++;
    return;
  }

  const isGoogleSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
  const fileModified = new Date(file.modifiedTime);

  // ========== FINANCIAL SHEETS (Multi-tab) ==========
  if (isGoogleSheet && folderType === 'financial') {
    let foundExistingTab = false;
    let mostRecentTabModified = null;

    // Check if ANY tabs of this spreadsheet exist
    for (const [docSourceId, docModified] of existingMap.entries()) {
      if (docSourceId.startsWith(file.id + '_')) {
        foundExistingTab = true;
        if (docModified && (!mostRecentTabModified || docModified > mostRecentTabModified)) {
          mostRecentTabModified = docModified;
        }
      }
    }

    if (!foundExistingTab) {
      console.log(`   ✅ NEW SHEET: ${file.name}`);
      allNewFiles.push(createFileObject(file, folderType, parentFolderId, 'new_file', true));
      counters.new++;
      return;
    }

    if (mostRecentTabModified && fileModified > mostRecentTabModified) {
      console.log(`   🔄 UPDATED SHEET: ${file.name}`);
      allNewFiles.push(createFileObject(file, folderType, parentFolderId, 'updated_file', true));
      counters.updated++;
      return;
    }

    console.log(`   ⏭️ SKIP (unchanged): ${file.name}`);
    counters.skipped++;
    return;
  }

  // ========== REGULAR DOCS (Meetings/Strategy) ==========
  const existingModified = existingMap.get(file.id);

  if (existingModified === undefined) {
    console.log(`   ✅ NEW: ${file.name} (ID: ${file.id.substring(0, 20)}...)`);
    allNewFiles.push(createFileObject(file, folderType, parentFolderId, 'new_file', false));
    counters.new++;
  } else if (existingModified && fileModified > existingModified) {
    console.log(`   🔄 UPDATED: ${file.name}`);
    console.log(`      File modified: ${fileModified.toISOString()}`);
    console.log(`      DB modified: ${existingModified.toISOString()}`);
    allNewFiles.push(createFileObject(file, folderType, parentFolderId, 'updated_file', false));
    counters.updated++;
  } else {
    console.log(`   ⏭️ SKIP (unchanged): ${file.name}`);
    counters.skipped++;
  }
}

// Process each folder type
console.log(`\n=== PROCESSING MEETINGS (${meetingsFiles.length} files) ===`);
meetingsFiles.forEach(f => processFile(f, 'meetings', context.meetings_folder_id));

console.log(`\n=== PROCESSING STRATEGY (${strategyFiles.length} files) ===`);
strategyFiles.forEach(f => processFile(f, 'strategy', context.strategy_folder_id));

console.log(`\n=== PROCESSING FINANCIAL (${financialFiles.length} files) ===`);
financialFiles.forEach(f => processFile(f, 'financial', context.financial_folder_id));

// ============================================
// 6. OUTPUT RESULTS
// ============================================
console.log(`\n=== RESULTS FOR TEAM ${context.team_id} ===`);
console.log(`✅ New: ${counters.new}`);
console.log(`🔄 Updated: ${counters.updated}`);
console.log(`⏭️ Skipped: ${counters.skipped}`);
console.log(`📤 Total to process: ${allNewFiles.length}`);

// Apply cap
let finalOutput = allNewFiles;
if (allNewFiles.length > MAX_FILES_PER_RUN) {
  console.log(`\n⚠️ Capping output to ${MAX_FILES_PER_RUN} files`);
  finalOutput = allNewFiles.slice(0, MAX_FILES_PER_RUN);
}

if (finalOutput.length === 0) {
  console.log(`\n✅ All files are up to date - nothing to process`);
  return [{
    json: {
      has_files: false,
      team_id: context.team_id,
      reason: 'no_processable_files',
      stats: counters
    }
  }];
}

console.log(`\n🚀 Outputting ${finalOutput.length} files for team ${context.team_id}`);
return finalOutput.map(file => ({ json: { ...file, has_files: true } }));
```

## Key Changes

1. **Changed `.first()` to `.item`** - This ensures we get the data from the CURRENT loop iteration, not the first team's data
2. **Added team_id verification logging** - Helps debug mismatches
3. **Enhanced logging** - Shows which team is being processed and file IDs for debugging
4. **Better existingMap debugging** - Shows sample entries with modification times

## How to Apply

1. Open your n8n workflow
2. Find the "Combine & Filter NEW Files (Improved)" node
3. Replace the entire JavaScript code with the fixed version above
4. Save and test the workflow

## Expected Behavior After Fix

- Each team's files will be assigned the CORRECT team_id
- Files that already exist in the documents table will be properly skipped (not marked as new_file)
- Only genuinely new or updated files will be processed
- Logs will clearly show which team is being processed at each step
