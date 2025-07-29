"use client";
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import styles from "./page.module.scss";
import { paymentToolOptions } from '../data/paymentTools.js'; // Assuming this is the correct path to your payment tools data
export default function Home() {
  // State variables
  const [csvData, setCsvData] = useState([]);
  const [manualSlips, setManualSlips] = useState([]);
  const [paymentTableDisplayData, setPaymentTableDisplayData] = useState([]);
  const [unknownPaymentToolData, setUnknownPaymentToolData] = useState([]);
  const [knownTransactionsData, setKnownTransactionsData] = useState([]); // New state for known transactions
  const [marketingMetrics, setMarketingMetrics] = useState(null);
  const [overallTotal, setOverallTotal] = useState(0);
  const [applicationNumberTotals, setApplicationNumberTotals] = useState({}); // New state for application number totals
  
  const [hasProcessed, setHasProcessed] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [checkedRows, setCheckedRows] = useState({});
  const [editedUnknownRows, setEditedUnknownRows] = useState({}); // New state for tracking edited unknown rows
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateModalData, setDuplicateModalData] = useState(null);

  // State for manual entry form
  const [formInput, setFormInput] = useState({ slipNumber: '', name: '', amount: '', paymentTool: 'Cash', memo: '' });

  // State for editing slips
  const [editingSlipId, setEditingSlipId] = useState(null);
  const [editingSlipData, setEditingSlipData] = useState(null);

  // State for editing transactions in the main list
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingTransactionData, setEditingTransactionData] = useState(null);

  // State to track if component is mounted on client
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // State for search functionality
  const [amountSearchTerm, setAmountSearchTerm] = useState('');
  const [applicationNumberSearchTerm, setApplicationNumberSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  useEffect(() => {
    if (hasProcessed || manualSlips.length > 0 || unknownPaymentToolData.length > 0) {
      processAllData(csvData, manualSlips, unknownPaymentToolData);
    }
  }, [csvData, manualSlips, unknownPaymentToolData]);

  useEffect(() => {
    let filtered = knownTransactionsData;

    if (amountSearchTerm) {
      const searchAmount = parseFloat(amountSearchTerm);
      if (!isNaN(searchAmount)) {
        filtered = filtered.filter(item => 
          item.amount === searchAmount ||
          (item.枝番 === '1' && applicationNumberTotals[item.申込番号] === searchAmount)
        );
      }n    }

    if (applicationNumberSearchTerm) {
      filtered = filtered.filter(item => 
        item.申込番号 && item.申込番号.includes(applicationNumberSearchTerm)
      );
    }

    setFilteredTransactions(filtered);
  }, [amountSearchTerm, applicationNumberSearchTerm, knownTransactionsData, applicationNumberTotals]);

  const resetState = () => {
    setCsvData([]);
    setManualSlips([]);
    setPaymentTableDisplayData([]);
    setUnknownPaymentToolData([]);
    setMarketingMetrics(null);
    setOverallTotal(0);
    setHasProcessed(false);
    setError('');
    setCheckedRows({});
    setEditedUnknownRows({});
    setApplicationNumberTotals({});
    setAmountSearchTerm('');
    setApplicationNumberSearchTerm('');
    setFilteredTransactions([]);
  };

  const processFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください。');
      return;
    }
    resetState();
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields.includes('金額') || !results.meta.fields.includes('決済方法') || !results.meta.fields.includes('決済ツール名')) {
          setError('CSVに必須の列（金額, 決済方法, 決済ツール名）が含まれていません。');
          return;
        }
        setCsvData(results.data.map((row, index) => ({ ...row, originalIndex: index })));
        // Initialize unknownPaymentToolData with all potentially unknown items from CSV
        const initialUnknownData = results.data.map((row, index) => ({ ...row, originalIndex: index })).filter(row => {
          const tool = row['決済ツール名'];
          const method = row['決済方法'];
          return (!tool || tool.trim() === '' || tool.trim().toLowerCase() === '不明') && (method.trim().toLowerCase() === '現地決済' || method.trim().toLowerCase() === '現地払い');
        }).map(item => ({ ...item, selectedPaymentTool: '', 申込番号合計金額: '' }));
        setUnknownPaymentToolData(initialUnknownData);
        console.log('Initial unknownPaymentToolData after parse:', initialUnknownData);
        setHasProcessed(true);
      },
      error: (err) => setError(`CSVの解析中にエラーが発生しました: ${err.message}`)
    });
  };

  const processManualSlipsFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください。');
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allNewData = results.data.map(row => ({
          ...row,
          id: Date.now() + Math.random(), // Generate a unique ID
          slipNumber: row.slipNumber || '',
          name: row.name || '',
          amount: parseFloat(row.amount) || 0,
          paymentTool: row.paymentTool || 'Cash',
          memo: row.memo || ''
        })).filter(slip => slip.amount > 0); // Only add valid slips

        if (allNewData.length > 0) {
          const existingSlipNumbers = new Set(manualSlips.map(s => s.slipNumber));
          const duplicates = allNewData.filter(s => existingSlipNumbers.has(s.slipNumber));

          if (duplicates.length > 0) {
            setDuplicateModalData({ type: 'manualSlips', duplicates, existingData: manualSlips, newData: allNewData });
            setShowDuplicateModal(true);
            return;
          } else {
            setManualSlips(prev => [...prev, ...allNewData]);
            alert(`${allNewData.length}件の伝票を読み込みました。`);
          }
        }
      },
      error: (err) => setError(`伝票CSVの解析中にエラーが発生しました: ${err.message}`)
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formInput.amount || isNaN(parseFloat(formInput.amount))) {
      alert('有効な金額を入力してください。');
      return;
    }
    const newSlip = { ...formInput, id: Date.now(), amount: parseFloat(formInput.amount) };
    setManualSlips(prev => [...prev, newSlip]);
    setFormInput({ slipNumber: '', name: '', amount: '', paymentTool: 'Cash', memo: '' });
  };

  const handleEditClick = (slip) => {
    setEditingSlipId(slip.id);
    setEditingSlipData({ ...slip });
  };

  const handleCancelEdit = () => {
    setEditingSlipId(null);
    setEditingSlipData(null);
  };

  const handleUpdateSlip = () => {
    setManualSlips(manualSlips.map(slip => slip.id === editingSlipId ? editingSlipData : slip));
    handleCancelEdit();
  };

  const handleDeleteSlip = (slipId) => {
    if (window.confirm('この伝票を削除してもよろしいですか？')) {
        setManualSlips(manualSlips.filter(slip => slip.id !== slipId));
    }
  };

  const handleUnknownPaymentToolChange = (index, value) => {
    setUnknownPaymentToolData(prevData => {
      const newData = [...prevData];
      newData[index] = { ...newData[index], selectedPaymentTool: value };
      return newData;
    });
    setEditedUnknownRows(prev => {
      const newEditedRows = { ...prev };
      if (value === '') {
        delete newEditedRows[index];
      } else {
        newEditedRows[index] = true;
      }
      return newEditedRows;
    });
  };

  // Handlers for editing/deleting from the main transaction list
  const handleTransactionEditClick = (transaction) => {
    setEditingTransactionId(transaction.id);
    setEditingTransactionData({ ...transaction });
  };

  const handleTransactionCancelEdit = () => {
    setEditingTransactionId(null);
    setEditingTransactionData(null);
  };

  const handleTransactionUpdate = () => {
    if (!editingTransactionData) return;

    const { id, source } = editingTransactionData;

    if (source === 'csv') {
      // Update the original csvData
      setCsvData(prevCsvData => 
        prevCsvData.map(row => {
          if (`csv-${row.originalIndex}` === id) {
            // Create a new object with updated values
            return { 
              ...row, 
              '決済ツール名': editingTransactionData.tool, 
              'メモ': editingTransactionData.メモ 
            };
          }
          return row;
        })
      );
      
      // Also update the unknownPaymentToolData if the item was there
      setUnknownPaymentToolData(prevUnknown =>
        prevUnknown.map(item => {
          if (`csv-${item.originalIndex}` === id) {
            return { ...item, selectedPaymentTool: editingTransactionData.tool };
          }
          return item;
        })
      );

    } else if (source === 'manual') {
      // Update the manualSlips
      setManualSlips(prevManualSlips =>
        prevManualSlips.map(slip => {
          if (slip.id === id) {
            return { 
              ...slip, 
              paymentTool: editingTransactionData.tool, 
              memo: editingTransactionData.メモ 
            };
          }
          return slip;
        })
      );
    }

    handleTransactionCancelEdit(); // Exit editing mode
    // The useEffect that watches csvData and manualSlips will automatically trigger processAllData
  };

  const handleTransactionDelete = (transactionId, source) => {
    if (window.confirm('この取引を削除してもよろしいですか？')) {
      if (source === 'csv') {
        const originalIndex = parseInt(transactionId.replace('csv-', ''));
        setCsvData(prevCsvData => prevCsvData.filter(row => row.originalIndex !== originalIndex));
        setUnknownPaymentToolData(prevUnknown => prevUnknown.filter(item => item.originalIndex !== originalIndex));
      } else if (source === 'manual') {
        setManualSlips(prevManualSlips => prevManualSlips.filter(slip => slip.id !== transactionId));
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (knownTransactionsData.length === 0) {
      alert('コピーするデータがありません。');
      return;
    }

    const headers = [
      '申込番号', '枝番', 'お名前', '金額', '決済ツール', '貸出日', '貸出店舗', 'メモ', '決済時間', '貸出日時', '決済方法', 'プロモコード', '窓口', '変動価格'
    ];
    const headerString = headers.join('\t');

    const rows = knownTransactionsData.map(item => {
      const rowData = [
        item.申込番号 || '',
        item.枝番 || '',
        item.お名前 || '',
        item.amount || 0,
        item.tool || '',
        item.貸出日 || '',
        item.貸出店舗 || '',
        item.メモ || '',
        item.決済時間 || '',
        item.貸出日時 || '',
        item.method || '',
        item['プロモコード'] || '',
        item['窓口'] || '',
        item.変動価格 || ''
      ];
      return rowData.map(cell => {
          const cellString = String(cell);
          return cellString.replace(/\t/g, ' ').replace(/\n/g, ' ');
      }).join('\t');
    });

    const tsvString = [headerString, ...rows].join('\n');

    navigator.clipboard.writeText(tsvString).then(() => {
      alert('取引一覧がクリップボードにコピーされました。\nGoogleスプレッドシートに貼り付けてください。');
    }).catch(err => {
      console.error('クリップボードへのコピーに失敗しました:', err);
      alert('クリップボードへのコピーに失敗しました。');
    });
  };

  const handleCopyPaymentSummary = () => {
    if (paymentTableDisplayData.length === 0) {
      alert('コピーするデータがありません。');
      return;
    }
    const headers = ['分類', '合計売上金額'];
    const headerString = headers.join('\t');

    const mainCategoryRows = paymentTableDisplayData.filter(item => 
      item.大分類 && !item.中分類 && !item.小分類
    );

    const rows = mainCategoryRows.map(item => {
      const rowData = [
        item.大分類, 
        item.合計売上金額 || 0
      ];
      return rowData.join('\t');
    });

    const totalRow = ['合計', overallTotal].join('\t');
    rows.push(totalRow);

    const tsvString = [headerString, ...rows].join('\n');
    navigator.clipboard.writeText(tsvString).then(() => {
      alert('決済サマリーがクリップボードにコピーされました。');
    }).catch(err => {
      console.error('決済サマリーのコピーに失敗しました:', err);
      alert('決済サマリーのコピーに失敗しました。');
    });
  };

  const handleCopyMarketingMetrics = () => {
    if (!marketingMetrics) {
      alert('コピーするデータがありません。');
      return;
    }
    const headers = ['指標', '値'];
    const headerString = headers.join('\t');

    const rows = [];
    rows.push(['総売上', marketingMetrics.totalRevenue]);
    rows.push(['総取引件数', marketingMetrics.totalTransactions]);
    rows.push(['ユニーク顧客数', marketingMetrics.uniqueCustomers]);
    rows.push(['平均取引単価', Math.round(marketingMetrics.avgSpendPerTransaction)]);
    rows.push(['顧客平均単価', Math.round(marketingMetrics.avgSpendPerCustomer)]);

    Object.entries(marketingMetrics.paymentMethodBreakdown).forEach(([method, data]) => {
      rows.push([`決済方法別: ${method} - 売上`, data.sales]);
      rows.push([`決済方法別: ${method} - 件数`, data.count]);
    });

    const tsvString = [headerString, ...rows.map(row => row.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvString).then(() => {
      alert('マーケティング指標がクリップボードにコピーされました。');
    }).catch(err => {
      console.error('マーケティング指標のコピーに失敗しました:', err);
      alert('マーケティング指標のコピーに失敗しました。');
    });
  };

  const getPaymentSummaryTsv = () => {
    if (paymentTableDisplayData.length === 0) return '';
    const headers = ['分類', '合計売上金額'];
    const headerString = headers.join('\t');
    const mainCategoryRows = paymentTableDisplayData.filter(item => 
      item.大分類 && !item.中分類 && !item.小分類
    );
    const rows = mainCategoryRows.map(item => {
      const rowData = [
        item.大分類, 
        item.合計売上金額 || 0
      ];
      return rowData.join('\t');
    });
    const totalRow = ['合計', overallTotal].join('\t');
    rows.push(totalRow);
    return [headerString, ...rows].join('\n');
  };

  const getAllTransactionsTsv = () => {
    if (knownTransactionsData.length === 0) return '';
    const headers = [
      '申込番号', '枝番', 'お名前', '金額', '決済ツール', '貸出日', '貸出店舗', 'メモ', '決済時間', '貸出日時', '決済方法', 'プロモコード', '窓口', '変動価格'
    ];
    const headerString = headers.join('\t');
    const rows = knownTransactionsData.map(item => {
      const rowData = [
        item.申込番号 || '',
        item.枝番 || '',
        item.お名前 || '',
        item.amount || 0,
        item.tool || '',
        item.貸出日 || '',
        item.貸出店舗 || '',
        item.メモ || '',
        item.決済時間 || '',
        item.貸出日時 || '',
        item.method || '',
        item['プロモコード'] || '',
        item['窓口'] || '',
        item.変動価格 || ''
      ];
      return rowData.map(cell => {
          const cellString = String(cell);
          return cellString.replace(/\t/g, ' ').replace(/\n/g, ' ');
      }).join('\t');
    });
    return [headerString, ...rows].join('\n');
  };

  const getMarketingMetricsTsv = () => {
    if (!marketingMetrics) return '';
    const headers = ['指標', '値'];
    const headerString = headers.join('\t');
    const rows = [];
    rows.push(['総売上', marketingMetrics.totalRevenue]);
    rows.push(['総取引件数', marketingMetrics.totalTransactions]);
    rows.push(['ユニーク顧客数', marketingMetrics.uniqueCustomers]);
    rows.push(['平均取引単価', Math.round(marketingMetrics.avgSpendPerTransaction)]);
    rows.push(['顧客平均単価', Math.round(marketingMetrics.avgSpendPerCustomer)]);
    Object.entries(marketingMetrics.paymentMethodBreakdown).forEach(([method, data]) => {
      rows.push([`決済方法別: ${method} - 売上`, data.sales]);
      rows.push([`決済方法別: ${method} - 件数`, data.count]);
    });
    Object.entries(marketingMetrics.windowBreakdown).forEach(([window, count]) => {
      const percentage = marketingMetrics.uniqueCustomers > 0 ? ((count / marketingMetrics.uniqueCustomers) * 100).toFixed(2) : 0;
      rows.push([`窓口別: ${window}`, `${count}件 (${percentage}%)`]);
    });
    return [headerString, ...rows.map(row => row.join('\t'))].join('\n');
  };

  const handleCopyAllDataToClipboard = () => {
    let combinedTsv = '';

    const paymentSummaryTsv = getPaymentSummaryTsv();
    if (paymentSummaryTsv) {
      combinedTsv += '--- 決済サマリー ---\n' + paymentSummaryTsv + '\n\n';
    }

    const allTransactionsTsv = getAllTransactionsTsv();
    if (allTransactionsTsv) {
      combinedTsv += '--- 全取引一覧 ---\n' + allTransactionsTsv + '\n\n';
    }

    const marketingMetricsTsv = getMarketingMetricsTsv();
    if (marketingMetricsTsv) {
      combinedTsv += '--- マーケティング指標 ---\n' + marketingMetricsTsv + '\n\n';
    }

    if (combinedTsv) {
      navigator.clipboard.writeText(combinedTsv).then(() => {
        alert('全てのデータがクリップボードにコピーされました。');
      }).catch(err => {
        console.error('全てのデータのコピーに失敗しました:', err);
        alert('全てのデータのコピーに失敗しました。');
      });
    } else {
      alert('コピーするデータがありません。');
    }
  };

  

  

  const handleSaveManualSlipsToCsv = () => {
    if (manualSlips.length === 0) {
      alert('保存する伝票がありません。');
      return;
    }

    const headers = [
      'slipNumber', 'name', 'amount', 'paymentTool', 'memo'
    ];

    const dataToSave = manualSlips.map(slip => ({
      'slipNumber': slip.slipNumber || '',
      'name': slip.name || '',
      'amount': slip.amount || 0,
      'paymentTool': slip.paymentTool || '',
      'memo': slip.memo || ''
    }));

    const now = new Date();
    const formattedDate = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `伝票一時保存_${formattedDate}-${formattedTime}.csv`;

    const csv = Papa.unparse(dataToSave, { header: true });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('伝票データがCSVとしてダウンロードされました。');
  };

  const handleSaveTransactionsToCsv = () => {
    if (knownTransactionsData.length === 0) {
      alert('保存する取引がありません。');
      return;
    }

    const headers = [
      '申込番号', '枝番', 'お名前', '金額', '決済ツール', '貸出日', '貸出店舗', 'メモ', '決済時間', '貸出日時', '決済方法', 'プロモコード', '窓口', '変動価格'
    ];

    const dataToSave = knownTransactionsData.map(item => ({
      '申込番号': item['申込番号'] || '',
      '枝番': item['枝番'] || '',
      'お名前': item['お名前'] || '',
      '金額': item.amount || 0,
      '決済ツール': item.tool || '',
      '貸出日': item['貸出日'] || '',
      '貸出店舗': item['貸出店舗'] || '',
      'メモ': item.memo || '',
      '決済時間': item['決済時間'] || '',
      '貸出日時': item['貸出日時'] || '',
      '決済方法': item.method || '',
      'プロモコード': item['プロモコード'] || '',
      '窓口': item['窓口'] || '',
      '変動価格': item['変動価格'] || ''
    }));

    const now = new Date();
    const formattedDate = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `取引一覧一時保存_${formattedDate}-${formattedTime}.csv`;

    const csv = Papa.unparse(dataToSave, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('取引データがCSVとしてダウンロードされました。');
  };

  const processTransactionsFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください。');
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allNewData = results.data.map(row => ({
          ...row,
          id: `csv-${Date.now() + Math.random()}`,
          amount: parseFloat(row['金額']) || 0,
          source: 'csv',
          tool: row['決済ツール'] || '',
          method: row['決済方法'] || '',
          memo: row['メモ'] || '',
        })).filter(t => t.amount > 0);

        const newSlips = allNewData.filter(t => t.申込番号 && t.申込番号.startsWith('伝票 '));
        const newTransactions = allNewData.filter(t => !t.申込番号 || !t.申込番号.startsWith('伝票 '));

        // Process slips first
        if (newSlips.length > 0) {
          const existingSlipNumbers = new Set(manualSlips.map(s => s.slipNumber));
          const uniqueNewSlips = newSlips.filter(s => !existingSlipNumbers.has(s.申込番号.replace('伝票 ', '')));
          setManualSlips(prev => [...prev, ...uniqueNewSlips.map(s => ({
            id: s.id,
            slipNumber: s.申込番号.replace('伝票 ', ''),
            name: s.お名前 || '',
            amount: s.amount,
            paymentTool: s.tool || 'Cash',
            memo: s.memo || ''
          }))]);
          alert(`${uniqueNewSlips.length}件の伝票を読み込みました。`);
        }

        // Process transactions
        if (newTransactions.length > 0) {
          const existingApplicationNumbers = new Set(knownTransactionsData.map(t => t.申込番号));
          const duplicates = newTransactions.filter(t => existingApplicationNumbers.has(t.申込番号));

          if (duplicates.length > 0) {
            setDuplicateModalData({ type: 'transactions', duplicates, existingData: knownTransactionsData, newData: newTransactions });
            setShowDuplicateModal(true);
            return;
          } else {
            setCsvData(prev => [...prev, ...newTransactions]);
            alert(`${newTransactions.length}件の取引を読み込みました。`);
          }
        }
      },
      error: (err) => setError(`取引CSVの解析中にエラーが発生しました: ${err.message}`)
    });
  };

  const processAllData = (currentCsvData, currentManualSlips, currentUnknownPaymentToolData) => {
    console.log('--- processAllData START ---');
    console.log('currentUnknownPaymentToolData at start of processAllData:', currentUnknownPaymentToolData);

    const salesByTool = {}; // This will temporarily include '不明' as a key
    const knownTransactions = [];
    const tempApplicationNumberTotals = {};

    // 1. Create a unified list of all transactions (CSV + manual)
    const allTransactions = [
      ...currentCsvData.map((row, index) => ({
        ...row,
        id: `csv-${row.originalIndex || index}`,
        amount: parseFloat(row['金額']),
        source: 'csv'
      })),
      ...currentManualSlips.map(slip => ({
        ...slip,
        // Manual slips already have a unique `id` from Date.now()
        amount: parseFloat(slip.amount),
        source: 'manual',
        '申込番号': slip.slipNumber ? `伝票 ${slip.slipNumber}` : '',
        'お名前': slip.name,
        'メモ': slip.memo,
        '決済方法': '', // Set payment method to blank for manual slips
        '決済ツール名': slip.paymentTool // Manual slips have known payment tool
      }))
    ].filter(t => !isNaN(t.amount)); // Filter out invalid amounts early

    // 2. Determine the final payment tool for each transaction and aggregate
    allTransactions.forEach(transaction => {
      const amount = transaction.amount;
      let finalTool = '';
      let finalMethod = transaction['決済方法'];

      // Calculate application number totals for display in unknown table
      if (transaction.申込番号) {
        if (!tempApplicationNumberTotals[transaction.申込番号]) tempApplicationNumberTotals[transaction.申込番号] = 0;
        tempApplicationNumberTotals[transaction.申込番号] += amount;
      }

      if (transaction.source === 'csv') {
        console.log('Processing CSV transaction:', transaction.originalIndex, 'Amount:', transaction['金額'], 'Method:', transaction['決済方法'], 'Tool:', transaction['決済ツール名']);
        // Check if this CSV row corresponds to an item in unknownPaymentToolData that has been assigned a tool
        const assignedToolItem = currentUnknownPaymentToolData.find(item =>
          item.originalIndex === transaction.originalIndex && item.selectedPaymentTool && item.selectedPaymentTool !== ''
        );

        if (assignedToolItem) {
          // User has assigned a tool for this previously unknown transaction
          finalTool = assignedToolItem.selectedPaymentTool;
          finalMethod = assignedToolItem.決済方法 || finalMethod; // Use assigned method if available
        } else if (finalMethod && finalMethod.trim().toLowerCase() === 'カード払い') {
          // Special rule: 'カード払い' always becomes '事前カード'
          finalTool = '事前カード';
        } else if (transaction['決済ツール名'] && transaction['決済ツール名'].trim() !== '' && transaction['決済ツール名'].trim().toLowerCase() !== '不明') {
          // This is a known tool from the original CSV
          finalTool = transaction['決済ツール名'];
        } else if ((!transaction['決済ツール名'] || transaction['決済ツール名'].trim() === '' || transaction['決済ツール名'].trim().toLowerCase() === '不明') && (finalMethod && (finalMethod.trim().toLowerCase() === '現地決済' || finalMethod.trim().toLowerCase() === '現地払い'))) {
          // This is a truly unknown item from CSV (現地決済/現地払い with no tool)
          finalTool = '不明';
        } else {
          // Fallback for any other unhandled CSV cases, treat as unknown
          finalTool = '不明';
        }
      } else if (transaction.source === 'manual') {
        // Manual slips always have a known payment tool
        finalTool = transaction.paymentTool;
      }

      // Add to salesByTool (which will now include '不明' as a key for aggregation)
      if (finalTool) {
        if (!salesByTool[finalTool]) salesByTool[finalTool] = 0;
        salesByTool[finalTool] += amount;
        // Always add to knownTransactions, and add flags for unknown/resolved status
        knownTransactions.push({
          ...transaction,
          amount,
          tool: finalTool,
          method: finalMethod,
          isUnknownPaymentTool: (finalTool === '不明'),
          // Ensure original CSV fields are passed through for display
          'プロモコード': transaction['プロモコード'],
          '窓口': transaction['窓口']
        });
        console.log('Transaction added to knownTransactions:', knownTransactions[knownTransactions.length - 1]);
      }
    });

    setKnownTransactionsData(knownTransactions);
    setApplicationNumberTotals(tempApplicationNumberTotals);

    // 3. Separate '不明' from salesByTool for final display and calculate overall total
    const finalUnknownTotal = salesByTool['不明'] || 0;
    delete salesByTool['不明']; // Remove '不明' from salesByTool for display purposes

    // 4. Aggregate sales for display in the payment table
    const appGroup = ['R Pay', 'AU Pay'];
    const touchGroup = ['ID', 'R Edy', 'QUIC Pay', '交通系', 'NANACO'];
    const creditCardGroup = ['Credit Card'];
    const rakutenGroupTotals = { 'アプリ決済': 0, 'タッチ決済': 0, 'クレジットカード': 0 };
    const otherSales = {};

    for (const [tool, total] of Object.entries(salesByTool)) {
      if (appGroup.includes(tool)) rakutenGroupTotals['アプリ決済'] += total;
      else if (touchGroup.includes(tool)) rakutenGroupTotals['タッチ決済'] += total;
      else if (creditCardGroup.includes(tool)) rakutenGroupTotals['クレジットカード'] += total;
      else {
        if (!otherSales[tool]) otherSales[tool] = 0;
        otherSales[tool] += total;
      }
    }

    const rakutenGrandTotal = Object.values(rakutenGroupTotals).reduce((sum, total) => sum + total, 0);
    const otherGrandTotal = Object.values(otherSales).reduce((sum, total) => sum + total, 0);
    const calculatedOverallTotal = rakutenGrandTotal + otherGrandTotal + finalUnknownTotal;

    setOverallTotal(calculatedOverallTotal);
    console.log('### DEBUG ### Final salesByTool (excluding 不明):', salesByTool);
    console.log('### DEBUG ### Final unknownTotal:', finalUnknownTotal);
    console.log('### DEBUG ### Calculated Overall Total:', calculatedOverallTotal);
    console.log('### DEBUG ### --- processAllData END ---');

    const newPaymentTableData = [];
    newPaymentTableData.push({ 大分類: '楽天', 中分類: '', 小分類: '', 合計売上金額: rakutenGrandTotal, isTotalRow: true });
    for (const [groupName, total] of Object.entries(rakutenGroupTotals)) {
      newPaymentTableData.push({ 大分類: '', 中分類: groupName, 小分類: '', 合計売上金額: total, isSubTotalRow: true });
      const toolsInGroup = Object.entries(salesByTool).filter(([toolName]) => {
        if (groupName === 'アプリ決済') return appGroup.includes(toolName);
        if (groupName === 'タッチ決済') return touchGroup.includes(toolName);
        if (groupName === 'クレジットカード') return creditCardGroup.includes(toolName);
        return false;
      });
      toolsInGroup.forEach(([toolName, toolTotal]) => newPaymentTableData.push({ 大分類: '', 中分類: '', 小分類: toolName, 合計売上金額: toolTotal }));
    }
    const otherDataSource = Object.entries(otherSales).map(([paymentTool, total]) => ({ paymentTool, total })).sort((a, b) => b.total - a.total);
    otherDataSource.forEach(item => newPaymentTableData.push({ 大分類: item.paymentTool, 中分類: '', 小分類: '', 合計売上金額: item.total }));
    if (finalUnknownTotal > 0) newPaymentTableData.push({ 大分類: '不明', 中分類: '', 小分類: '', 合計売上金額: finalUnknownTotal });
    setPaymentTableDisplayData(newPaymentTableData);

    // Marketing metrics calculation
    const combinedDataForMetrics = allTransactions.filter(t => t.source === 'csv' || t.source === 'manual'); // Ensure only valid transactions are used
    const transactionIds = new Set(combinedDataForMetrics.map(row => row['申込番号']).filter(id => id));
    const customerNames = new Set(combinedDataForMetrics.map(row => row['お名前']).filter(name => name));
    const totalTransactions = transactionIds.size;
    const uniqueCustomers = customerNames.size;
    const avgSpendPerTransaction = totalTransactions > 0 ? calculatedOverallTotal / totalTransactions : 0;
    const avgSpendPerCustomer = uniqueCustomers > 0 ? calculatedOverallTotal / uniqueCustomers : 0;
    const paymentMethodBreakdown = combinedDataForMetrics.reduce((acc, row) => {
        const method = row['決済方法'];
        if (!method) return acc;
        if (!acc[method]) acc[method] = { sales: 0, count: 0 };
        acc[method].sales += row.amount;
        acc[method].count += 1;
        return acc;
    }, {});

    const windowBreakdown = combinedDataForMetrics.reduce((acc, row) => {
      const window = row['窓口'];
      if (!window) return acc;
      if (!acc[window]) acc[window] = 0;
      acc[window] += 1;
      return acc;
    }, {});

    setMarketingMetrics({ totalRevenue: calculatedOverallTotal, totalTransactions, uniqueCustomers, avgSpendPerTransaction, avgSpendPerCustomer, paymentMethodBreakdown, windowBreakdown });
  };

  const handleDuplicateAction = (action) => {
    if (!duplicateModalData) return;

    const { type, duplicates, existingData, newData } = duplicateModalData;

    if (type === 'manualSlips') {
      const existingSlipNumbers = new Set(existingData.map(s => s.slipNumber));
      if (action === 'replace') {
        const updatedSlips = existingData.map(existing => {
          const duplicate = duplicates.find(d => d.slipNumber === existing.slipNumber);
          return duplicate ? { ...existing, ...duplicate } : existing;
        });
        const nonDuplicates = newData.filter(s => !existingSlipNumbers.has(s.slipNumber));
        setManualSlips([...updatedSlips, ...nonDuplicates]);
        alert('重複項目を置き換えて伝票を更新しました。');
      } else if (action === 'add') {
        setManualSlips(prev => [...prev, ...newData]);
        alert(`${newData.length}件の伝票を追加しました。（重複を含む）`);
      } else if (action === 'cancel') {
        alert('アップロードをキャンセルしました。');
      }
    } else if (type === 'transactions') {
      const existingApplicationNumbers = new Set(existingData.map(t => t.申込番号));
      if (action === 'replace') {
        const updatedTransactions = existingData.map(existing => {
          const duplicate = duplicates.find(d => d.申込番号 === existing.申込番号);
          return duplicate ? { ...existing, ...duplicate } : existing;
        });
        const nonDuplicates = newData.filter(t => !existingApplicationNumbers.has(t.申込番号));
        setCsvData([...updatedTransactions, ...nonDuplicates]);
        alert('重複項目を置き換えて取引を更新しました。');
      } else if (action === 'add') {
        setCsvData(prev => [...prev, ...newData]);
        alert(`${newData.length}件の取引を追加しました。（重複を含む）`);
      } else if (action === 'cancel') {
        alert('アップロードをキャンセルしました。');
      }
    }
    setShowDuplicateModal(false);
    setDuplicateModalData(null);
  };

  return (
    <div className={styles.container}>
      {showDuplicateModal && duplicateModalData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>重複項目が見つかりました</h2>
            <p>重複する{duplicateModalData.duplicates.length}件の{duplicateModalData.type === 'manualSlips' ? '伝票' : '取引'}が見つかりました。どうしますか？</p>
            <div className={styles.modalButtons}>
              <button onClick={() => handleDuplicateAction('replace')} className={styles.modalButton}>置き換える</button>
              <button onClick={() => handleDuplicateAction('add')} className={styles.modalButton}>重複項目も追加する</button>
              <button onClick={() => handleDuplicateAction('cancel')} className={styles.modalButton}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
      <h1 className={styles.header}>Woody Rental 売上計算ソフト</h1>
      <div className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`} onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}>
        <p>ここにWasabiのCSVファイルをドラッグ＆ドロップ or</p>
        <input id="file-upload" type="file" accept=".csv" onChange={(e) => processFile(e.target.files[0])} className={styles.fileInput} />
        <label htmlFor="file-upload" className={styles.fileInputLabel}>ファイルを選択</label>
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      
      {isClient && (hasProcessed || manualSlips.length > 0) && paymentTableDisplayData.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>決済</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th>大分類</th><th>中分類</th><th>小分類</th><th>合計売上金額</th></tr></thead>
              <tbody>{paymentTableDisplayData.map((item, index) => (
                <tr key={index} className={item.isSubTotalRow ? styles.middleCategoryRow : (item.小分類 && item.小分類 !== '' ? styles.subCategoryRow : '')}>
                  <td>{item.大分類}</td>
                  <td>{item.中分類}</td>
                  <td>{item.小分類}</td>
                  <td>{item.合計売上金額.toLocaleString()}円</td>
                </tr>
              ))}</tbody>
              <tfoot><tr><td><strong>合計</strong></td><td></td><td></td><td><strong>{overallTotal.toLocaleString()}円</strong></td></tr></tfoot>
            </table>
          </div>
        </>
      )}

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>伝票入力</h2>
        <div className={styles.headerButtons}>
          {isClient && manualSlips.length > 0 && (
            <button onClick={handleSaveManualSlipsToCsv} className={`${styles.fileInputLabel} ${styles.smallButton} ${styles.saveButton}`}>一時保存 (CSVをDL)</button>
          )}
          <div className={styles.fileInputContainer}>
            <input id="manual-slips-upload" type="file" accept=".csv" onChange={(e) => processManualSlipsFile(e.target.files[0])} className={styles.fileInput} />
            <label htmlFor="manual-slips-upload" className={`${styles.fileInputLabel} ${styles.smallButton}`}>伝票CSVをUP</label>
          </div>
        </div>
      </div>
      <form onSubmit={handleFormSubmit} onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault(); // Prevent default form submission (e.g., page reload)
          handleFormSubmit(e); // Manually trigger the form submission handler
        }
      }} className={styles.formContainerSingleRow}>
          <input name="slipNumber" value={formInput.slipNumber} onChange={(e) => setFormInput({...formInput, slipNumber: e.target.value})} placeholder="伝票番号" className={styles.formInputSingleRow} />
          <input name="amount" value={formInput.amount} onChange={(e) => setFormInput({...formInput, amount: parseFloat(e.target.value) || 0})} placeholder="金額" type="number" className={styles.formInputSingleRow} />
          <select name="paymentTool" value={formInput.paymentTool} onChange={(e) => setFormInput({...formInput, paymentTool: e.target.value})} className={styles.formSelectSingleRow}>{paymentToolOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
          <input name="memo" value={formInput.memo} onChange={(e) => setFormInput({...formInput, memo: e.target.value})} placeholder="内容・メモ" className={styles.formInputSingleRow} />
          <input name="name" value={formInput.name} onChange={(e) => setFormInput({...formInput, name: e.target.value})} placeholder="名前" className={styles.formInputSingleRow} />
          <div className={styles.formButtonsContainer}>
            <button type="submit" className={styles.formButtonSingleRow}>伝票を登録</button>
          </div>
      </form>

      {isClient && manualSlips.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>伝票一覧</h2>
          <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead><tr><th>伝票番号</th><th>金額</th><th>決済ツール</th><th>内容・メモ</th><th>名前</th><th>操作</th></tr></thead>
                <tbody>
                  {manualSlips.map(slip => (
                    <tr key={slip.id}>
                      {editingSlipId === slip.id ? (
                        <>
                          <td><input type="text" value={editingSlipData.slipNumber} onChange={(e) => setEditingSlipData({...editingSlipData, slipNumber: e.target.value})} className={styles.tableInput} /></td>
                          <td><input type="number" value={editingSlipData.amount} onChange={(e) => setEditingSlipData({...editingSlipData, amount: parseFloat(e.target.value) || 0})} className={styles.tableInput} /></td>
                          <td><select value={editingSlipData.paymentTool} onChange={(e) => setEditingSlipData({...editingSlipData, paymentTool: e.target.value})} className={styles.tableSelect}>{paymentToolOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></td>
                          <td><input type="text" value={editingSlipData.memo} onChange={(e) => setEditingSlipData({...editingSlipData, memo: e.target.value})} className={styles.tableInput} /></td>
                          <td><input type="text" value={editingSlipData.name} onChange={(e) => setEditingSlipData({...editingSlipData, name: e.target.value})} className={styles.tableInput} /></td>
                          <td className={styles.actionsCell}>
                            <button type="button" onClick={handleUpdateSlip} className={`${styles.tableButton} ${styles.saveButton}`}>保存</button>
                            <button type="button" onClick={handleCancelEdit} className={`${styles.tableButton} ${styles.cancelButton}`}>キャンセル</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{slip.slipNumber}</td><td>{slip.amount.toLocaleString()}円</td><td>{slip.paymentTool}</td><td>{slip.memo}</td><td>{slip.name}</td>
                          <td className={styles.actionsCell}>
                            <button type="button" onClick={() => handleEditClick(slip)} className={styles.tableButton}>編集</button>
                            <button type="button" onClick={() => handleDeleteSlip(slip.id)} className={`${styles.tableButton} ${styles.deleteButton}`}>削除</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </>
      )}

      {isClient && unknownPaymentToolData.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>決済ツール不明の取引</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th></th><th>申込番号</th><th>枝番</th><th>お名前</th><th>金額</th><th>申込番号合計</th><th style={{ width: '20em' }}>決済ツール</th><th>貸出日</th><th>貸出店舗</th><th style={{minWidth: '15rem'}}>メモ</th><th>決済時間</th><th>貸出日時</th><th>決済方法</th><th>プロモコード</th><th>窓口</th><th>変動価格</th><th>操作</th></tr></thead>
              <tbody>
                {unknownPaymentToolData.map((item, index) => {
                  console.log('Unknown item:', item);
                  return (
                  <tr key={index} className={`${checkedRows[index] ? styles.checkedRow : ''} ${editedUnknownRows[index] ? styles.editedUnknownRow : ''}`}>
                    <td><input type="checkbox" checked={!!checkedRows[index]} onChange={() => setCheckedRows(prev => ({...prev, [index]: !prev[index]}))} /></td>
                    <td>{item.申込番号}</td><td>{item.枝番}</td><td>{item.お名前}</td><td className={styles.amountCell}>{item.金額.toLocaleString()}円</td>
                    <td>{item.枝番 === '1' && applicationNumberTotals[item.申込番号] ? applicationNumberTotals[item.申込番号].toLocaleString() + '円' : ''}</td>
                    <td style={{ width: '20em' }}>
                      <select value={item.selectedPaymentTool || ''} onChange={(e) => handleUnknownPaymentToolChange(index, e.target.value)} className={styles.tableSelect}>
                        <option value="">選択してください</option>
                        {paymentToolOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td className={styles.dateCell}>{item.貸出日}</td><td className={styles.shopCell}>{item.貸出店舗}</td><td className={styles.memoCell} style={{minWidth: '15rem'}}>{item.メモ}</td><td>{item.決済時間}</td><td>{item.貸出日時}</td><td>{item.決済方法}</td><td>{item.プロモコード}</td><td>{item.窓口}</td><td>{item.変動価格}</td>
                    <td className={styles.actionsCell}><button type="button" onClick={() => handleDeleteUnknownItem(item.originalIndex)} className={`${styles.tableButton} ${styles.deleteButton}`}>削除</button></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isClient && knownTransactionsData.length > 0 && (
        <>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>取引一覧</h2>
            <div className={styles.headerButtons}>
              {isClient && knownTransactionsData.length > 0 && (
                <div className={styles.transactionButtonsContainer}>
                  <button onClick={handleSaveTransactionsToCsv} className={`${styles.fileInputLabel} ${styles.smallButton} ${styles.saveButton}`}>取引一時保存 (CSVをDL)</button>
                  <div className={styles.fileInputContainer}>
                    <input id="transactions-upload" type="file" accept=".csv" onChange={(e) => processTransactionsFile(e.target.files[0])} className={styles.fileInput} />
                    <label htmlFor="transactions-upload" className={`${styles.fileInputLabel} ${styles.smallButton}`}>取引CSVをUP</label>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={styles.searchAndButtonsContainer}>
            <div className={styles.searchInputContainer}>
              <input
                type="number"
                placeholder="金額または申込番号合計で検索"
                value={amountSearchTerm}
                onChange={(e) => setAmountSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <input
                type="text"
                placeholder="申込番号で検索"
                value={applicationNumberSearchTerm}
                onChange={(e) => setApplicationNumberSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
                            <thead><tr><th>申込番号</th><th>枝番</th><th>お名前</th><th>金額</th><th>申込番号合計</th><th>決済ツール</th><th>貸出日</th><th>貸出店舗</th><th>メモ</th><th>決済時間</th><th>貸出日時</th><th>決済方法</th><th>プロモコード</th><th>窓口</th><th>変動価格</th><th>操作</th></tr></thead>
              <tbody>
              {console.log('knownTransactionsData before rendering:', knownTransactionsData)}
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((item, index) => (
                    <tr key={item.id || index} className={item.isUnknownPaymentTool ? styles.unknownPaymentRow : ''}>
                      {editingTransactionId === item.id ? (
                        <>
                          <td>{item.申込番号}</td>
                          <td>{item.枝番}</td>
                          <td>{item.お名前}</td>
                          <td className={styles.amountCell}>{item.amount.toLocaleString()}円</td>
                          <td>{item.枝番 === '1' && applicationNumberTotals[item.申込番号] ? applicationNumberTotals[item.申込番号].toLocaleString() + '円' : ''}</td>
                          <td>
                            <select 
                              value={editingTransactionData.tool}
                              onChange={(e) => setEditingTransactionData({...editingTransactionData, tool: e.target.value})}
                              className={styles.tableSelect}
                            >
                              {paymentToolOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>
                          <td className={styles.dateCell}>{item.貸出日}</td>
                          <td className={styles.shopCell}>{item.貸出店舗}</td>
                          <td className={styles.memoCell}>
                            <textarea
                              value={editingTransactionData.メモ || ''}
                              onChange={(e) => setEditingTransactionData({ ...editingTransactionData, メモ: e.target.value })}
                              className={`${styles.tableInput} ${styles.tableTextarea}`}
                              rows="3"
                            />
                          </td>
                          <td>{item.決済時間}</td>
                          <td>{item.貸出日時}</td>
                          <td>{item.method}</td>
                          <td>{item['プロモコード']}</td>
                          <td>{item['窓口']}</td>
                          <td>{item.変動価格}</td>
                          <td className={styles.actionsCell}>
                            <button onClick={handleTransactionUpdate} className={`${styles.tableButton} ${styles.saveButton}`}>保存</button>
                            <button onClick={handleTransactionCancelEdit} className={`${styles.tableButton} ${styles.cancelButton}`}>キャンセル</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{item.申込番号}</td>
                          <td>{item.枝番}</td>
                          <td>{item.お名前}</td>
                          <td className={styles.amountCell}>{item.amount.toLocaleString()}円</td>
                          <td>{item.枝番 === '1' && applicationNumberTotals[item.申込番号] ? applicationNumberTotals[item.申込番号].toLocaleString() + '円' : ''}</td>
                          <td>{item.tool}</td>
                          <td className={styles.dateCell}>{item.貸出日}</td>
                          <td className={styles.shopCell}>{item.貸出店舗}</td>
                          <td className={styles.memoCell}>{item.メモ}</td>
                          <td>{item.決済時間}</td>
                          <td>{item.貸出日時}</td>
                          <td>{item.method}</td>
                          <td>{item['プロモコード']}</td>
                          <td>{item['窓口']}</td>
                          <td>{item.変動価格}</td>
                          <td className={styles.actionsCell}>
                            <button onClick={() => handleTransactionEditClick(item)} className={styles.tableButton}>編集</button>
                            <button onClick={() => handleTransactionDelete(item.id, item.source)} className={`${styles.tableButton} ${styles.deleteButton}`}>削除</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="16" style={{ textAlign: 'center' }}>データなし</td>
                  </tr>
                )}
              </tbody>
           </table>
          </div>
        </>
      )}

      {isClient && marketingMetrics && (
        <>
          <h2 className={styles.sectionTitle}>マーケティング指標</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th>指標</th><th>値</th></tr></thead>
              <tbody>
                <tr><td><strong>総売上</strong></td><td>{marketingMetrics.totalRevenue.toLocaleString()}円</td></tr>
                <tr><td><strong>総取引件数</strong></td><td>{marketingMetrics.totalTransactions.toLocaleString()}件</td></tr>
                <tr><td><strong>ユニーク顧客数</strong></td><td>{marketingMetrics.uniqueCustomers.toLocaleString()}人</td></tr>
                <tr><td><strong>平均取引単価</strong></td><td>{Math.round(marketingMetrics.avgSpendPerTransaction).toLocaleString()}円</td></tr>
                <tr><td><strong>顧客平均単価</strong></td><td>{Math.round(marketingMetrics.avgSpendPerCustomer).toLocaleString()}円</td></tr>
                {Object.entries(marketingMetrics.paymentMethodBreakdown).map(([method, data]) => [
                    <tr key={`${method}-header`}><td colSpan="2"><strong>決済方法別: ${method}</strong></td></tr>,
                    <tr key={`${method}-sales`}><td style={{ paddingLeft: '2em' }}>売上</td><td>{data.sales.toLocaleString()}円</td></tr>,
                    <tr key={`${method}-count`}><td style={{ paddingLeft: '2em' }}>件数</td><td>{data.count.toLocaleString()}件</td></tr>
                ])}
                {Object.entries(marketingMetrics.windowBreakdown).map(([window, count]) => {
                  const percentage = marketingMetrics.uniqueCustomers > 0 ? ((count / marketingMetrics.uniqueCustomers) * 100).toFixed(2) : 0;
                  return (
                    <tr key={`${window}-count`}><td style={{ paddingLeft: '2em' }}>窓口別: ${window}</td><td>{count.toLocaleString()}件 ({percentage}%)</td></tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Clipboard Copy Section */}
      {isClient && (hasProcessed || manualSlips.length > 0) && (
        <div className={styles.copySectionContainer}>
          <h2 className={styles.sectionTitle}>スプレッドシート用にコピー</h2>
          <div className={styles.copyButtonsContainer}>
            <button onClick={handleCopyAllDataToClipboard} className={`${styles.clipboardButton} ${styles.copyAllButton}`}>
              全てをコピー
            </button>
            <button onClick={handleCopyPaymentSummary} className={styles.clipboardButton}>
              決済サマリーをコピー
            </button>
            <button onClick={handleCopyToClipboard} className={styles.clipboardButton}>
              取引一覧をコピー
            </button>
            <button onClick={handleCopyMarketingMetrics} className={styles.clipboardButton}>
              マーケティング指標をコピー
            </button>
          </div>
        </div>
      )}
    </div>
  );
}