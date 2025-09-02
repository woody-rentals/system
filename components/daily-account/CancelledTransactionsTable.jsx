'use client';
import { paymentToolOptions } from '@/data/daily-account/paymentTools.js';
import styles from '@/app/daily-account/page.module.scss';

export default function CancelledTransactionsTable({ 
  cancelledTransactionsData, 
  applicationNumberTotals, 
  handleTransactionEditClick, 
  handleTransactionUpdate, 
  handleTransactionCancelEdit, 
  handleTransactionDelete, 
  editingTransactionId, 
  editingTransactionData,
  setEditingTransactionData
}) {
  if (cancelledTransactionsData.length === 0) return null;

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>ステータス:キャンセル</h2>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead><tr><th>申込番号</th><th>枝番</th><th>お名前</th><th>金額</th><th>申込番号合計</th><th>決済ツール</th><th>貸出日</th><th>貸出店舗</th><th>メモ</th><th>決済時間</th><th>貸出日時</th><th>決済方法</th><th>ステータス</th><th>プロモコード</th><th>窓口</th><th>変動価格</th><th>操作</th></tr></thead>
          <tbody>
            {cancelledTransactionsData.length > 0 ? (
              cancelledTransactionsData.map((item, index) => (
                <tr key={item.id || index} className={styles.cancelledRow}>
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
                      <td>{item.status}</td>
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
                      <td>{item.status}</td>
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
                <td colSpan="17" style={{ textAlign: 'center' }}>キャンセルされた取引はありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
