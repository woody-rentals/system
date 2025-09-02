'use client';
import styles from '@/app/daily-account/page.module.scss';

export default function PaymentSummaryTable({ paymentTableDisplayData, overallTotal }) {
  if (paymentTableDisplayData.length === 0) return null;

  return (
    <>
      <h2 id="payment-summary" className={styles.sectionTitle}>決済</h2>
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
  );
}