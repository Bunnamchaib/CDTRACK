const PROJECT_NAME = 'Cradit Tracking';
const SPREADSHEET_PROPERTY_KEY = 'CRADIT_TRACKING_SPREADSHEET_ID';
const APP_TIMEZONE = Session.getScriptTimeZone() || 'Asia/Bangkok';

const SHEET_DEFINITIONS = {
  Cards: ['id', 'cardName', 'bankName', 'creditLimit', 'statementDay', 'paymentDueDay', 'cardColor', 'cardType', 'notes', 'isActive', 'createdAt', 'updatedAt'],
  Transactions: ['id', 'cardId', 'date', 'amount', 'merchant', 'category', 'notes', 'receiptImageUrl', 'createdAt', 'updatedAt'],
  Payments: ['id', 'cardId', 'date', 'amount', 'notes', 'createdAt', 'updatedAt'],
  Installments: ['id', 'cardId', 'productName', 'totalPrice', 'numberOfInstallments', 'monthlyPayment', 'completedInstallments', 'startDate', 'nextPaymentDate', 'notes', 'createdAt', 'updatedAt'],
  Alerts: ['id', 'type', 'title', 'message', 'severity', 'cardId', 'createdAt', 'isRead'],
  Settings: ['key', 'value', 'description'],
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(PROJECT_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setupProject() {
  const result = runSetupCore_();
  Logger.log(JSON.stringify(result));
  return 'Setup complete. Spreadsheet URL: ' + result.spreadsheetUrl;
}

function runSetupAndCheck() {
  const result = runSetupCore_();
  const payload = buildAppState_(result.spreadsheet);
  payload.setupCompletedAt = new Date().toISOString();
  payload.setupSteps = result.steps;
  return payload;
}

function getAppData() {
  const spreadsheet = openProjectSpreadsheet_();
  if (!spreadsheet) {
    return emptyAppState_();
  }

  ensureAllSheets_(spreadsheet);
  ensureSeedData_(spreadsheet);
  return buildAppState_(spreadsheet);
}

function getSystemStatus() {
  return buildSystemStatus_(openProjectSpreadsheet_());
}

function saveCard(cardInput) {
  const spreadsheet = getRequiredSpreadsheet_();
  ensureAllSheets_(spreadsheet);

  const now = new Date().toISOString();
  const card = {
    id: sanitizeText_(cardInput.id) || createId_('CARD'),
    cardName: sanitizeText_(cardInput.cardName),
    bankName: sanitizeText_(cardInput.bankName),
    creditLimit: parseNumber_(cardInput.creditLimit),
    statementDay: normalizeDay_(cardInput.statementDay),
    paymentDueDay: normalizeDay_(cardInput.paymentDueDay),
    cardColor: sanitizeText_(cardInput.cardColor) || '#a78bfa',
    cardType: sanitizeText_(cardInput.cardType) || 'General',
    notes: sanitizeText_(cardInput.notes),
    isActive: normalizeBoolean_(cardInput.isActive),
    createdAt: sanitizeText_(cardInput.createdAt) || now,
    updatedAt: now,
  };

  if (!card.cardName) {
    throw new Error('Card name is required.');
  }
  if (!card.bankName) {
    throw new Error('Bank name is required.');
  }
  if (card.creditLimit <= 0) {
    throw new Error('Credit limit must be greater than 0.');
  }

  upsertObjectById_(spreadsheet.getSheetByName('Cards'), card);
  syncAlertsForSpreadsheet_(spreadsheet);
  return buildAppState_(spreadsheet);
}

function addTransaction(transactionInput) {
  const spreadsheet = getRequiredSpreadsheet_();
  ensureAllSheets_(spreadsheet);

  const transaction = {
    id: createId_('TXN'),
    cardId: sanitizeText_(transactionInput.cardId),
    date: normalizeDateText_(transactionInput.date) || formatDateKey_(new Date()),
    amount: parseNumber_(transactionInput.amount),
    merchant: sanitizeText_(transactionInput.merchant),
    category: sanitizeText_(transactionInput.category) || 'Others',
    notes: sanitizeText_(transactionInput.notes),
    receiptImageUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!transaction.cardId) {
    throw new Error('Please choose a credit card.');
  }
  if (transaction.amount <= 0) {
    throw new Error('Amount must be greater than 0.');
  }
  if (!transaction.merchant) {
    throw new Error('Merchant is required.');
  }

  appendObjectRow_(spreadsheet.getSheetByName('Transactions'), transaction);
  syncAlertsForSpreadsheet_(spreadsheet);
  return buildAppState_(spreadsheet);
}

function simulatePurchase(amountInput) {
  const spreadsheet = getRequiredSpreadsheet_();
  const state = buildAppState_(spreadsheet);
  return buildSimulator_(state.cards, parseNumber_(amountInput));
}

function runSetupCore_() {
  const spreadsheet = getOrCreateProjectSpreadsheet_();
  const steps = [];

  steps.push('spreadsheet-ready');
  steps.push.apply(steps, ensureAllSheets_(spreadsheet));
  steps.push.apply(steps, ensureSeedData_(spreadsheet));
  syncAlertsForSpreadsheet_(spreadsheet);
  steps.push('alerts-synced');

  return {
    ok: true,
    steps: steps,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    spreadsheet: spreadsheet,
  };
}

function getOrCreateProjectSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty(SPREADSHEET_PROPERTY_KEY);

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      properties.deleteProperty(SPREADSHEET_PROPERTY_KEY);
    }
  }

  const spreadsheet = SpreadsheetApp.create(PROJECT_NAME + ' Data');
  properties.setProperty(SPREADSHEET_PROPERTY_KEY, spreadsheet.getId());
  return spreadsheet;
}

function openProjectSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(SPREADSHEET_PROPERTY_KEY);
  if (!spreadsheetId) {
    return null;
  }

  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    PropertiesService.getScriptProperties().deleteProperty(SPREADSHEET_PROPERTY_KEY);
    return null;
  }
}

function getRequiredSpreadsheet_() {
  const spreadsheet = openProjectSpreadsheet_();
  if (spreadsheet) {
    return spreadsheet;
  }
  return runSetupCore_().spreadsheet;
}

function ensureAllSheets_(spreadsheet) {
  const steps = [];

  Object.keys(SHEET_DEFINITIONS).forEach(function(sheetName) {
    const headers = SHEET_DEFINITIONS[sheetName];
    let sheet = spreadsheet.getSheetByName(sheetName);
    let action = 'checked';

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      action = 'created';
    }

    if (!sheetHeadersMatch_(sheet, headers)) {
      sheet.clearContents();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      action = action === 'created' ? 'created-with-headers' : 'headers-reset';
    }

    steps.push(sheetName + ':' + action);
  });

  return steps;
}

function ensureSeedData_(spreadsheet) {
  const steps = [];

  if (writeRowsIfEmpty_(spreadsheet.getSheetByName('Cards'), buildSampleCards_())) {
    steps.push('cards-seeded');
  } else {
    steps.push('cards-ready');
  }

  if (writeRowsIfEmpty_(spreadsheet.getSheetByName('Transactions'), buildSampleTransactions_())) {
    steps.push('transactions-seeded');
  } else {
    steps.push('transactions-ready');
  }

  if (writeRowsIfEmpty_(spreadsheet.getSheetByName('Payments'), buildSamplePayments_())) {
    steps.push('payments-seeded');
  } else {
    steps.push('payments-ready');
  }

  if (writeRowsIfEmpty_(spreadsheet.getSheetByName('Installments'), buildSampleInstallments_())) {
    steps.push('installments-seeded');
  } else {
    steps.push('installments-ready');
  }

  if (writeRowsIfEmpty_(spreadsheet.getSheetByName('Settings'), buildSampleSettings_())) {
    steps.push('settings-seeded');
  } else {
    steps.push('settings-ready');
  }

  return steps;
}

function writeRowsIfEmpty_(sheet, rows) {
  if (!sheet || !rows.length) {
    return false;
  }

  if (sheet.getLastRow() > 1) {
    return false;
  }

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return true;
}

function buildSampleCards_() {
  const now = new Date().toISOString();
  return [
    ['CARD-1001', 'KBank Everyday', 'Kasikornbank', 85000, 12, 5, '#a78bfa', 'Rewards', 'Best for daily spending', true, now, now],
    ['CARD-1002', 'SCB Smart Travel', 'SCB', 120000, 18, 10, '#34d399', 'Travel', 'Flights and hotels', true, now, now],
    ['CARD-1003', 'Krungsri Family', 'Krungsri', 60000, 24, 15, '#f59e0b', 'Cashback', 'Groceries and utilities', true, now, now],
    ['CARD-1004', 'TTB Reserve', 'TTB', 150000, 28, 20, '#f472b6', 'Premium', 'High limit backup card', true, now, now],
  ];
}

function buildSampleTransactions_() {
  const now = new Date().toISOString();
  const items = [
    ['CARD-1001', daysAgo_(30), 245, 'Cafe Amazon', 'Food & Dining', 'Morning coffee'],
    ['CARD-1001', daysAgo_(28), 1380, '7-Eleven', 'Food & Dining', 'Groceries and snacks'],
    ['CARD-1001', daysAgo_(24), 890, 'Grab', 'Travel', 'Commute to office'],
    ['CARD-1001', daysAgo_(20), 1599, 'AIS', 'Utilities', 'Mobile + internet package'],
    ['CARD-1001', daysAgo_(8), 2490, 'Central', 'Shopping', 'New shirts'],
    ['CARD-1001', daysAgo_(4), 720, 'PTT Station', 'Fuel', 'Fuel refill'],
    ['CARD-1002', daysAgo_(34), 12500, 'AirAsia', 'Travel', 'Flight booking'],
    ['CARD-1002', daysAgo_(31), 4200, 'Booking.com', 'Travel', 'Hotel deposit'],
    ['CARD-1002', daysAgo_(26), 960, 'Starbucks', 'Food & Dining', 'Coffee meeting'],
    ['CARD-1002', daysAgo_(19), 3280, 'Boots', 'Healthcare', 'Health products'],
    ['CARD-1002', daysAgo_(11), 2400, 'Shell', 'Fuel', 'Road trip fuel'],
    ['CARD-1002', daysAgo_(1), 6800, 'Apple Store', 'Shopping', 'AirPods upgrade'],
    ['CARD-1003', daysAgo_(29), 1850, 'Big C', 'Food & Dining', 'Weekly groceries'],
    ['CARD-1003', daysAgo_(25), 2120, 'HomePro', 'Shopping', 'Home essentials'],
    ['CARD-1003', daysAgo_(21), 950, 'Netflix', 'Entertainment', 'Streaming subscription'],
    ['CARD-1003', daysAgo_(17), 1400, 'BTS', 'Travel', 'Monthly commute'],
    ['CARD-1003', daysAgo_(9), 3100, 'Metropolitan Electricity', 'Utilities', 'Electric bill'],
    ['CARD-1003', daysAgo_(2), 2200, 'Lotus', 'Food & Dining', 'Stock-up groceries'],
    ['CARD-1004', daysAgo_(33), 15500, 'Power Buy', 'Shopping', 'Monitor purchase'],
    ['CARD-1004', daysAgo_(27), 4700, 'Bangkok Hospital', 'Healthcare', 'Annual check-up'],
    ['CARD-1004', daysAgo_(23), 8800, 'Lazada', 'Shopping', 'Office chair and desk lamp'],
    ['CARD-1004', daysAgo_(14), 3600, 'True', 'Utilities', 'Fiber internet add-on'],
    ['CARD-1004', daysAgo_(6), 5400, 'Major Cineplex', 'Entertainment', 'Family movie night'],
    ['CARD-1004', daysAgo_(3), 6200, 'Thai Airways', 'Travel', 'Domestic work trip'],
  ];

  return items.map(function(item, index) {
    return [
      'TXN-' + (2001 + index),
      item[0],
      item[1],
      item[2],
      item[3],
      item[4],
      item[5],
      '',
      now,
      now,
    ];
  });
}

function buildSamplePayments_() {
  const now = new Date().toISOString();
  return [
    ['PAY-3001', 'CARD-1001', daysAgo_(18), 4200, 'Paid mobile and food spend', now, now],
    ['PAY-3002', 'CARD-1002', daysAgo_(10), 8000, 'Partial payment after travel booking', now, now],
    ['PAY-3003', 'CARD-1003', daysAgo_(7), 2500, 'Paid grocery and electric bills', now, now],
    ['PAY-3004', 'CARD-1004', daysAgo_(5), 12000, 'Reduced premium card utilization', now, now],
    ['PAY-3005', 'CARD-1001', daysAgo_(2), 3100, 'Top-up payment before due date', now, now],
  ];
}

function buildSampleInstallments_() {
  const now = new Date().toISOString();
  return [
    ['INS-4001', 'CARD-1002', 'Tokyo Flight Package', 36000, 6, 6000, 2, daysAgo_(55), daysFromToday_(6), 'Travel installment plan', now, now],
    ['INS-4002', 'CARD-1003', 'Washing Machine', 18000, 9, 2000, 5, daysAgo_(140), daysFromToday_(12), 'Home appliance installment', now, now],
    ['INS-4003', 'CARD-1004', 'MacBook Upgrade', 54000, 12, 4500, 3, daysAgo_(82), daysFromToday_(3), 'Work device installment', now, now],
  ];
}

function buildSampleSettings_() {
  return [
    ['currency', 'THB', 'Display currency code'],
    ['warningUtilization', '50', 'Low alert threshold'],
    ['dangerUtilization', '80', 'High alert threshold'],
    ['statementNoticeDays', '7,3,1', 'Days before statement date to alert'],
    ['paymentNoticeDays', '7,3,1', 'Days before payment due date to alert'],
  ];
}

function buildAppState_(spreadsheet) {
  ensureAllSheets_(spreadsheet);

  const cardsRaw = readSheetObjects_(spreadsheet.getSheetByName('Cards'));
  const transactionsRaw = readSheetObjects_(spreadsheet.getSheetByName('Transactions'));
  const paymentsRaw = readSheetObjects_(spreadsheet.getSheetByName('Payments'));
  const installmentsRaw = readSheetObjects_(spreadsheet.getSheetByName('Installments'));
  const settings = readSettings_(spreadsheet.getSheetByName('Settings'));

  const cards = buildCardSummaries_(cardsRaw, transactionsRaw, paymentsRaw);
  const cardMap = toMapById_(cards);
  const transactions = buildTransactions_(transactionsRaw, cardMap);
  const payments = buildPayments_(paymentsRaw, cardMap);
  const installments = buildInstallments_(installmentsRaw, cardMap);
  const alerts = buildAlerts_(cards, installments, settings);
  const reports = buildReports_(transactions, cards);
  const dashboard = buildDashboard_(cards, transactions, alerts);
  const insights = buildInsights_(cards, transactions, reports);

  syncAlertsSheet_(spreadsheet, alerts);

  return {
    projectName: PROJECT_NAME,
    generatedAt: new Date().toISOString(),
    needsSetup: false,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    systemStatus: buildSystemStatus_(spreadsheet),
    dashboard: dashboard,
    cards: cards,
    transactions: transactions,
    payments: payments,
    installments: installments,
    alerts: alerts,
    reports: reports,
    insights: insights,
    settings: settings,
    simulatorExample: buildSimulator_(cards, 5000),
  };
}

function emptyAppState_() {
  return {
    projectName: PROJECT_NAME,
    generatedAt: new Date().toISOString(),
    needsSetup: true,
    spreadsheetId: '',
    spreadsheetUrl: '',
    systemStatus: buildSystemStatus_(null),
    dashboard: {
      totalCreditLimit: 0,
      totalCurrentBalance: 0,
      totalAvailableCredit: 0,
      overallUtilization: 0,
      activeCardCount: 0,
      alertCount: 0,
      recentTransactions: [],
    },
    cards: [],
    transactions: [],
    payments: [],
    installments: [],
    alerts: [],
    reports: {
      monthlySpending: [],
      categorySpending: [],
      cardSpending: [],
      merchantUsage: [],
      topTransactions: [],
      utilizationByCard: [],
    },
    insights: [],
    settings: {},
    simulatorExample: buildSimulator_([], 5000),
  };
}

function buildCardSummaries_(cardsRaw, transactionsRaw, paymentsRaw) {
  const cards = cardsRaw.map(function(card) {
    const transactionTotal = sumByCard_(transactionsRaw, card.id);
    const paymentTotal = sumByCard_(paymentsRaw, card.id);
    const creditLimit = parseNumber_(card.creditLimit);
    const currentBalance = round2_(Math.max(transactionTotal - paymentTotal, 0));
    const availableCredit = round2_(Math.max(creditLimit - currentBalance, 0));
    const utilization = creditLimit > 0 ? round2_((currentBalance / creditLimit) * 100) : 0;
    const statementDate = nextMonthlyDate_(card.statementDay);
    const paymentDueDate = nextMonthlyDate_(card.paymentDueDay);

    return {
      id: sanitizeText_(card.id),
      cardName: sanitizeText_(card.cardName),
      bankName: sanitizeText_(card.bankName),
      creditLimit: creditLimit,
      statementDay: normalizeDay_(card.statementDay),
      paymentDueDay: normalizeDay_(card.paymentDueDay),
      cardColor: sanitizeText_(card.cardColor) || '#a78bfa',
      cardType: sanitizeText_(card.cardType) || 'General',
      notes: sanitizeText_(card.notes),
      isActive: normalizeBoolean_(card.isActive),
      createdAt: sanitizeText_(card.createdAt),
      updatedAt: sanitizeText_(card.updatedAt),
      currentBalance: currentBalance,
      availableCredit: availableCredit,
      utilization: utilization,
      statementDate: formatDateKey_(statementDate),
      paymentDueDate: formatDateKey_(paymentDueDate),
      statementInDays: daysBetweenToday_(statementDate),
      paymentDueInDays: daysBetweenToday_(paymentDueDate),
      statusColor: utilizationColor_(utilization),
    };
  });

  return cards.sort(function(a, b) {
    return b.availableCredit - a.availableCredit;
  });
}

function buildTransactions_(rows, cardMap) {
  return rows.map(function(row) {
    const card = cardMap[row.cardId];
    return {
      id: sanitizeText_(row.id),
      cardId: sanitizeText_(row.cardId),
      cardName: card ? card.cardName : 'Unknown card',
      bankName: card ? card.bankName : '',
      date: normalizeDateText_(row.date),
      amount: parseNumber_(row.amount),
      merchant: sanitizeText_(row.merchant),
      category: sanitizeText_(row.category),
      notes: sanitizeText_(row.notes),
    };
  }).sort(sortByDateDesc_);
}

function buildPayments_(rows, cardMap) {
  return rows.map(function(row) {
    const card = cardMap[row.cardId];
    return {
      id: sanitizeText_(row.id),
      cardId: sanitizeText_(row.cardId),
      cardName: card ? card.cardName : 'Unknown card',
      date: normalizeDateText_(row.date),
      amount: parseNumber_(row.amount),
      notes: sanitizeText_(row.notes),
    };
  }).sort(sortByDateDesc_);
}

function buildInstallments_(rows, cardMap) {
  return rows.map(function(row) {
    const numberOfInstallments = parseInteger_(row.numberOfInstallments);
    const completedInstallments = parseInteger_(row.completedInstallments);
    const remainingInstallments = Math.max(numberOfInstallments - completedInstallments, 0);
    const monthlyPayment = parseNumber_(row.monthlyPayment);
    const nextPaymentDate = toDate_(row.nextPaymentDate);
    const card = cardMap[row.cardId];

    return {
      id: sanitizeText_(row.id),
      cardId: sanitizeText_(row.cardId),
      cardName: card ? card.cardName : 'Unknown card',
      productName: sanitizeText_(row.productName),
      totalPrice: parseNumber_(row.totalPrice),
      numberOfInstallments: numberOfInstallments,
      monthlyPayment: monthlyPayment,
      completedInstallments: completedInstallments,
      remainingInstallments: remainingInstallments,
      outstandingBalance: round2_(remainingInstallments * monthlyPayment),
      startDate: normalizeDateText_(row.startDate),
      nextPaymentDate: formatDateKey_(nextPaymentDate),
      nextPaymentInDays: daysBetweenToday_(nextPaymentDate),
      notes: sanitizeText_(row.notes),
    };
  }).sort(function(a, b) {
    return a.nextPaymentInDays - b.nextPaymentInDays;
  });
}

function buildDashboard_(cards, transactions, alerts) {
  const activeCards = cards.filter(function(card) { return card.isActive; });
  const totalCreditLimit = round2_(activeCards.reduce(function(sum, card) { return sum + card.creditLimit; }, 0));
  const totalCurrentBalance = round2_(activeCards.reduce(function(sum, card) { return sum + card.currentBalance; }, 0));
  const totalAvailableCredit = round2_(activeCards.reduce(function(sum, card) { return sum + card.availableCredit; }, 0));

  return {
    totalCreditLimit: totalCreditLimit,
    totalCurrentBalance: totalCurrentBalance,
    totalAvailableCredit: totalAvailableCredit,
    overallUtilization: totalCreditLimit > 0 ? round2_((totalCurrentBalance / totalCreditLimit) * 100) : 0,
    activeCardCount: activeCards.length,
    alertCount: alerts.length,
    recentTransactions: transactions.slice(0, 8),
  };
}

function buildReports_(transactions, cards) {
  const monthlyMap = {};
  const monthlyLabels = {};
  const categoryMap = {};
  const merchantMap = {};
  const cardMap = {};
  const cardNameMap = toMapById_(cards);

  transactions.forEach(function(item) {
    const date = toDate_(item.date);
    const monthKey = Utilities.formatDate(date, APP_TIMEZONE, 'yyyy-MM');
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + item.amount;
    monthlyLabels[monthKey] = Utilities.formatDate(date, APP_TIMEZONE, 'MMM yyyy');
    categoryMap[item.category] = (categoryMap[item.category] || 0) + item.amount;
    merchantMap[item.merchant] = (merchantMap[item.merchant] || 0) + item.amount;
    cardMap[item.cardId] = (cardMap[item.cardId] || 0) + item.amount;
  });

  return {
    monthlySpending: Object.keys(monthlyMap).sort().map(function(key) {
      return { key: key, label: monthlyLabels[key], value: round2_(monthlyMap[key]) };
    }),
    categorySpending: toSortedSeries_(categoryMap, function(key) { return key; }),
    cardSpending: toSortedSeries_(cardMap, function(key) { return cardNameMap[key] ? cardNameMap[key].cardName : key; }),
    merchantUsage: toSortedSeries_(merchantMap, function(key) { return key; }).slice(0, 6),
    topTransactions: transactions.slice().sort(function(a, b) { return b.amount - a.amount; }).slice(0, 10),
    utilizationByCard: cards.map(function(card) {
      return { label: card.cardName, value: card.utilization };
    }).sort(function(a, b) {
      return b.value - a.value;
    }),
  };
}

function buildAlerts_(cards, installments, settings) {
  const alerts = [];
  const statementNoticeDays = parseNumberList_(settings.statementNoticeDays || '7,3,1');
  const paymentNoticeDays = parseNumberList_(settings.paymentNoticeDays || '7,3,1');

  cards.filter(function(card) { return card.isActive; }).forEach(function(card) {
    if (card.utilization >= 90) {
      alerts.push(makeAlert_('utilization', 'critical', card.id, 'Card near limit', card.cardName + ' utilization is at ' + card.utilization + '%.'));
    } else if (card.utilization >= 80) {
      alerts.push(makeAlert_('utilization', 'high', card.id, 'High utilization', card.cardName + ' utilization is above 80%.'));
    } else if (card.utilization >= 70) {
      alerts.push(makeAlert_('utilization', 'medium', card.id, 'Utilization warning', card.cardName + ' utilization is above 70%.'));
    } else if (card.utilization >= 50) {
      alerts.push(makeAlert_('utilization', 'low', card.id, 'Utilization heads-up', card.cardName + ' utilization is above 50%.'));
    }

    if (statementNoticeDays.indexOf(card.statementInDays) !== -1) {
      alerts.push(makeAlert_('statement', 'medium', card.id, 'Statement date is coming up', card.cardName + ' statement date is in ' + card.statementInDays + ' day(s).'));
    }

    if (paymentNoticeDays.indexOf(card.paymentDueInDays) !== -1) {
      alerts.push(makeAlert_('payment', card.paymentDueInDays <= 1 ? 'critical' : card.paymentDueInDays <= 3 ? 'high' : 'medium', card.id, 'Payment due soon', card.cardName + ' payment due date is in ' + card.paymentDueInDays + ' day(s).'));
    }
  });

  installments.forEach(function(item) {
    if (item.nextPaymentInDays <= 7) {
      alerts.push(makeAlert_('installment', item.nextPaymentInDays <= 3 ? 'high' : 'medium', item.cardId, 'Installment due soon', item.productName + ' installment is due in ' + item.nextPaymentInDays + ' day(s).'));
    }
  });

  return alerts.sort(function(a, b) {
    return severityScore_(b.severity) - severityScore_(a.severity);
  });
}

function buildInsights_(cards, transactions, reports) {
  const insights = [];
  const monthly = reports.monthlySpending || [];

  if (monthly.length >= 2) {
    const current = monthly[monthly.length - 1];
    const previous = monthly[monthly.length - 2];
    if (previous.value > 0 && current.value > previous.value * 1.1) {
      insights.push('Spending increased this month compared with the previous month.');
    }
  }

  if (reports.categorySpending.length > 0) {
    insights.push(reports.categorySpending[0].label + ' is your top spending category right now.');
  }

  const highUtilizationCard = cards.find(function(card) { return card.utilization >= 80; });
  if (highUtilizationCard) {
    insights.push(highUtilizationCard.cardName + ' is close to its limit and should be used carefully.');
  }

  const recommendedCard = cards.filter(function(card) { return card.isActive; }).sort(function(a, b) {
    return (a.utilization - b.utilization) || (b.availableCredit - a.availableCredit);
  })[0];

  if (recommendedCard) {
    insights.push('Best card to use next is ' + recommendedCard.cardName + ' because it has low utilization and strong available credit.');
  }

  if (transactions.length === 0) {
    insights.push('No transactions yet. Add one to start seeing smart insights.');
  }

  return insights.slice(0, 4);
}

function buildSimulator_(cards, amount) {
  if (amount <= 0) {
    return {
      amount: 0,
      recommendation: 'Enter an amount to simulate a purchase.',
      cards: [],
    };
  }

  const rows = cards.filter(function(card) { return card.isActive; }).map(function(card) {
    const newBalance = round2_(card.currentBalance + amount);
    const newAvailableCredit = round2_(Math.max(card.creditLimit - newBalance, 0));
    const newUtilization = card.creditLimit > 0 ? round2_((newBalance / card.creditLimit) * 100) : 0;

    return {
      id: card.id,
      cardName: card.cardName,
      canUse: newBalance <= card.creditLimit,
      newBalance: newBalance,
      newAvailableCredit: newAvailableCredit,
      newUtilization: newUtilization,
    };
  }).sort(function(a, b) {
    if (a.canUse !== b.canUse) {
      return a.canUse ? -1 : 1;
    }
    return a.newUtilization - b.newUtilization;
  });

  const bestCard = rows.find(function(item) { return item.canUse; });
  return {
    amount: amount,
    recommendation: bestCard ? 'Recommended card: ' + bestCard.cardName : 'No card can cover this purchase safely.',
    cards: rows,
  };
}

function syncAlertsForSpreadsheet_(spreadsheet) {
  const cards = buildCardSummaries_(
    readSheetObjects_(spreadsheet.getSheetByName('Cards')),
    readSheetObjects_(spreadsheet.getSheetByName('Transactions')),
    readSheetObjects_(spreadsheet.getSheetByName('Payments'))
  );
  const installments = buildInstallments_(
    readSheetObjects_(spreadsheet.getSheetByName('Installments')),
    toMapById_(cards)
  );
  const settings = readSettings_(spreadsheet.getSheetByName('Settings'));
  syncAlertsSheet_(spreadsheet, buildAlerts_(cards, installments, settings));
}

function syncAlertsSheet_(spreadsheet, alerts) {
  const sheet = spreadsheet.getSheetByName('Alerts');
  const headers = SHEET_DEFINITIONS.Alerts;

  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);

  if (!alerts.length) {
    return;
  }

  const rows = alerts.map(function(alert) {
    return [
      alert.id,
      alert.type,
      alert.title,
      alert.message,
      alert.severity,
      alert.cardId,
      alert.createdAt,
      false,
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function buildSystemStatus_(spreadsheet) {
  if (!spreadsheet) {
    return {
      projectName: PROJECT_NAME,
      connected: false,
      spreadsheetFound: false,
      spreadsheetId: '',
      spreadsheetUrl: '',
      spreadsheetName: '',
      message: 'No project spreadsheet connected yet. Run setupProject first.',
      sheetStatus: Object.keys(SHEET_DEFINITIONS).map(function(name) {
        return { name: name, exists: false, rowCount: 0, hasHeaders: false };
      }),
      missingSheets: Object.keys(SHEET_DEFINITIONS),
    };
  }

  const sheetStatus = Object.keys(SHEET_DEFINITIONS).map(function(name) {
    const sheet = spreadsheet.getSheetByName(name);
    return {
      name: name,
      exists: !!sheet,
      rowCount: sheet ? Math.max(sheet.getLastRow() - 1, 0) : 0,
      hasHeaders: sheet ? sheet.getLastRow() >= 1 : false,
    };
  });

  const missingSheets = sheetStatus.filter(function(item) {
    return !item.exists;
  }).map(function(item) {
    return item.name;
  });

  return {
    projectName: PROJECT_NAME,
    connected: true,
    spreadsheetFound: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    spreadsheetName: spreadsheet.getName(),
    message: missingSheets.length ? 'Some sheets are missing.' : 'Spreadsheet connection is healthy.',
    sheetStatus: sheetStatus,
    missingSheets: missingSheets,
  };
}

function readSheetObjects_(sheet) {
  if (!sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];
  return values.slice(1).filter(function(row) {
    return row.join('').toString().trim() !== '';
  }).map(function(row) {
    const item = {};
    headers.forEach(function(header, index) {
      item[header] = row[index];
    });
    return item;
  });
}

function readSettings_(sheet) {
  return readSheetObjects_(sheet).reduce(function(map, row) {
    map[sanitizeText_(row.key)] = sanitizeText_(row.value);
    return map;
  }, {});
}

function sheetHeadersMatch_(sheet, headers) {
  if (!sheet || sheet.getLastRow() === 0) {
    return false;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  return currentHeaders.join('|') === headers.join('|');
}

function appendObjectRow_(sheet, objectRow) {
  const headers = SHEET_DEFINITIONS[sheet.getName()];
  const row = headers.map(function(header) {
    return objectRow[header];
  });

  const nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
}

function upsertObjectById_(sheet, objectRow) {
  const headers = SHEET_DEFINITIONS[sheet.getName()];
  const values = sheet.getDataRange().getValues();
  const idIndex = headers.indexOf('id');
  const row = headers.map(function(header) {
    return objectRow[header];
  });

  for (let i = 1; i < values.length; i += 1) {
    if (values[i][idIndex] === objectRow.id) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
}

function toMapById_(rows) {
  return rows.reduce(function(map, row) {
    map[row.id] = row;
    return map;
  }, {});
}

function sumByCard_(rows, cardId) {
  return round2_(rows.filter(function(row) {
    return sanitizeText_(row.cardId) === sanitizeText_(cardId);
  }).reduce(function(sum, row) {
    return sum + parseNumber_(row.amount);
  }, 0));
}

function makeAlert_(type, severity, cardId, title, message) {
  return {
    id: createId_('ALT'),
    type: type,
    title: title,
    message: message,
    severity: severity,
    cardId: cardId,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
}

function createId_(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function daysAgo_(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateKey_(date);
}

function daysFromToday_(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateKey_(date);
}

function normalizeDateText_(value) {
  const text = sanitizeText_(value);
  if (!text) {
    return '';
  }
  return formatDateKey_(toDate_(text));
}

function nextMonthlyDate_(dayValue) {
  const day = normalizeDay_(dayValue);
  const today = stripTime_(new Date());
  let date = new Date(today.getFullYear(), today.getMonth(), day);

  if (date.getTime() < today.getTime()) {
    date = new Date(today.getFullYear(), today.getMonth() + 1, day);
  }

  return date;
}

function daysBetweenToday_(date) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((stripTime_(date).getTime() - stripTime_(new Date()).getTime()) / oneDay);
}

function toDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return value;
  }

  const text = sanitizeText_(value);
  if (!text) {
    return new Date();
  }

  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function stripTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateKey_(date) {
  return Utilities.formatDate(date, APP_TIMEZONE, 'yyyy-MM-dd');
}

function parseNumberList_(value) {
  return sanitizeText_(value).split(',').map(function(item) {
    return parseInteger_(item);
  }).filter(function(item) {
    return !isNaN(item);
  });
}

function parseInteger_(value) {
  const number = parseInt(value, 10);
  return isNaN(number) ? 0 : number;
}

function parseNumber_(value) {
  const number = Number(value);
  return isNaN(number) ? 0 : number;
}

function round2_(value) {
  return Math.round(value * 100) / 100;
}

function sanitizeText_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeBoolean_(value) {
  const text = String(value).toLowerCase();
  return value === true || text === 'true' || text === '1';
}

function normalizeDay_(value) {
  const day = parseInteger_(value) || 1;
  return Math.max(1, Math.min(day, 28));
}

function utilizationColor_(utilization) {
  if (utilization >= 90) {
    return '#ef4444';
  }
  if (utilization >= 70) {
    return '#f97316';
  }
  if (utilization >= 50) {
    return '#f59e0b';
  }
  return '#34d399';
}

function severityScore_(severity) {
  return {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }[severity] || 0;
}

function toSortedSeries_(map, labelResolver) {
  return Object.keys(map).map(function(key) {
    return {
      label: labelResolver(key),
      value: round2_(map[key]),
    };
  }).sort(function(a, b) {
    return b.value - a.value;
  });
}

function sortByDateDesc_(a, b) {
  return toDate_(b.date).getTime() - toDate_(a.date).getTime();
}
