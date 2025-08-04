'use client';
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import styles from "./page.module.scss";
// import { paymentToolOptions } from '../data/paymentTools.js';
import MarketingMetricsTable from '../components/MarketingMetricsTable.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import CancelledTransactionsTable from '../components/CancelledTransactionsTable.jsx';
import ManualSlipTable from '../components/ManualSlipTable.jsx';
import PaymentSummaryTable from '../components/PaymentSummaryTable.jsx';
import CashCalculator from '../components/CashCalculator.jsx';
import ActualSalesCalculator from '../components/ActualSalesCalculator.jsx';
import UnknownTransactionsTable from '../components/UnknownTransactionsTable.jsx';
import FileUpload from '../components/FileUpload.jsx';
import ManualSlipForm from '../components/ManualSlipForm.jsx';

export default function Home() {
  // State variables
  const [csvData, setCsvData] = useState([]);
  const [manualSlips, setManualSlips] = useState([]);
  const [paymentTableDisplayData, setPaymentTableDisplayData] = useState([]);
  const [unknownPaymentToolData, setUnknownPaymentToolData] = useState([]);
  const [knownTransactionsData, setKnownTransactionsData] = useState([]); // New state for known transactions
  const [cancelledTransactionsData, setCancelledTransactionsData] = useState([]); // New state for cancelled transactions
  const [marketingMetrics, setMarketingMetrics] = useState(null);
  const [overallTotal, setOverallTotal] = useState(0);
  const [applicationNumberTotals, setApplicationNumberTotals] = useState({}); // New state for application number totals
  
  const [hasProcessed, setHasProcessed] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(''); // New state for uploaded file name
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [checkedRows, setCheckedRows] = useState({});
  const [editedUnknownRows, setEditedUnknownRows] = useState({}); // New state for tracking edited unknown rows
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateModalData, setDuplicateModalData] = useState(null);
  const [actualSalesInput, setActualSalesInput] = useState({}); // New state for actual sales input
  const [parentCategoryActualSums, setParentCategoryActualSums] = useState({}); // New state for parent category actual sums
  const [cashCounts, setCashCounts] = useState({ '10000': 0, '5000': 0, '1000': 0, '500': 0, '100': 0, '50': 0, '10': 0, '5': 0, '1': 0 });
  const [totalCashAmount, setTotalCashAmount] = useState(0);
  const [registerAmount, setRegisterAmount] = useState(50500); // レジ金の初期値
  const [finalCashTotal, setFinalCashTotal] = useState(0); // 最終的な現金合計
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [showSubCategories, setShowSubCategories] = useState(false);

  // State for manual entry form
  const [formInput, setFormInput] = useState({ slipNumber: '', name: '', amount: '', paymentTool: 'Cash', memo: '', type: '一般' }); // Added type for slip

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
    const newParentSums = {};
    let currentMainCategory = '';
    paymentTableDisplayData.forEach(item => {
      if (item.大分類 && item.isTotalRow) {
        currentMainCategory = item.大分類;
      }
      if (currentMainCategory && item.isSubTotalRow) {
        const key = currentMainCategory + (item.中分類 ? `-${item.中分類}` : '');
        if (!newParentSums[currentMainCategory]) {
          newParentSums[currentMainCategory] = 0;
        }
        newParentSums[currentMainCategory] += parseFloat(actualSalesInput[key]) || 0;
      }
    });
    setParentCategoryActualSums(newParentSums);
  }, [actualSalesInput, paymentTableDisplayData]);

  

  useEffect(() => {
    // Calculate total cash amount whenever cashCounts changes
    const newTotal = Object.entries(cashCounts).reduce((sum, [denomination, count]) => {
      return sum + (parseInt(denomination) * (parseInt(count) || 0));
    }, 0);
    setTotalCashAmount(newTotal);
  }, [cashCounts]);

  useEffect(() => {
    // Calculate final cash total (totalCashAmount - registerAmount)
    setFinalCashTotal(totalCashAmount - registerAmount);
  }, [totalCashAmount, registerAmount]);

  useEffect(() => {
    // Automatically update the actual sales input for Cash when finalCashTotal changes
    setActualSalesInput(prev => ({
      ...prev,
      'Cash': finalCashTotal
    }));
  }, [finalCashTotal]);

  useEffect(() => {
    let filtered = knownTransactionsData;

    if (amountSearchTerm) {
      const searchAmount = parseFloat(amountSearchTerm);
      if (!isNaN(searchAmount)) {
        filtered = filtered.filter(item => 
          item.amount === searchAmount ||
          (item.枝番 === '1' && applicationNumberTotals[item.申込番号] === searchAmount)
        );
      }
    }

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
        setUploadedFileName(file.name); // Set the uploaded file name
        // Initialize unknownPaymentToolData with all potentially unknown items from CSV
        const initialUnknownData = results.data.map((row, index) => ({ ...row, originalIndex: index, status: row['ステータス'] || '' })).filter(row => {
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
          memo: row.memo || '',
          type: row.type || '一般' // Default to '一般' if not specified
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
    setFormInput({ slipNumber: '', name: '', amount: '', paymentTool: 'Cash', memo: '', type: '一般' });
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
      '申込番号', '枝番', 'お名前', '金額', '決済ツール', '貸出日', '貸出店舗', 'メモ', '決済時間', '貸出日時', '決済方法', 'ステータス', 'プロモコード', '窓口', '変動価格'
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
        item.status || '',
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
      alert('取引一覧がクリップボードにコピーされました.\nGoogleスプレッドシートに貼り付けてください。');
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
    const headers = ['大分類', '中分類', '小分類', '合計売上金額'];
    const headerString = headers.join('\t');

    const rows = paymentTableDisplayData.map(item => {
      const rowData = [
        item.大分類 || '',
        item.中分類 || '',
        item.小分類 || '',
        item.合計売上金額 || 0
      ];
      return rowData.join('\t');
    });

    const totalRow = ['合計', '', '', overallTotal].join('\t');
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

    Object.entries(marketingMetrics.paymentToolBreakdown).forEach(([tool, data]) => {
      rows.push([`決済ツール別: ${tool} - 売上`, data.sales]);
      rows.push([`決済ツール別: ${tool} - 件数`, data.count]);
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
    const headers = ['大分類', '中分類', '小分類', '合計売上金額'];
    const headerString = headers.join('\t');
    const rows = paymentTableDisplayData.map(item => {
      const rowData = [
        item.大分類 || '',
        item.中分類 || '',
        item.小分類 || '',
        item.合計売上金額 || 0
      ];
      return rowData.join('\t');
    });
    const totalRow = ['合計', '', '', overallTotal].join('\t');
    rows.push(totalRow);
    return [headerString, ...rows].join('\n');
  };

  const getAllTransactionsTsv = () => {
    if (knownTransactionsData.length === 0) return '';
    const headers = [
      '申込番号', '枝番', 'お名前', '金額', '決済ツール', '貸出日', '貸出店舗', 'メモ', '決済時間', '貸出日時', '決済方法', 'ステータス', 'プロモコード', '窓口', '変動価格'
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
        item.status || '',
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
    Object.entries(marketingMetrics.paymentToolBreakdown).forEach(([tool, data]) => {
      rows.push([`決済ツール別: ${tool} - 売上`, data.sales]);
      rows.push([`決済ツール別: ${tool} - 件数`, data.count]);
    });
    Object.entries(marketingMetrics.windowBreakdown).forEach(([window, count]) => {
      const percentage = marketingMetrics.uniqueCustomers > 0 ? ((count / marketingMetrics.uniqueCustomers) * 100).toFixed(2) : 0;
      rows.push([`窓口別: ${window}`, `${count}件 (${percentage}%)`]);
    });
    return [headerString, ...rows.map(row => row.join('\t'))].join('\n');
  };

  const getMerchandiseSlipsTsv = () => {
    const merchandiseSlips = manualSlips.filter(slip => slip.type === '物販');
    if (merchandiseSlips.length === 0) {
      return '物販なし';
    }

    const headers = [
      'slipNumber', 'name', 'amount', 'paymentTool', 'memo', 'type'
    ];
    const headerString = headers.join('\t');

    const rows = merchandiseSlips.map(slip => {
      const rowData = [
        slip.slipNumber || '',
        slip.name || '',
        slip.amount || 0,
        slip.paymentTool || '',
        slip.memo || '',
        slip.type || '一般'
      ];
      return rowData.map(cell => {
          const cellString = String(cell);
          return cellString.replace(/\t/g, ' ').replace(/\n/g, ' ');
      }).join('\t');
    });

    return [headerString, ...rows].join('\n');
  };

  const handleCopyAllDataToClipboard = () => {
    let combinedTsv = '';

    const paymentSummaryTsv = getPaymentSummaryTsv();    if (paymentSummaryTsv) {      combinedTsv += '--- 決済サマリー ---
';      combinedTsv += paymentSummaryTsv + '

';    }

    const merchandiseSlipsTsv = getMerchandiseSlipsTsv();
    combinedTsv += '--- 伝票一覧 (物販) ---\n' + merchandiseSlipsTsv + '\n\n';

    const allTransactionsTsv = getAllTransactionsTsv();
    if (allTransactionsTsv) {
      combinedTsv += '--- 全取引一覧(物販含む) ---\n' + allTransactionsTsv + '\n\n';
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
      'memo': slip.memo || '',
      'type': slip.type || '一般'
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
      '申込番号', '枝番', 'お名前', '金額', '決済ツール', '貸出日', '貸出店舗', 'メモ', '決済時間', '貸出日時', '決済方法', 'ステータス', 'プロモコード', '窓口', '変動価格'
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
    const allTransactions = [
      ...currentCsvData.map((row, index) => ({
        ...row,
        id: `csv-${row.originalIndex || index}`,
        amount: parseFloat(row['金額']),
        source: 'csv'
      })),
      ...currentManualSlips.map(slip => ({
        ...slip,
        amount: parseFloat(slip.amount),
        source: 'manual',
        '申込番号': slip.slipNumber ? `伝票 ${slip.slipNumber}` : '',
        'お名前': slip.name,
        'メモ': slip.memo,
        '決済方法': '',
        '決済ツール名': slip.paymentTool,
        type: slip.type || '一般'
      }))
    ].filter(t => !isNaN(t.amount));

    const knownTransactions = [];
    const salesByTool = {};
    const tempApplicationNumberTotals = {};

    allTransactions.forEach(transaction => {
      const amount = transaction.amount;
      let finalTool = '';
      let finalMethod = transaction['決済方法'];

      if (transaction.申込番号) {
        if (!tempApplicationNumberTotals[transaction.申込番号]) tempApplicationNumberTotals[transaction.申込番号] = 0;
        tempApplicationNumberTotals[transaction.申込番号] += amount;
      }

      if (transaction.source === 'csv') {
        const assignedToolItem = currentUnknownPaymentToolData.find(item =>
          item.originalIndex === transaction.originalIndex && item.selectedPaymentTool && item.selectedPaymentTool !== ''
        );

        if (assignedToolItem) {
          finalTool = assignedToolItem.selectedPaymentTool;
          finalMethod = assignedToolItem.決済方法 || finalMethod;
        } else if (finalMethod && finalMethod.trim().toLowerCase() === 'カード払い') {
          finalTool = '事前カード';
        } else if (transaction['決済ツール名'] && transaction['決済ツール名'].trim() !== '' && transaction['決済ツール名'].trim().toLowerCase() !== '不明') {
          finalTool = transaction['決済ツール名'];
        } else if ((!transaction['決済ツール名'] || transaction['決済ツール名'].trim() === '' || transaction['決済ツール名'].trim().toLowerCase() === '不明') && (finalMethod && (finalMethod.trim().toLowerCase() === '現地決済' || finalMethod.trim().toLowerCase() === '現地払い'))) {
          finalTool = '不明';
        } else {
          finalTool = '不明';
        }
      } else if (transaction.source === 'manual') {
        finalTool = transaction.paymentTool;
      }

      if (finalTool) {
        if (!salesByTool[finalTool]) salesByTool[finalTool] = 0;
        salesByTool[finalTool] += amount;
        knownTransactions.push({
          ...transaction,
          amount,
          tool: finalTool,
          method: finalMethod,
          isUnknownPaymentTool: (finalTool === '不明'),
          status: transaction['ステータス'] || '', // Add status property
        });
      }
    });

    setKnownTransactionsData(knownTransactions);
    setCancelledTransactionsData(knownTransactions.filter(t => t.status === 'キャンセル'));
    setApplicationNumberTotals(tempApplicationNumberTotals);

    const finalUnknownTotal = salesByTool['不明'] || 0;
    delete salesByTool['不明'];

    const appGroup = ['R Pay', 'AU Pay'];
    const touchGroup = ['ID', 'R Edy', 'QUIC Pay', '交通系', 'NANACO'];
    const creditCardGroup = ['Credit Card'];
    const rakutenGroupTotals = { 'アプリ決済': 0, 'タッチ決済': 0, 'カード決済': 0 };
    const otherSales = {};

    for (const [tool, total] of Object.entries(salesByTool)) {
      if (appGroup.includes(tool)) rakutenGroupTotals['アプリ決済'] += total;
      else if (touchGroup.includes(tool)) rakutenGroupTotals['タッチ決済'] += total;
      else if (creditCardGroup.includes(tool)) rakutenGroupTotals['カード決済'] += total;
      else {
        if (!otherSales[tool]) otherSales[tool] = 0;
        otherSales[tool] += total;
      }
    }

    if (otherSales['Cash'] === undefined) {
      otherSales['Cash'] = 0;
    }

    const rakutenGrandTotal = Object.values(rakutenGroupTotals).reduce((sum, total) => sum + total, 0);
    const otherGrandTotal = Object.values(otherSales).reduce((sum, total) => sum + total, 0);
    const calculatedOverallTotal = rakutenGrandTotal + otherGrandTotal + finalUnknownTotal;

    setOverallTotal(calculatedOverallTotal);

    const newPaymentTableData = [];
    newPaymentTableData.push({ 大分類: '楽天', 中分類: '', 小分類: '', 合計売上金額: rakutenGrandTotal, isTotalRow: true });
    for (const [groupName, total] of Object.entries(rakutenGroupTotals)) {
      newPaymentTableData.push({ 大分類: '', 中分類: groupName, 小分類: '', 合計売上金額: total, isSubTotalRow: true });
      const toolsInGroup = Object.entries(salesByTool).filter(([toolName]) => {
        if (groupName === 'アプリ決済') return appGroup.includes(toolName);
        if (groupName === 'タッチ決済') return touchGroup.includes(toolName);
        if (groupName === 'カード決済') return creditCardGroup.includes(toolName);
        return false;
      });
      toolsInGroup.forEach(([toolName, toolTotal]) => newPaymentTableData.push({ 大分類: '', 中分類: '', 小分類: toolName, 合計売上金額: toolTotal }));
    }
    const otherDataSource = Object.entries(otherSales).map(([paymentTool, total]) => ({ paymentTool, total })).sort((a, b) => b.total - a.total);
    otherDataSource.forEach(item => newPaymentTableData.push({ 大分類: item.paymentTool, 中分類: '', 小分類: '', 合計売上金額: item.total }));
    if (finalUnknownTotal > 0) newPaymentTableData.push({ 大分類: '不明', 中分類: '', 小分類: '', 合計売上金額: finalUnknownTotal });
    setPaymentTableDisplayData(newPaymentTableData);

    // --- Marketing Metrics Calculation ---
    const combinedDataForMetrics = knownTransactions;
    const totalTransactions = combinedDataForMetrics.length;
    const uniqueApplicationNumbers = new Set(combinedDataForMetrics.map(t => t.申込番号).filter(Boolean));
    const totalGroups = uniqueApplicationNumbers.size;

    const uniqueCustomerData = Array.from(
      combinedDataForMetrics.reduce((map, row) => {
        const name = row['お名前'];
        if (name && !map.has(name)) {
          map.set(name, {
            age: row['年齢'] ? parseInt(row['年齢'], 10) : null,
            nationality: row['国籍'] || '不明'
          });
        }
        return map;
      }, new Map()).values()
    );

    const uniqueCustomers = uniqueCustomerData.length;
    const avgSpendPerGroup = totalGroups > 0 ? calculatedOverallTotal / totalGroups : 0;
    const avgSpendPerCustomer = uniqueCustomers > 0 ? calculatedOverallTotal / uniqueCustomers : 0;

    const paymentToolBreakdown = combinedDataForMetrics.reduce((acc, row) => {
      const tool = row['tool'];
      const customerName = row['お名前']; // Get customer name
      if (!tool) return acc;
      if (!acc[tool]) acc[tool] = { sales: 0, uniqueCustomers: new Set() }; // Use a Set to store unique customer names
      acc[tool].sales += row.amount;
      if (customerName) {
        acc[tool].uniqueCustomers.add(customerName);
      }
      return acc;
    }, {});

    // Convert Set sizes to actual unique customer counts
    for (const tool in paymentToolBreakdown) {
      paymentToolBreakdown[tool].count = paymentToolBreakdown[tool].uniqueCustomers.size;
      delete paymentToolBreakdown[tool].uniqueCustomers; // Remove the Set
    }

    const windowBreakdown = combinedDataForMetrics.reduce((acc, row) => {
      const window = row['窓口'];
      const customerName = row['お名前'];
      if (!window || !customerName) return acc;
      if (!acc[window]) acc[window] = new Set();
      acc[window].add(customerName);
      return acc;
    }, {});
    const windowFinalBreakdown = Object.entries(windowBreakdown).reduce((acc, [key, value]) => ({...acc, [key]: value.size}), {});

    const customersWithAge = uniqueCustomerData.filter(c => c.age !== null && !isNaN(c.age));
    const averageAge = customersWithAge.length > 0
      ? customersWithAge.reduce((sum, c) => sum + c.age, 0) / customersWithAge.length
      : 0;

    const customers12AndUnder = uniqueCustomerData.filter(c => c.age !== null && !isNaN(c.age) && c.age <= 12).length;
    const percentage12AndUnder = uniqueCustomers > 0 ? (customers12AndUnder / uniqueCustomers) * 100 : 0;

    const nationalityBreakdown = uniqueCustomerData.reduce((acc, customer) => {
      const nationality = customer.nationality || '不明';
      acc[nationality] = (acc[nationality] || 0) + 1;
      return acc;
    }, {});

    const hourlyBreakdown = combinedDataForMetrics.reduce((acc, row) => {
      const time = row['決済時間'];
      const customerName = row['お名前'];
      if (time && typeof time === 'string' && customerName) {
        const hour = time.split(':')[0];
        if (hour && !isNaN(parseInt(hour))) {
            const hourKey = `${parseInt(hour, 10).toString().padStart(2, '0')}:00`;
            if (!acc[hourKey]) acc[hourKey] = new Set();
            acc[hourKey].add(customerName);
        }
      }
      return acc;
    }, {});
    const hourlyFinalBreakdown = Object.entries(hourlyBreakdown)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value.size }), {});

    setMarketingMetrics({
      totalRevenue: calculatedOverallTotal,
      totalTransactions: totalGroups, // Changed from totalTransactions
      uniqueCustomers,
      avgSpendPerTransaction: avgSpendPerGroup, // Changed from avgSpendPerTransaction
      avgSpendPerCustomer,
      paymentToolBreakdown, // Note: count is still transaction count here
      windowBreakdown: windowFinalBreakdown,
      averageAge,
      customers12AndUnder,
      percentage12AndUnder,
      nationalityBreakdown,
      hourlyBreakdown: hourlyFinalBreakdown
    });
  };

  const handleRegisterAmountChange = (e) => {
    setRegisterAmount(parseInt(e.target.value) || 0);
  };

  const handleCashCountChange = (denomination, value) => {
    const count = parseInt(value, 10);
    if (count < 0) {
        alert("0以上の数値を入力してください。");
        return;
    }
    setCashCounts(prevCounts => ({
        ...prevCounts,
        [denomination]: isNaN(count) ? 0 : count
    }));
  };

  const handleCopyCashTotal = () => {
    navigator.clipboard.writeText(finalCashTotal).then(() => {
      alert('現金合計がクリップボードにコピーされました。');
    }).catch(err => {
      console.error('クリップボードへのコピーに失敗しました:', err);
      alert('クリップボードへのコピーに失敗しました。');
    });
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowCompletionPopup(false);
      }
    };

    if (showCompletionPopup) {
      document.addEventListener('keydown', handleEscape);
    } else {
      document.removeEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showCompletionPopup]);

  return (
    <div className={styles.container}>
      {showDuplicateModal && duplicateModalData && (
        <div className={styles.modalOverlay} onClick={() => setShowDuplicateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
      <FileUpload 
        processFile={processFile} 
        uploadedFileName={uploadedFileName} 
        error={error} 
      />
      
      {isClient && (hasProcessed || manualSlips.length > 0) && (
        <PaymentSummaryTable 
          paymentTableDisplayData={paymentTableDisplayData} 
          overallTotal={overallTotal} 
        />
      )}

      <ManualSlipForm 
        formInput={formInput} 
        setFormInput={setFormInput} 
        handleFormSubmit={handleFormSubmit} 
        handleSaveManualSlipsToCsv={handleSaveManualSlipsToCsv} 
        processManualSlipsFile={processManualSlipsFile} 
        manualSlips={manualSlips} 
        isClient={isClient} 
      />

      {isClient && (
        <ManualSlipTable 
          manualSlips={manualSlips} 
          editingSlipId={editingSlipId} 
          editingSlipData={editingSlipData} 
          handleEditClick={handleEditClick} 
          handleUpdateSlip={handleUpdateSlip} 
          handleCancelEdit={handleCancelEdit} 
          handleDeleteSlip={handleDeleteSlip} 
          setEditingSlipData={setEditingSlipData} 
        />
      )}

      {isClient && (
        <CashCalculator 
          cashCounts={cashCounts} 
          registerAmount={registerAmount} 
          finalCashTotal={finalCashTotal} 
          handleCashCountChange={handleCashCountChange} 
          handleRegisterAmountChange={handleRegisterAmountChange} 
        />
      )}

      {isClient && (
        <ActualSalesCalculator 
          paymentTableDisplayData={paymentTableDisplayData} 
          actualSalesInput={actualSalesInput} 
          setActualSalesInput={setActualSalesInput} 
          overallTotal={overallTotal} 
          parentCategoryActualSums={parentCategoryActualSums}
          showSubCategories={showSubCategories}
          setShowSubCategories={setShowSubCategories}
        />
      )}

      {isClient && (
        <UnknownTransactionsTable 
          unknownPaymentToolData={unknownPaymentToolData} 
          checkedRows={checkedRows} 
          editedUnknownRows={editedUnknownRows} 
          applicationNumberTotals={applicationNumberTotals} 
          handleUnknownPaymentToolChange={handleUnknownPaymentToolChange} 
          handleDeleteUnknownItem={handleTransactionDelete} 
          setCheckedRows={setCheckedRows} 
        />
      )}

      {isClient && (
        <CancelledTransactionsTable
          cancelledTransactionsData={cancelledTransactionsData}
          applicationNumberTotals={applicationNumberTotals}
          handleTransactionEditClick={handleTransactionEditClick}
          handleTransactionUpdate={handleTransactionUpdate}
          handleTransactionCancelEdit={handleTransactionCancelEdit}
          handleTransactionDelete={handleTransactionDelete}
          editingTransactionId={editingTransactionId}
          editingTransactionData={editingTransactionData}
          setEditingTransactionData={setEditingTransactionData}
        />
      )}

      {isClient && (
        <>
          <div className={styles.sectionHeader}>
            <h2 id="transactions-list" className={styles.sectionTitle}>取引一覧</h2>
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
          <TransactionTable 
            knownTransactionsData={knownTransactionsData} 
            filteredTransactions={filteredTransactions} 
            editingTransactionId={editingTransactionId} 
            editingTransactionData={editingTransactionData} 
            applicationNumberTotals={applicationNumberTotals} 
            handleTransactionEditClick={handleTransactionEditClick} 
            handleTransactionUpdate={handleTransactionUpdate} 
            handleTransactionCancelEdit={handleTransactionCancelEdit} 
            handleTransactionDelete={handleTransactionDelete} 
            setEditingTransactionData={setEditingTransactionData} 
          />
        </>
      )}

      {isClient && (
        <MarketingMetricsTable marketingMetrics={marketingMetrics} />
      )}

      {isClient && (
        <div className={styles.globalMenu}>
          <a href="#payment-summary">決済</a>
          <a href="#manual-slips">伝票入力</a>
          <a href="#cash-calculator">現金計算</a>
          <a href="#actual-sales-calculator">実売上計算</a>
          <a href="#unknown-transactions">不明取引</a>
          <a href="#transactions-list">取引一覧</a>
          <a href="#marketing-metrics">マーケ指標</a>
          <button onClick={() => setShowCompletionPopup(true)} className={styles.completeButton}>完了</button>
        </div>
      )}

      {showCompletionPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowCompletionPopup(false)}>
          <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.sectionTitle}>スプレッドシート用にコピー</h2>
            <div className={styles.copyButtonsContainer}>
              <button onClick={handleCopyAllDataToClipboard} className={`${styles.clipboardButton} ${styles.copyAllButton}`}>
                全てをコピー
              </button>
              <button onClick={handleCopyPaymentSummary} className={styles.clipboardButton}>
                決済サマリーをコピー
              </button>
              <button onClick={() => navigator.clipboard.writeText(getMerchandiseSlipsTsv()).then(() => alert('伝票一覧 (物販) がクリップボードにコピーされました。')).catch(err => console.error('伝票一覧 (物販) のコピーに失敗しました:', err))} className={styles.clipboardButton}>
                伝票一覧 (物販) をコピー
              </button>
              <button onClick={handleCopyToClipboard} className={styles.clipboardButton}>
                取引一覧をコピー
              </button>
              <button onClick={handleCopyMarketingMetrics} className={styles.clipboardButton}>
                マーケティング指標をコピー
              </button>
            </div>
            <button onClick={() => setShowCompletionPopup(false)} className={styles.closeButton}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}