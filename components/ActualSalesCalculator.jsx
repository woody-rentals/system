'use client';
import styles from '../app/page.module.scss';

export default function ActualSalesCalculator({ 
  paymentTableDisplayData, 
  actualSalesInput, 
  setActualSalesInput, 
  overallTotal, 
  parentCategoryActualSums, 
  showSubCategories, 
  setShowSubCategories 
}) {
  if (paymentTableDisplayData.length === 0) return null;

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 id="actual-sales-calculator" className={styles.sectionTitle}>実売上計算ツール</h2>
        <div className={styles.toggleSwitchContainer}>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={showSubCategories}
              onChange={() => setShowSubCategories(!showSubCategories)}
            />
            <span className={styles.slider}></span>
          </label>
          <span className={styles.toggleLabel}>小分類を表示</span>
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
                  <th>分類</th>
                  <th>データの金額</th>
                  <th>実売上額</th>
                  <th>項目合計</th>
                  <th>結果</th>
                </tr>
          </thead>
          <tbody>
            {(() => {
              let currentMainCategory = '';
              return paymentTableDisplayData.map((item, index) => {
                if (item.isTotalRow) {
                  currentMainCategory = item.大分類;
                }

                if (!showSubCategories && item.小分類) {
                  return null;
                }

                let key;
                if (item.大分類 && !item.中分類 && !item.小分類) {
                  key = item.大分類; // For top-level items like 'Cash' or other direct payment tools
                } else {
                  key = currentMainCategory + (item.中分類 ? `-${item.中分類}` : '') + (item.小分類 ? `-${item.小分類}` : '');
                }
                const calculatedAmount = item.合計売上金額 || 0;
                const inputAmount = parseFloat(actualSalesInput[key]) || 0;
                const itemTotalAmount = item.isTotalRow ? (parentCategoryActualSums[item.大分類] || 0) : inputAmount;
                const difference = itemTotalAmount - calculatedAmount;
                const isMatch = difference === 0;

                return (
                  <tr key={index} className={item.isSubTotalRow ? styles.middleCategoryRow : (item.小分類 && item.小分類 !== '' ? styles.subCategoryRow : '')}>
                    <td>{item.大分類}{item.中分類 ? ` - ${item.中分類}` : ''}{item.小分類 ? ` - ${item.小分類}` : ''}</td>
                    <td className={styles.amountCell}>{calculatedAmount.toLocaleString()}円</td>
                    <td>
                      {item.isTotalRow ? null : (
                        key === 'Cash' ? (
                          <span>{actualSalesInput[key] ? actualSalesInput[key].toLocaleString() + '円' : '-'}</span>
                        ) : (
                          <input
                            type="number"
                            value={actualSalesInput[key] || ''}
                            onChange={(e) => setActualSalesInput({ ...actualSalesInput, [key]: e.target.value })}
                            className={styles.formInputSingleRow}
                            disabled={key === 'Cash'}
                          />
                        )
                      )}
                    </td>
                    <td>
                      {item.isTotalRow ? `${(parentCategoryActualSums[item.大分類] || 0).toLocaleString()}円` : (
                        key === 'Cash' ? '' : ''
                      )}
                    </td>
                    <td>
                      {itemTotalAmount !== 0 && (
                      isMatch ? (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>一致</span>
                      ) : (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>
                          {difference > 0 ? `+${difference.toLocaleString()}円` : `${difference.toLocaleString()}円`} ({difference > 0 ? '多い' : '少ない'})
                        </span>
                      )
                    )}
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>合計</strong></td>
              <td className={styles.amountCell}><strong>{overallTotal.toLocaleString()}円</strong></td>
              <td className={styles.amountCell}><strong>{Object.entries(actualSalesInput).reduce((sum, [key, val]) => {
                const item = paymentTableDisplayData.find(item => {
                  let currentMainCategory = '';
                  if (item.isTotalRow) {
                    currentMainCategory = item.大分類;
                  }
                  const itemKey = currentMainCategory + (item.中分類 ? `-${item.中分類}` : '') + (item.小分類 ? `-${item.小分類}` : '');
                  return itemKey === key;
                });
                if (item && item.小分類) {
                  return sum;
                }
                return sum + (parseFloat(val) || 0);
              }, 0).toLocaleString()}円</strong></td>
              <td></td>
              <td>
                {(() => {
                  const totalInput = Object.values(actualSalesInput).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                  const totalDifference = totalInput - overallTotal;
                  if (totalDifference === 0) {
                    return <span style={{ color: 'green', fontWeight: 'bold' }}>一致</span>;
                  } else {
                    return (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>
                        {totalDifference > 0 ? `+${totalDifference.toLocaleString()}円` : `${totalDifference.toLocaleString()}円`} ({totalDifference > 0 ? '多い' : '少ない'})
                      </span>
                    );
                  }
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}