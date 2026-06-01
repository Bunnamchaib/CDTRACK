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

function getAppData() {
  const spreadsheet = openProjectSpreadsheet_();
  if (!spreadsheet) {
    return {
      projectName: PROJECT_NAME,
      needsSetup: true,
      generatedAt: new Date().toISOString(),
      systemStatus: buildSystemStatus_(null),
    };
  }

  initializeSheets_(spreadsheet);
  ensureDemoData_(spreadsheet);
  const payload = buildAppPayload_(spreadsheet);
  syncAlertsSheet_(spreadsheet, payload.alerts);
  payload.systemStatus = buildSystemStatus_(spreadsheet);
  return payload;
}

function setupProject() {
  const spreadsheet = ensureProjectSpreadsheet_();
  initializeSheets_(spreadsheet);
  ensureDemoData_(spreadsheet);

  const payload = buildAppPayload_(spreadsheet);
  syncAlertsSheet_(spreadsheet, payload.alerts);
  payload.setupCompletedAt = new Date().toISOString();
  payload.systemStatus = buildSystemStatus_(spreadsheet);
  return payload;
}

function getSystemStatus() {
  const spreadsheet = openProjectSpreadsheet_();
  return buildSystemStatus_(spreadsheet);
}

function runSetupAndCheck() {
  const spreadsheet = ensureProjectSpreadsheet_();
  initializeSheets_(spreadsheet);
  ensureDemoData_(spreadsheet);
  const payload = buildAppPayload_(spreadsheet);
  syncAlertsSheet_(spreadsheet, payload.alerts);
  payload.systemStatus = buildSystemStatus_(spreadsheet);
  payload.setupCompletedAt = new Date().toISOString();
  return payload;
}

function saveCard(cardInput) {
  const spreadsheet = getRequiredSpreadsheet_();
  initializeSheets_(spreadsheet);

  const sheet = spreadsheet.getSheetByName('Cards');
  const now = new Date().toISOString();
  const card = {
    id: (cardInput.id || '').trim() || createId_('CARD'),
    cardName: sanitizeText_(cardInput.cardName),
    bankName: sanitizeText_(cardInput.bankName),
    creditLimit: parseNumber_(cardInput.creditLimit),
    statementDay: parseInt(cardInput.statementDay, 10) || 1,
    paymentDueDay: parseInt(cardInput.paymentDueDay, 10) || 1,
    cardColor: sanitizeText_(cardInput.cardColor) || '#a78bfa',
    cardType: sanitizeText_(cardInput.cardType) || 'General',
    notes: sanitizeText_(cardInput.notes),
    isActive: normalizeBoolean_(cardInput.isActive),
    createdAt: cardInput.createdAt || now,
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

  upsertRowById_(sheet, card.id, card);

  const payload = buildAppPayload_(spreadsheet);
  syncAlertsSheet_(spreadsheet, payload.alerts);
  return payload;
}

function addTransaction(transactionInput) {
  const spreadsheet = getRequiredSpreadsheet_();
  initializeSheets_(spreadsheet);

  const cardId = sanitizeText_(transactionInput.cardId);
  if (!cardId) {
    throw new Error('Please choose a credit card.');
  }

  const amount = parseNumber_(transactionInput.amount);
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0.');
  }

  const transaction = {
    id: createId_('TXN'),
    cardId: cardId,
    date: sanitizeText_(transactionInput.date) || formatDateKey_(new Date()),
    amount: amount,
    merchant: sanitizeText_(transactionInput.merchant) || 'Unknown merchant',
    category: sanitizeText_(transactionInput.category) || 'Others',
    notes: sanitizeText_(transactionInput.notes),
    receiptImageUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appendObjectRow_(spreadsheet.getSheetByName('Transactions'), transaction);

  const payload = buildAppPayload_(spreadsheet);
  syncAlertsSheet_(spreadsheet, payload.alerts);
  return payload;
}

function simulatePurchase(amountInput) {
  const spreadsheet = getRequiredSpreadsheet_();
  const payload = buildAppPayload_(spreadsheet);
  const amount = parseNumber_(amountInput);
  return buildSimulatorResult_(payload.cards, amount);
}

function ensureProjectSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty(SPREADSHEET_PROPERTY_KEY);
  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      properties.deleteProperty(SPREADSHEET_PROPERTY_KEY);
    }
  }

  const recoveredSpreadsheet = findExistingProjectSpreadsheet_();
  if (recoveredSpreadsheet) {
    properties.setProperty(SPREADSHEET_PROPERTY_KEY, recoveredSpreadsheet.getId());
    return recoveredSpreadsheet;
  }

  const spreadsheet = SpreadsheetApp.create(PROJECT_NAME + ' Data');
  properties.setProperty(SPREADSHEET_PROPERTY_KEY, spreadsheet.getId());
  return spreadsheet;
}

function openProjectSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty(SPREADSHEET_PROPERTY_KEY);
  if (!spreadsheetId) {
    const recoveredSpreadsheet = findExistingProjectSpreadsheet_();
    if (recoveredSpreadsheet) {
      properties.setProperty(SPREADSHEET_PROPERTY_KEY, recoveredSpreadsheet.getId());
      return recoveredSpreadsheet;
    }
    return null;
  }

  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    properties.deleteProperty(SPREADSHEET_PROPERTY_KEY);
    const recoveredSpreadsheet = findExistingProjectSpreadsheet_();
    if (recoveredSpreadsheet) {
      properties.setProperty(SPREADSHEET_PROPERTY_KEY, recoveredSpreadsheet.getId());
      return recoveredSpreadsheet;
    }
    return null;
  }
}

function getRequiredSpreadsheet_() {
  const spreadsheet = openProjectSpreadsheet_();
  if (!spreadsheet) {
    throw new Error('Please run setup first to create the spreadsheet and seed demo data.');
  }
  return spreadsheet;
}

function initializeSheets_(spreadsheet) {
  Object.keys(SHEET_DEFINITIONS).forEach(function(sheetName) {
    const headers = SHEET_DEFINITIONS[sheetName];
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      if (existingHeaders.join('|') !== headers.join('|')) {
        sheet.clear();
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
      }
    }
  });

  removeEmptyDefaultSheet_(spreadsheet);
}

function removeEmptyDefaultSheet_(spreadsheet) {
  const defaultSheet = spreadsheet.getSheetByName('Sheet1');
  if (!defaultSheet || spreadsheet.getSheets().length <= 1) {
    return;
  }

  const values = defaultSheet.getDataRange().getValues();
  const isEmpty = values.length === 1 && values[0].join('').trim() === '';
  if (isEmpty) {
    spreadsheet.deleteSheet(defaultSheet);
  }
}

function seedIfEmpty_(spreadsheet) {
  const now = new Date().toISOString();
  const cards = [
    ['CARD-1001', 'KBank Everyday', 'Kasikornbank', 85000, 12, 5, '#a78bfa', 'Rewards', 'Best for daily spending', true, now, now],
    ['CARD-1002', 'SCB Smart Travel', 'SCB', 120000, 18, 10, '#34d399', 'Travel', 'Used for flights and hotels', true, now, now],
    ['CARD-1003', 'Krungsri Family', 'Krungsri', 60000, 24, 15, '#f59e0b', 'Cashback', 'Good for groceries and utilities', true, now, now],
    ['CARD-1004', 'TTB Reserve', 'TTB', 150000, 28, 20, '#f472b6', 'Premium', 'Main backup card with high limit', true, now, now],
  ];

  const transactions = buildSampleTransactions_(now);
  const payments = [
    ['PAY-3001', 'CARD-1001', daysAgo_(18), 4200, 'Paid mobile and food spend', now, now],
    ['PAY-3002', 'CARD-1002', daysAgo_(10), 8000, 'Partial payment after travel booking', now, now],
    ['PAY-3003', 'CARD-1003', daysAgo_(7), 2500, 'Paid grocery and electric bills', now, now],
    ['PAY-3004', 'CARD-1004', daysAgo_(5), 12000, 'Reduced premium card utilization', now, now],
    ['PAY-3005', 'CARD-1001', daysAgo_(2), 3100, 'Top-up payment before due date', now, now],
  ];

  const installments = [
    ['INS-4001', 'CARD-1002', 'Tokyo Flight Package', 36000, 6, 6000, 2, daysAgo_(55), daysFromToday_(6), 'Travel installment plan', now, now],
    ['INS-4002', 'CARD-1003', 'Washing Machine', 18000, 9, 2000, 5, daysAgo_(140), daysFromToday_(12), 'Home appliance installment', now, now],
    ['INS-4003', 'CARD-1004', 'MacBook Upgrade', 54000, 12, 4500, 3, daysAgo_(82), daysFromToday_(3), 'Work device installment', now, now],
  ];

  const settings = [
    ['currency', 'THB', 'Display currency code'],
    ['warningUtilization', '50', 'Low alert threshold'],
    ['dangerUtilization', '80', 'High alert threshold'],
    ['statementNoticeDays', '7,3,1', 'Days before statement date to alert'],
    ['paymentNoticeDays', '7,3,1', 'Days before payment due date to alert'],
  ];

  seedSheetIfEmpty_(spreadsheet.getSheetByName('Cards'), cards);
  seedSheetIfEmpty_(spreadsheet.getSheetByName('Transactions'), transactions);
  seedSheetIfEmpty_(spreadsheet.getSheetByName('Payments'), payments);
  seedSheetIfEmpty_(spreadsheet.getSheetByName('Installments'), installments);
  seedSheetIfEmpty_(spreadsheet.getSheetByName('Settings'), settings);
}

function buildSampleTransactions_(timestamp) {
  const templates = [
    ['CARD-1001', daysAgo_(30), 245, 'Cafe Amazon', 'Food & Dining', 'Morning coffee'],
    ['CARD-1001', daysAgo_(28), 1380, '7-Eleven', 'Food & Dining', 'Groceries and snacks'],
    ['CARD-1001', daysAgo_(24), 890, 'Grab', 'Travel', 'Commute to office'],
    ['CARD-1001', daysAgo_(20), 1599, 'AIS', 'Utilities', 'Mobile + internet package'],
    ['CARD-1001', daysAgo_(8), 2490, 'Central', 'Shopping', 'New shirts'],
    ['CARD-1001', daysAgo_(4), 720, 'PTT Station', 'Fuel', 'Fuel refill'],
    ['CARD-1002', daysAgo_(34), 12500, 'AirAsia', 'Travel', 'Flight booking'],
    ['CARD-1002', daysAgo_(31), 4200, 'Booking.com', 'Travel', 'Hotel deposit'],
    ['CARD-1002', daysAgo_(26), 960, 'Starbucks', 'Food & Dining', 'Coffee meeting'],
    ['CARD-1002', daysAgo_(19), 3280, 'Boots', 'Healthcare', 'Pharmacy and health products'],
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
    ['CARD-1004', daysAgo_(14), 3600, 'True', 'Utilities', 'Fiber internet annual add-on'],
    ['CARD-1004', daysAgo_(6), 5400, 'Major Cineplex', 'Entertainment', 'Family movie night'],
    ['CARD-1004', daysAgo_(3), 6200, 'Thai Airways', 'Travel', 'Domestic work trip'],
  ];

  return templates.map(function(item, index) {
    return [
      'TXN-' + (2001 + index),
      item[0],
      item[1],
      item[2],
      item[3],
      item[4],
      item[5],
      '',
      timestamp,
      timestamp,
    ];
  });
}

function buildAppPayload_(spreadsheet) {
  const rawCards = getSheetObjects_(spreadsheet.getSheetByName('Cards'));
  const rawTransactions = getSheetObjects_(spreadsheet.getSheetByName('Transactions'));
  const rawPayments = getSheetObjects_(spreadsheet.getSheetByName('Payments'));
  const rawInstallments = getSheetObjects_(spreadsheet.getSheetByName('Installments'));
  const settings = getSettingsMap_(spreadsheet.getSheetByName('Settings'));

  const cardLookup = {};
  const cardSummaries = rawCards.map(function(card) {
    const limit = parseNumber_(card.creditLimit);
    const transactionTotal = rawTransactions
      .filter(function(transaction) { return transaction.cardId === card.id; })
      .reduce(function(sum, transaction) { return sum + parseNumber_(transaction.amount); }, 0);
    const paymentTotal = rawPayments
      .filter(function(payment) { return payment.cardId === card.id; })
      .reduce(function(sum, payment) { return sum + parseNumber_(payment.amount); }, 0);

    const currentBalance = Math.max(transactionTotal - paymentTotal, 0);
    const availableCredit = Math.max(limit - currentBalance, 0);
    const utilization = limit > 0 ? round2_((currentBalance / limit) * 100) : 0;
    const statementDate = nextMonthlyDate_(card.statementDay);
    const paymentDueDate = nextMonthlyDate_(card.paymentDueDay);

    const summary = {
      id: card.id,
      cardName: sanitizeText_(card.cardName),
      bankName: sanitizeText_(card.bankName),
      creditLimit: limit,
      statementDay: parseInt(card.statementDay, 10) || 1,
      paymentDueDay: parseInt(card.paymentDueDay, 10) || 1,
      cardColor: sanitizeText_(card.cardColor) || '#a78bfa',
      cardType: sanitizeText_(card.cardType) || 'General',
      notes: sanitizeText_(card.notes),
      isActive: normalizeBoolean_(card.isActive),
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      currentBalance: round2_(currentBalance),
      availableCredit: round2_(availableCredit),
      utilization: utilization,
      statementDate: formatDateKey_(statementDate),
      paymentDueDate: formatDateKey_(paymentDueDate),
      statementInDays: daysBetweenToday_(statementDate),
      paymentDueInDays: daysBetweenToday_(paymentDueDate),
      statusColor: utilizationColor_(utilization),
    };

    cardLookup[summary.id] = summary;
    return summary;
  });

  const transactions = rawTransactions
    .map(function(transaction) {
      const card = cardLookup[transaction.cardId];
      return {
        id: transaction.id,
        cardId: transaction.cardId,
        cardName: card ? card.cardName : 'Unknown card',
        bankName: card ? card.bankName : '',
        date: normalizeDateString_(transaction.date),
        amount: parseNumber_(transaction.amount),
        merchant: sanitizeText_(transaction.merchant),
        category: sanitizeText_(transaction.category),
        notes: sanitizeText_(transaction.notes),
      };
    })
    .sort(sortByDateDesc_);

  const payments = rawPayments
    .map(function(payment) {
      const card = cardLookup[payment.cardId];
      return {
        id: payment.id,
        cardId: payment.cardId,
        cardName: card ? card.cardName : 'Unknown card',
        date: normalizeDateString_(payment.date),
        amount: parseNumber_(payment.amount),
        notes: sanitizeText_(payment.notes),
      };
    })
    .sort(sortByDateDesc_);

  const installments = rawInstallments.map(function(installment) {
    const card = cardLookup[installment.cardId];
    const totalPrice = parseNumber_(installment.totalPrice);
    const monthlyPayment = parseNumber_(installment.monthlyPayment);
    const numberOfInstallments = parseInt(installment.numberOfInstallments, 10) || 0;
    const completedInstallments = parseInt(installment.completedInstallments, 10) || 0;
    const remainingInstallments = Math.max(numberOfInstallments - completedInstallments, 0);
    const nextPaymentDate = toDate_(installment.nextPaymentDate);

    return {
      id: installment.id,
      cardId: installment.cardId,
      cardName: card ? card.cardName : 'Unknown card',
      productName: sanitizeText_(installment.productName),
      totalPrice: totalPrice,
      numberOfInstallments: numberOfInstallments,
      monthlyPayment: monthlyPayment,
      completedInstallments: completedInstallments,
      remainingInstallments: remainingInstallments,
      outstandingBalance: round2_(monthlyPayment * remainingInstallments),
      startDate: normalizeDateString_(installment.startDate),
      nextPaymentDate: formatDateKey_(nextPaymentDate),
      nextPaymentInDays: daysBetweenToday_(nextPaymentDate),
      notes: sanitizeText_(installment.notes),
    };
  }).sort(function(a, b) {
    return a.nextPaymentInDays - b.nextPaymentInDays;
  });

  const alerts = buildAlerts_(cardSummaries, installments, settings);
  const reports = buildReports_(transactions, cardSummaries);
  const dashboard = buildDashboard_(cardSummaries, transactions, alerts);
  const insights = buildInsights_(cardSummaries, transactions, reports);

  return {
    projectName: PROJECT_NAME,
    generatedAt: new Date().toISOString(),
    needsSetup: false,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    dashboard: dashboard,
    cards: cardSummaries.sort(function(a, b) {
      return b.availableCredit - a.availableCredit;
    }),
    transactions: transactions,
    payments: payments,
    installments: installments,
    alerts: alerts,
    reports: reports,
    insights: insights,
    settings: settings,
    simulatorExample: buildSimulatorResult_(cardSummaries, 5000),
  };
}

function buildDashboard_(cards, transactions, alerts) {
  const activeCards = cards.filter(function(card) { return card.isActive; });
  const totalCreditLimit = activeCards.reduce(function(sum, card) { return sum + card.creditLimit; }, 0);
  const totalCurrentBalance = activeCards.reduce(function(sum, card) { return sum + card.currentBalance; }, 0);
  const totalAvailableCredit = activeCards.reduce(function(sum, card) { return sum + card.availableCredit; }, 0);
  const utilization = totalCreditLimit > 0 ? round2_((totalCurrentBalance / totalCreditLimit) * 100) : 0;

  return {
    totalCreditLimit: round2_(totalCreditLimit),
    totalCurrentBalance: round2_(totalCurrentBalance),
    totalAvailableCredit: round2_(totalAvailableCredit),
    overallUtilization: utilization,
    activeCardCount: activeCards.length,
    alertCount: alerts.length,
    recentTransactions: transactions.slice(0, 8),
  };
}

function buildReports_(transactions, cards) {
  const monthlyMap = {};
  const monthlyLabelMap = {};
  const categoryMap = {};
  const cardMap = {};
  const merchantMap = {};
  const cardLookup = {};

  cards.forEach(function(card) {
    cardLookup[card.id] = card.cardName;
  });

  transactions.forEach(function(transaction) {
    const date = toDate_(transaction.date);
    const monthKey = Utilities.formatDate(date, APP_TIMEZONE, 'yyyy-MM');
    monthlyLabelMap[monthKey] = Utilities.formatDate(date, APP_TIMEZONE, 'MMM yyyy');

    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + transaction.amount;
    categoryMap[transaction.category] = (categoryMap[transaction.category] || 0) + transaction.amount;
    cardMap[transaction.cardId] = (cardMap[transaction.cardId] || 0) + transaction.amount;
    merchantMap[transaction.merchant] = (merchantMap[transaction.merchant] || 0) + transaction.amount;
  });

  const monthlySpending = Object.keys(monthlyMap)
    .sort()
    .map(function(key) {
      return {
        key: key,
        label: monthlyLabelMap[key],
        value: round2_(monthlyMap[key]),
      };
    });

  const categorySpending = toSortedSeries_(categoryMap, function(key) { return key; });
  const cardSpending = toSortedSeries_(cardMap, function(key) { return cardLookup[key] || key; });
  const merchantUsage = toSortedSeries_(merchantMap, function(key) { return key; }).slice(0, 6);
  const topTransactions = transactions.slice().sort(function(a, b) {
    return b.amount - a.amount;
  }).slice(0, 10);
  const utilizationByCard = cards.map(function(card) {
    return { label: card.cardName, value: card.utilization };
  }).sort(function(a, b) {
    return b.value - a.value;
  });

  return {
    monthlySpending: monthlySpending,
    categorySpending: categorySpending,
    cardSpending: cardSpending,
    merchantUsage: merchantUsage,
    topTransactions: topTransactions,
    utilizationByCard: utilizationByCard,
  };
}

function buildAlerts_(cards, installments, settings) {
  const alerts = [];
  const statementNoticeDays = parseNoticeDays_(settings.statementNoticeDays || '7,3,1');
  const paymentNoticeDays = parseNoticeDays_(settings.paymentNoticeDays || '7,3,1');

  cards.filter(function(card) { return card.isActive; }).forEach(function(card) {
    if (card.utilization >= 90) {
      alerts.push(createAlert_('utilization', 'critical', card.id, 'Card near limit', card.cardName + ' utilization is at ' + card.utilization + '%. Consider paying down the balance.'));
    } else if (card.utilization >= 80) {
      alerts.push(createAlert_('utilization', 'high', card.id, 'High utilization', card.cardName + ' utilization is at ' + card.utilization + '%.'));
    } else if (card.utilization >= 70) {
      alerts.push(createAlert_('utilization', 'medium', card.id, 'Utilization warning', card.cardName + ' utilization is above 70%.'));
    } else if (card.utilization >= 50) {
      alerts.push(createAlert_('utilization', 'low', card.id, 'Utilization heads-up', card.cardName + ' utilization is above 50%.'));
    }

    if (statementNoticeDays.indexOf(card.statementInDays) !== -1) {
      alerts.push(createAlert_('statement', 'medium', card.id, 'Statement date is coming up', card.cardName + ' statement date is in ' + card.statementInDays + ' day(s).'));
    }

    if (paymentNoticeDays.indexOf(card.paymentDueInDays) !== -1) {
      const severity = card.paymentDueInDays <= 1 ? 'critical' : card.paymentDueInDays <= 3 ? 'high' : 'medium';
      alerts.push(createAlert_('payment', severity, card.id, 'Payment due soon', card.cardName + ' payment due date is in ' + card.paymentDueInDays + ' day(s).'));
    }
  });

  installments.forEach(function(installment) {
    if (installment.nextPaymentInDays <= 7) {
      const severity = installment.nextPaymentInDays <= 3 ? 'high' : 'medium';
      alerts.push(createAlert_('installment', severity, installment.cardId, 'Installment due soon', installment.productName + ' next installment is due in ' + installment.nextPaymentInDays + ' day(s).'));
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
    const topCategory = reports.categorySpending[0];
    insights.push(topCategory.label + ' is your top spending category right now.');
  }

  const highUtilizationCard = cards.find(function(card) { return card.utilization >= 80; });
  if (highUtilizationCard) {
    insights.push(highUtilizationCard.cardName + ' is close to its limit and should be used carefully.');
  }

  const recommendedCard = cards
    .filter(function(card) { return card.isActive; })
    .sort(function(a, b) {
      return (a.utilization - b.utilization) || (b.availableCredit - a.availableCredit);
    })[0];
  if (recommendedCard) {
    insights.push('Best card to use next is ' + recommendedCard.cardName + ' because it has the lowest utilization and strong available credit.');
  }

  if (transactions.length === 0) {
    insights.push('No transactions yet. Add one to start seeing smarter insights.');
  }

  return insights.slice(0, 4);
}

function buildSimulatorResult_(cards, amount) {
  if (amount <= 0) {
    return {
      amount: 0,
      recommendation: 'Enter an amount to simulate a purchase.',
      cards: [],
    };
  }

  const results = cards
    .filter(function(card) { return card.isActive; })
    .map(function(card) {
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
    })
    .sort(function(a, b) {
      if (a.canUse !== b.canUse) {
        return a.canUse ? -1 : 1;
      }
      return a.newUtilization - b.newUtilization;
    });

  const bestCard = results.find(function(card) { return card.canUse; });
  return {
    amount: amount,
    recommendation: bestCard ? 'Recommended card: ' + bestCard.cardName : 'No card can cover this purchase safely.',
    cards: results,
  };
}

function syncAlertsSheet_(spreadsheet, alerts) {
  const sheet = spreadsheet.getSheetByName('Alerts');
  sheet.clearContents();
  const headers = SHEET_DEFINITIONS.Alerts;
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

function createAlert_(type, severity, cardId, title, message) {
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

function ensureDemoData_(spreadsheet) {
  seedIfEmpty_(spreadsheet);
}

function seedSheetIfEmpty_(sheet, rows) {
  if (!sheet || !rows || !rows.length) {
    return false;
  }

  if (sheet.getLastRow() > 1) {
    return false;
  }

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  return true;
}

function findExistingProjectSpreadsheet_() {
  const targetName = PROJECT_NAME + ' Data';
  const files = DriveApp.getFilesByName(targetName);

  while (files.hasNext()) {
    const file = files.next();
    try {
      const spreadsheet = SpreadsheetApp.open(file);
      if (hasCoreSheets_(spreadsheet)) {
        return spreadsheet;
      }
    } catch (error) {
      // Ignore inaccessible candidates and continue checking the next file.
    }
  }

  return null;
}

function hasCoreSheets_(spreadsheet) {
  const names = spreadsheet.getSheets().map(function(sheet) {
    return sheet.getName();
  });

  return Object.keys(SHEET_DEFINITIONS).some(function(sheetName) {
    return names.indexOf(sheetName) !== -1;
  });
}

function buildSystemStatus_(spreadsheet) {
  if (!spreadsheet) {
    return {
      projectName: PROJECT_NAME,
      connected: false,
      spreadsheetFound: false,
      message: 'No project spreadsheet is connected yet. Run setup to create one.',
      sheetStatus: [],
      missingSheets: Object.keys(SHEET_DEFINITIONS),
    };
  }

  const sheetStatus = Object.keys(SHEET_DEFINITIONS).map(function(sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    const rowCount = sheet ? Math.max(sheet.getLastRow() - 1, 0) : 0;
    return {
      name: sheetName,
      exists: !!sheet,
      rowCount: rowCount,
      hasHeaders: !!sheet && sheet.getLastRow() >= 1,
    };
  });

  const missingSheets = sheetStatus
    .filter(function(item) { return !item.exists; })
    .map(function(item) { return item.name; });

  return {
    projectName: PROJECT_NAME,
    connected: true,
    spreadsheetFound: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    spreadsheetName: spreadsheet.getName(),
    message: missingSheets.length ? 'Some sheets are still missing and need repair.' : 'Spreadsheet connection is healthy.',
    sheetStatus: sheetStatus,
    missingSheets: missingSheets,
  };
}

function getSheetObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];
  return values.slice(1)
    .filter(function(row) {
      return row.join('').toString().trim() !== '';
    })
    .map(function(row) {
      const item = {};
      headers.forEach(function(header, index) {
        item[header] = row[index];
      });
      return item;
    });
}

function getSettingsMap_(sheet) {
  return getSheetObjects_(sheet).reduce(function(map, row) {
    map[row.key] = row.value;
    return map;
  }, {});
}

function appendObjectRow_(sheet, rowObject) {
  const headers = SHEET_DEFINITIONS[sheet.getName()];
  const row = headers.map(function(header) {
    return rowObject[header];
  });
  sheet.appendRow(row);
}

function upsertRowById_(sheet, id, rowObject) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idColumnIndex = headers.indexOf('id');
  const targetRow = headers.map(function(header) {
    return rowObject[header];
  });

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (values[rowIndex][idColumnIndex] === id) {
      sheet.getRange(rowIndex + 1, 1, 1, targetRow.length).setValues([targetRow]);
      return;
    }
  }

  sheet.appendRow(targetRow);
}

function createId_(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function createSampleDate_(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateKey_(date);
}

function daysAgo_(days) {
  return createSampleDate_(0 - days);
}

function daysFromToday_(days) {
  return createSampleDate_(days);
}

function parseNoticeDays_(value) {
  return sanitizeText_(value)
    .split(',')
    .map(function(item) { return parseInt(item, 10); })
    .filter(function(item) { return !isNaN(item); });
}

function nextMonthlyDate_(dayOfMonth) {
  const safeDay = Math.min(Math.max(parseInt(dayOfMonth, 10) || 1, 1), 28);
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), safeDay);
  if (target < stripTime_(now)) {
    target = new Date(now.getFullYear(), now.getMonth() + 1, safeDay);
  }
  return target;
}

function daysBetweenToday_(date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const today = stripTime_(new Date());
  const target = stripTime_(date);
  return Math.round((target.getTime() - today.getTime()) / oneDay);
}

function stripTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function normalizeDateString_(value) {
  const date = toDate_(value);
  return formatDateKey_(date);
}

function toDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return value;
  }

  if (typeof value === 'string' && value) {
    return new Date(value);
  }

  return new Date();
}

function formatDateKey_(date) {
  return Utilities.formatDate(date, APP_TIMEZONE, 'yyyy-MM-dd');
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
  return value === true || String(value).toLowerCase() === 'true' || String(value) === '1';
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
  return Object.keys(map)
    .map(function(key) {
      return { label: labelResolver(key), value: round2_(map[key]) };
    })
    .sort(function(a, b) {
      return b.value - a.value;
    });
}

function sortByDateDesc_(a, b) {
  return toDate_(b.date).getTime() - toDate_(a.date).getTime();
}
