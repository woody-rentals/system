'use client';
import styles from '@/app/daily-account/page.module.scss';

export default function AttentionStatusTransactionsTable({ 
  attentionStatusData, 
  applicationNumberTotals, 
  handleDeleteUnknownItem 
}) {
  const handleDeleteWithConfirmation = (index) => {
    if (window.confirm('この取引を削除してもよろしいですか？')) {
      handleDeleteUnknownItem(index);
    }
  };
  if (attentionStatusData.length === 0) return null;

  return (
    <>
      <h2 id="attention-status-transactions" className={styles.sectionTitle}>注意するステータスの取引</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead><tr><th>申込番号</th><th>枝番</th><th>お名前</th><th>金額</th><th>申込番号合計</th><th className={styles.paymentToolColumn}>決済ツール</th><th>ステータス</th><th>貸出日</th><th>貸出店舗</th><th style={{minWidth: '15rem'}}>メモ</th><th>決済時間</th><th>貸出日時</th><th>決済方法</th><th>プロモコード</th><th>窓口</th><th>変動価格</th><th>操作</th></tr></thead>
          <tbody>
            {attentionStatusData.map((item, index) => (
              <tr key={index}>
                <td>{item.申込番号}</td><td>{item.枝番}</td><td>{item.お名前}</td><td className={styles.amountCell}>{item.金額.toLocaleString()}円</td>
                <td>{item.枝番 === '1' && applicationNumberTotals[item.申込番号] ? applicationNumberTotals[item.申込番号].toLocaleString() + '円' : ''}</td>
                <td className={styles.paymentToolColumn}>{item['決済ツール名'] || ''}</td>
                <td>{item.status || item['ステータス'] || ''}</td><td className={styles.dateCell}>{item.貸出日}</td><td className={styles.shopCell}>{item.貸出店舗}</td><td className={styles.memoCell} style={{minWidth: '15rem'}}>{item.メモ}</td><td>{item.決済時間}</td><td>{item.貸出日時}</td><td>{item.決済方法}</td><td>{item.プロモコード}</td><td>{item.窓口}</td><td>{item.変動価格}</td>
                <td className={styles.actionsCell}><button type="button" onClick={() => handleDeleteWithConfirmation(index)} className={`${styles.tableButton} ${styles.deleteButton}`}>削除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
