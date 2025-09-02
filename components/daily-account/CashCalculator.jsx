'use client';
import styles from '@/app/daily-account/page.module.scss';

export default function CashCalculator({ 
  cashCounts, 
  registerAmount, 
  finalCashTotal, 
  handleCashCountChange, 
  handleRegisterAmountChange 
}) {
  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 id="cash-calculator" className={styles.sectionTitle}>現金計算ツール</h2>
        <div className={styles.registerAmountContainer}>
          <label htmlFor="registerAmountInput">レジ金設定:</label>
          <input
            id="registerAmountInput"
            type="number"
            value={registerAmount}
            onChange={handleRegisterAmountChange}
            className={styles.formInputSingleRow}
            min="0"
          />円
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={`${styles.table} ${styles.cashCalculatorTable}`}>
          <thead>
            <tr>
              <th>金種</th>
              <th>枚数</th>
              <th>金額</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(cashCounts)
              .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort by denomination descending
              .map(([denomination, count]) => (
              <tr key={denomination}>
                <td>{denomination}円</td>
                <td>
                  <input
                    type="number"
                    value={count === 0 ? '' : count}
                    onChange={(e) => handleCashCountChange(denomination, e.target.value)}
                    className={styles.formInputSingleRow}
                    min="0"
                  />
                </td>
                <td className={styles.amountCell}>{(parseInt(denomination) * count).toLocaleString()}円</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>合計</strong></td>
              <td></td>
              <td className={styles.amountCell}><strong>{finalCashTotal.toLocaleString()}円</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}