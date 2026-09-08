// ============================================================
//  TRANSACTION RECEIPT GENERATOR — Google Apps Script
//  Table  : investor_transactions
//  Amount : investment_amount column
//  Date   : created_at column
//  Template: Investment Payment Receipt (same as payment script)
//
//  Flow:
//  1. Fetch rows from investor_transactions where receipt_url IS NULL
//  2. Join → investor_investments → investors + company_pools
//  3. Generate PDF from template (receipt number = next number in Drive folder)
//  4. Save PDF to Drive folder
//  5. PATCH receipt_url back to investor_transactions
// ============================================================

// ── CONFIGURATION ────────────────────────────────────────────
var SUPABASE_URL    = 'https://pbyxgewnpnqhfdxuqwke.supabase.co';
var SUPABASE_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieXhnZXducG5xaGZkeHVxd2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4OTcwOSwiZXhwIjoyMDc1MTY1NzA5fQ.FOXJFzOTc8inW16F4I_W68QyPXZYy_XGo5TwpFr2w-U';
var TEMPLATE_DOC_ID = '1ZslJfqqPieLgVP4JNUcQQ1Y0g92TcWHMvQWxeqeo2wo';
var DRIVE_FOLDER    = 'Twilight Test Transaction Receipts';
//var TEST_EMAIL      = 'keerthanamudavath281@gmail.com';


// ── GENERATE + EMAIL FOR ONE INVESTOR (by name) ─────────────
function generateForOne() {
  var targetName = 'KOVVURI TANUJA';     // ← change this
  createTransactionReceipts(targetName);
}


// ── MAIN ─────────────────────────────────────────────────────
function createTransactionReceipts(filterName) {
  var transactions = fetchFromSupabase(
    '/rest/v1/investor_transactions' +
    '?select=transaction_id,investment_id,investment_amount,transaction_type,remarks,created_at' +
    '&receipt_url=is.null' +
    '&order=created_at.asc'
  );

  Logger.log('Transactions with null receipt_url: ' + (transactions ? transactions.length : 0));

  if (!transactions || transactions.length === 0) {
    Logger.log('Nothing to process. Exiting.');
    return;
  }

  var investmentsMap = txn_fetchInvestmentsMap();
  var investorsMap   = txn_fetchInvestorsMap();
  var poolsMap       = txn_fetchPoolsMap();

  // Count existing PDFs per pool from Drive — receipt number = count + 1
  var poolReceiptCount = {};   // purchase_id → file count from Drive

  var processed  = 0;
  var skipped    = 0;
  var errors     = 0;

  for (var i = 0; i < transactions.length; i++) {
    var txn = transactions[i];

    if (!txn.transaction_id) {
      Logger.log('[SKIP] Row ' + i + ' missing transaction_id');
      skipped++;
      continue;
    }

    var investment = investmentsMap[txn.investment_id];
    if (!investment) {
      Logger.log('[SKIP] transaction_id=' + txn.transaction_id + ' — investment not found');
      skipped++;
      continue;
    }

    var investor = investorsMap[investment.investor_id];
    var pool     = poolsMap[investment.purchase_id];

    if (!investor) {
      Logger.log('[SKIP] transaction_id=' + txn.transaction_id + ' — investor not found');
      skipped++;
      continue;
    }
    if (filterName && investor.investor_name.replace(/\s+/g, ' ').trim() !== filterName.trim()) continue;


    if (!pool) {
      Logger.log('[SKIP] transaction_id=' + txn.transaction_id + ' — pool not found');
      skipped++;
      continue;
    }

    var amount = Math.round(txn.investment_amount || 0);
    if (amount <= 0) {
      Logger.log('[SKIP] transaction_id=' + txn.transaction_id + ' — amount is zero/negative');
      skipped++;
      continue;
    }

    try {
      var pid = investment.purchase_id;
      // First time seeing this pool? Count PDFs in its Drive folder
      if (poolReceiptCount[pid] === undefined) {
        poolReceiptCount[pid] = countFilesInDriveFolder(pool.pool_name);
        Logger.log('[DRIVE COUNT] "' + pool.pool_name + ' Payment Receipts" has ' + poolReceiptCount[pid] + ' files');
      }
      poolReceiptCount[pid]++;
      var receiptNum = poolReceiptCount[pid];

      // Save to pool folder: "{poolName}" / "{poolName} Payment Receipts"
      var customFolders = { 'Jadcherla Restaurant': 'Twilight FnB Jadcherla Investment Receipts' };
      var poolFolderName = pool.pool_name.replace(/\s+/g, '_');
      var topFolders2 = DriveApp.getFoldersByName(poolFolderName);
      if (!topFolders2.hasNext()) topFolders2 = DriveApp.getFoldersByName(pool.pool_name);
      var topFolder = topFolders2.hasNext() ? topFolders2.next() : DriveApp.createFolder(pool.pool_name);
      var receiptSubName = customFolders[pool.pool_name] || (pool.pool_name + ' Payment Receipts');
      var receiptSubAlt  = customFolders[pool.pool_name] || (poolFolderName + ' Payment Receipts');
      var subFolders2 = topFolder.getFoldersByName(receiptSubName);
      if (!subFolders2.hasNext()) subFolders2 = topFolder.getFoldersByName(receiptSubAlt);
      var saveFolder = subFolders2.hasNext() ? subFolders2.next() : topFolder.createFolder(receiptSubName);

      var result  = generateTransactionPdf(txn, investor, pool, amount, receiptNum, saveFolder);
      var pdfUrl  = result.pdfUrl;
      var pdfBlob = result.pdfBlob;
      //comment these
      var saved   = saveReceiptUrl(txn.transaction_id, pdfUrl);

      Logger.log((saved ? '[DONE] ' : '[SAVE FAILED] ') +
        investor.investor_name + ' | ' + pool.pool_name + ' | ' + formatAmountInRupees(amount) +
        ' | Receipt #' + receiptNum);

      if (saved) sendTransactionEmail(investor, pool, pdfBlob, amount, txn);

      if (saved) processed++;
      else errors++;
    } catch (e) {
      Logger.log('[ERROR] transaction_id=' + txn.transaction_id + ' | ' + e.toString());
      errors++;
    }
  }

  Logger.log('─────────────────────────────────────');
  Logger.log('Done. Processed=' + processed + ' | Skipped=' + skipped + ' | Errors=' + errors);
}


// ── PDF GENERATION ────────────────────────────────────────────
function generateTransactionPdf(txn, investor, pool, amount, receiptNum, folder) {
  var name            = investor.investor_name;
  var nameNoSpaces    = name.replace(/\s+/g, '');
  var phoneNumber     = formatPhoneNumber(investor.phone);
  var formattedDate   = formatDate(txn.created_at);
  var formattedAmount = formatAmountInRupees(amount);
  var amountInWords   = getIndianCurrency(amount);
  var orgName         = pool.organization_name  || '';
  var gstin           = pool.gstin              || '';
  var categoryName    = pool.category_name      || '';
  var businessPurpose = pool.business_purposes  || '';

  var year            = new Date(txn.created_at).getFullYear();
  var receiptId       = (pool.receipt_id || 'RCP').toUpperCase().replace(/\s+/g, '_');
  var invoiceNo       = year + '_' + receiptId + '_' + receiptNum;

  var copyId  = DriveApp.getFileById(TEMPLATE_DOC_ID).makeCopy('_tmp_' + invoiceNo).getId();
  var copyDoc = DocumentApp.openById(copyId);
  var body    = copyDoc.getBody();

  body.replaceText('{{invoiceNo}}',         invoiceNo);
  body.replaceText('{{Date}}',              formattedDate);
  body.replaceText('{{InvestorName}}',      name);
  body.replaceText('{{phoneNumber}}',       phoneNumber);
  body.replaceText('{{Amount}}',            formattedAmount);
  body.replaceText('{{amountInWords}}',     amountInWords);
  body.replaceText('{{organization_name}}', orgName);
  body.replaceText('{{GSTIN}}',             gstin);
  body.replaceText('{{category_name}}',     categoryName);
  body.replaceText('{{business_purposes}}', businessPurpose);

  var header = copyDoc.getHeader();
  if (header) {
    header.replaceText('{{organization_name}}', orgName);
    header.replaceText('{{GSTIN}}',             gstin);
    header.replaceText('{{category_name}}',     categoryName);
  }

  copyDoc.saveAndClose();

  // Export to PDF   →  MukkotiMadanMohan_Receipt_2025_BSPN_42.pdf
  var pdfName = nameNoSpaces + '_Receipt_' + invoiceNo + '.pdf';
  var pdfBlob = DriveApp.getFileById(copyId).getAs('application/pdf');
  pdfBlob.setName(pdfName);

  var pdfFile = folder.createFile(pdfBlob);
  var pdfUrl  = pdfFile.getUrl();

  DriveApp.getFileById(copyId).setTrashed(true);

  Logger.log('[PDF SAVED] ' + pdfName + ' → ' + pdfUrl);
  return { pdfUrl: pdfUrl, pdfBlob: pdfBlob };
}


// // ── SEND EMAIL FOR ONE (already generated, URL in Supabase) ──
// function emailForOne() {
//   var targetName = 'Mukkoti Madan Mohan';   // ← change this

//   var investorsMap   = txn_fetchInvestorsMap();
//   var investmentsMap = txn_fetchInvestmentsMap();
//   var poolsMap       = txn_fetchPoolsMap();

//   var allTxns = fetchFromSupabase(
//     '/rest/v1/investor_transactions' +
//     '?select=transaction_id,investment_id,investment_amount,transaction_type,created_at,receipt_url' +
//     '&receipt_url=not.is.null' +
//     '&order=created_at.desc'
//   );

//   for (var i = 0; i < allTxns.length; i++) {
//     var txn        = allTxns[i];
//     var investment = investmentsMap[txn.investment_id];
//     if (!investment) continue;
//     var investor = investorsMap[investment.investor_id];
//     if (!investor || investor.investor_name !== targetName) continue;
//     var pool = poolsMap[investment.purchase_id];
//     if (!pool) continue;

//     var fileId  = txn.receipt_url.match(/\/d\/([^\/]+)/);
//     if (!fileId) { Logger.log('Could not extract file ID from: ' + txn.receipt_url); return; }
//     var pdfBlob = DriveApp.getFileById(fileId[1]).getAs('application/pdf');
//     var amount  = Math.round(txn.investment_amount || 0);

//     //sendTransactionEmail(investor, pool, pdfBlob, amount, txn);
//     Logger.log('[DONE] Email sent for ' + targetName);
//     return;
//   }

//   Logger.log('[NOT FOUND] No transaction with receipt_url for ' + targetName);
// }


// ── EMAIL ─────────────────────────────────────────────────────
function sendTransactionEmail(investor, pool, pdfBlob, amount, txn) {
  if (!investor.email || investor.email.trim() === '') {
    Logger.log('[EMAIL SKIP] No email for: ' + investor.investor_name);
    return;
  }

  var name              = investor.investor_name;
  var formattedAmount   = formatAmountInRupees(amount);
  var categoryName      = pool.category_name     || '';
  var pool_name         = pool.pool_name         || '';
  var business_purposes = pool.business_purposes || '';

  var signature =
    'For official communications, please reach us at\nops.twilight@gmail.com\n\n' +
    'Thanks & Regards,\n\nBukke Siva Prasad Naik, Mukkoti Anil Kumar\nPartners\nTwilight';

  // Check if first-ever transaction for this investor
  var allInvTxns = fetchFromSupabase(
    '/rest/v1/investor_transactions?select=transaction_id&investment_id=eq.' + txn.investment_id
  );
  var isFirst = allInvTxns ? allInvTxns.length === 1 : false;

  var message;
  if (isFirst) {
    message =
      'Hello ' + name + ',\n\n' +
      'A heartfelt welcome to our ' + categoryName + ' business! We are thrilled to have you on board. ' +
      'Your investment not only fuels our growth but also strengthens our community.\n\n' +
      'Cheers to a prosperous journey ahead filled with shared successes.\n\n' +
      signature;
  } else {
    message =
      'Hi ' + name + ',\n\n' +
      'Please find attached your receipt for the amount of ' + formattedAmount +
      ' in ' + pool_name + ' for ' + business_purposes + '\n\n' +
      'We thank you for your investment.\n\n' +
      signature;
  }

  var subject = isFirst
    ? 'Welcome Aboard Our ' + categoryName + ' Journey!'
    : 'Your Investment Receipt — ' + pool_name;

  MailApp.sendEmail({
    // to:          TEST_EMAIL,  // TODO: switch to investor.email for production
    to:          investor.email,
    cc:        ['anilmukkoti@gmail.com', 'bspn96@gmail.com'].join(','),
    subject:     subject,
    body:        message,
    attachments: [pdfBlob]
  });

  Logger.log('[EMAIL SENT] To: ' + investor.email + ' | Investor: ' + name);
}


// ── LIST PENDING ─────────────────────────────────────────────
function listPendingTransactions() {
  var pending = fetchFromSupabase(
    '/rest/v1/investor_transactions' +
    '?select=transaction_id,investment_id,investment_amount,transaction_type,created_at' +
    '&receipt_url=is.null' +
    '&order=created_at.asc'
  );

  if (!pending || pending.length === 0) {
    Logger.log('All transactions have a receipt_url. Nothing pending.');
    return;
  }

  var investmentsMap = txn_fetchInvestmentsMap();
  var investorsMap   = txn_fetchInvestorsMap();
  var poolsMap       = txn_fetchPoolsMap();

  Logger.log('================================================');
  Logger.log('PENDING TRANSACTIONS — no receipt_url (' + pending.length + ' total)');
  Logger.log('================================================');

  for (var i = 0; i < pending.length; i++) {
    var txn        = pending[i];
    var investment = investmentsMap[txn.investment_id];
    var investor   = investment ? investorsMap[investment.investor_id] : null;
    var pool       = investment ? poolsMap[investment.purchase_id]     : null;

    var investorName = investor ? investor.investor_name : '(unknown investor)';
    var poolName     = pool     ? pool.pool_name         : '(unknown pool)';
    var amount       = txn.investment_amount
                       ? formatAmountInRupees(Math.round(txn.investment_amount))
                       : '?';
    var type         = txn.transaction_type || '';
    var date         = txn.created_at ? formatDate(txn.created_at) : '';

    Logger.log((i + 1) + '. ' + investorName + ' | ' + poolName + ' | ' + amount + ' | ' + type + ' | ' + date);
  }

  Logger.log('================================================');
  Logger.log('Total pending: ' + pending.length);
}


// ── CHECK CURRENT STATE ──────────────────────────────────────
function checkCurrentState() {
  var allTxns = fetchFromSupabase(
    '/rest/v1/investor_transactions' +
    '?select=transaction_id,investment_id,investment_amount,transaction_type,receipt_url,created_at' +
    '&order=created_at.asc'
  );

  if (!allTxns) { Logger.log('Failed to fetch transactions.'); return; }

  var investmentsMap = txn_fetchInvestmentsMap();
  var investorsMap   = txn_fetchInvestorsMap();
  var poolsMap       = txn_fetchPoolsMap();

  var withUrl    = [];
  var withoutUrl = [];

  for (var i = 0; i < allTxns.length; i++) {
    var txn        = allTxns[i];
    var investment = investmentsMap[txn.investment_id];
    var investor   = investment ? investorsMap[investment.investor_id] : null;
    var pool       = investment ? poolsMap[investment.purchase_id]     : null;

    var investorName = investor ? investor.investor_name          : '(unknown investor)';
    var poolName     = pool     ? pool.pool_name                  : '(unknown pool)';
    var amount       = txn.investment_amount ? formatAmountInRupees(Math.round(txn.investment_amount)) : '?';
    var type         = txn.transaction_type  || '';
    var label        = investorName + ' | ' + poolName + ' | ' + amount + ' | ' + type;

    if (txn.receipt_url && txn.receipt_url !== '') {
      withUrl.push(label);
    } else {
      withoutUrl.push(label);
    }
  }

  Logger.log('================================================');
  Logger.log('SAVED (' + withUrl.length + ') — receipt_url exists:');
  Logger.log('================================================');
  for (var a = 0; a < withUrl.length; a++) Logger.log('  [SAVED] ' + withUrl[a]);

  Logger.log('');
  Logger.log('================================================');
  Logger.log('PENDING (' + withoutUrl.length + ') — no receipt_url yet:');
  Logger.log('================================================');
  for (var b = 0; b < withoutUrl.length; b++) Logger.log('  [NULL]  ' + withoutUrl[b]);

  Logger.log('');
  Logger.log('Total transactions : ' + allTxns.length);
  Logger.log('Saved              : ' + withUrl.length);
  Logger.log('Pending            : ' + withoutUrl.length);
}


// ── SUPABASE SAVE ─────────────────────────────────────────────
function saveReceiptUrl(transactionId, driveUrl) {
  var url = SUPABASE_URL + '/rest/v1/investor_transactions?transaction_id=eq.' + transactionId;
  var res = UrlFetchApp.fetch(url, {
    method:  'PATCH',
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal'
    },
    payload:            JSON.stringify({ receipt_url: driveUrl }),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  Logger.log('[SAVE URL] transaction_id=' + transactionId + ' | HTTP ' + code);
  return code >= 200 && code < 300;
}


// ── SUPABASE FETCH HELPERS ────────────────────────────────────
function fetchFromSupabase(endpoint) {
  var response = UrlFetchApp.fetch(SUPABASE_URL + endpoint, {
    method: 'GET',
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type':  'application/json'
    },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    Logger.log('[FETCH ERROR] ' + endpoint + ' → ' + response.getContentText());
    return null;
  }
  return JSON.parse(response.getContentText());
}

function txn_fetchInvestmentsMap() {
  var data = fetchFromSupabase(
    '/rest/v1/investor_investments?select=investment_id,investor_id,purchase_id'
  );
  var map = {};
  if (data) {
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      map[row.investment_id] = {
        investment_id: row.investment_id,
        investor_id:   row.investor_id,
        purchase_id:   row.purchase_id
      };
    }
  }
  return map;
}

function txn_fetchInvestorsMap() {
  var data = fetchFromSupabase(
    '/rest/v1/investors?select=investor_id,investor_name,phone,email'
  );
  var map = {};
  if (data) {
    for (var i = 0; i < data.length; i++) map[data[i].investor_id] = data[i];
  }
  return map;
}

function txn_fetchPoolsMap() {
  var data = fetchFromSupabase(
    '/rest/v1/company_pools' +
    '?select=purchase_id,pool_name,organization_name,gstin,category_name,receipt_id,business_purposes'
  );
  var map = {};
  if (data) {
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      map[row.purchase_id] = {
        purchase_id:       row.purchase_id,
        pool_name:         row.pool_name,
        organization_name: row.organization_name,
        gstin:             row.gstin,
        category_name:     row.category_name,
        receipt_id:        row.receipt_id,
        business_purposes: row.business_purposes
      };
    }
  }
  return map;
}


// ── DRIVE HELPERS ────────────────────────────────────────────
// Counts PDF files in "{poolName}" / "{poolName} Payment Receipts"
// Also tries underscore variant (e.g. "LT_Hybrids")
function countFilesInDriveFolder(poolName) {
 // Custom folder names for non-standard pools
  var customFolders = {
    'Jadcherla Restaurant': 'Twilight FnB Jadcherla Investment Receipts'
  };
  var receiptFolderName = customFolders[poolName] || (poolName + ' Payment Receipts');  var poolNameAlt       = poolName.replace(/\s+/g, '_');

  // Try: {poolName} / {poolName} Payment Receipts
  var parentFolders = DriveApp.getFoldersByName(poolName);
  if (!parentFolders.hasNext()) parentFolders = DriveApp.getFoldersByName(poolNameAlt);

  if (parentFolders.hasNext()) {
    var parent = parentFolders.next();
    var subFolders = parent.getFoldersByName(receiptFolderName);
    if (!subFolders.hasNext()) subFolders = parent.getFoldersByName(poolNameAlt + ' Payment Receipts');
    if (subFolders.hasNext()) {
      return countFiles(subFolders.next());
    }
  }

  // Fallback: receipt folder at root level
  var directFolders = DriveApp.getFoldersByName(receiptFolderName);
  if (directFolders.hasNext()) {
    return countFiles(directFolders.next());
  }

  Logger.log('[DRIVE COUNT] Folder "' + receiptFolderName + '" not found — starting from 0');
  return 0;
}

function countFiles(folder) {
  var files = folder.getFiles();
  var count = 0;
  while (files.hasNext()) { files.next(); count++; }
  return count;
}

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}


// ── FORMATTING HELPERS ────────────────────────────────────────
function formatPhoneNumber(phone) {
  if (!phone) return '';
  var p = phone.toString().trim();
  if (p.startsWith('+')) return p;
  var digits = p.replace(/\D/g, '');
  if (digits.length > 10) return '+' + digits;
  if (digits.length === 10) return '+91 ' + digits.substring(0, 5) + ' ' + digits.substring(5);
  return p;
}

function formatDate(dateStr) {
  var date = new Date(dateStr);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd MMMM yyyy');
}

function formatAmountInRupees(amount) {
  return '\u20B9' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getIndianCurrency(number) {
  var decimal = Math.round((number - Math.floor(number)) * 100);
  var no      = Math.floor(number);
  var str     = [];
  var words   = {
    0:'',1:'One',2:'Two',3:'Three',4:'Four',5:'Five',6:'Six',7:'Seven',
    8:'Eight',9:'Nine',10:'Ten',11:'Eleven',12:'Twelve',13:'Thirteen',
    14:'Fourteen',15:'Fifteen',16:'Sixteen',17:'Seventeen',18:'Eighteen',
    19:'Nineteen',20:'Twenty',30:'Thirty',40:'Forty',50:'Fifty',
    60:'Sixty',70:'Seventy',80:'Eighty',90:'Ninety'
  };
  var digits      = ['', 'Hundred', 'Thousand', 'Lakh', 'Crore'];
  var digitsLength = no.toString().length;
  var i = 0;

  while (i < digitsLength) {
    var divider = (i === 2) ? 10 : 100;
    var num     = Math.floor(no % divider);
    no          = Math.floor(no / divider);
    i          += divider === 10 ? 1 : 2;
    if (num) {
      var plural  = (str.length && num > 9) ? 's' : '';
      var hundred = (str.length === 1 && str[0]) ? ' and ' : '';
      var word    = (num < 21) ? words[num] : words[Math.floor(num / 10) * 10] + ' ' + words[num % 10];
      str.push(word.trim() + ' ' + digits[str.length] + plural + hundred);
    } else {
      str.push('');
    }
  }

  var rupees = str.reverse().join(' ').replace(/\s+/g, ' ').trim();
  var paise  = decimal > 0
    ? ' and ' + words[Math.floor(decimal / 10) * 10] + ' ' + words[decimal % 10] + ' Paise'
    : '';

  return rupees ? rupees + ' Rupees Only' + paise : '';
}

// ==========================================
// WEB APP ENDPOINT — trigger functions via HTTP from the website
// Paste this block into paymentreceipt.gs, then:
// Deploy > New deployment > Type: Web app
//   Execute as: Me
//   Who has access: Anyone (the secret check below is what actually gates it)
// This is a SEPARATE deployment from the payout-receipts script — give it its own secret.
// ==========================================
var WEBAPP_SECRET = 'c9d42a3f85f055193b99a7aeccff4d4d9259aec786310708'; // different from the payout script's secret

// Actions that take no arguments.
var ACTIONS = {
  processAllPending:       function () { createTransactionReceipts(); }, // no filter = every pending transaction
  listPendingTransactions: listPendingTransactions,
  checkCurrentState:       checkCurrentState
};

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.secret !== WEBAPP_SECRET) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }

    var action = body.action;
    var startTime = new Date().getTime();

    if (action === 'generateForOne') {
      if (!body.name || !body.name.trim()) {
        return jsonResponse({ ok: false, error: 'Missing "name" for generateForOne' });
      }
      createTransactionReceipts(body.name.trim());
    } else if (ACTIONS[action]) {
      ACTIONS[action]();
    } else {
      return jsonResponse({
        ok: false,
        error: 'Unknown action: ' + action,
        available: ['generateForOne'].concat(Object.keys(ACTIONS))
      });
    }

    var elapsedMs = new Date().getTime() - startTime;
    return jsonResponse({ ok: true, action: action, elapsedMs: elapsedMs, logs: Logger.getLog() });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString(), logs: Logger.getLog() });
  }
}

// Visiting the /exec URL directly in a browser (GET) — simple health check, no action runs.
function doGet(e) {
  return jsonResponse({
    ok: true,
    message: 'Twilight transaction receipt Web App is running. POST { action, secret, name? } to trigger a function.',
    available: ['generateForOne'].concat(Object.keys(ACTIONS))
  });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
