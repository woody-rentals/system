'use client';
import styles from '../app/page.module.scss';

export default function MarketingMetricsTable({ marketingMetrics }) {
  if (!marketingMetrics) return null;

  return (
    <>
      <h2 id="marketing-metrics" className={styles.sectionTitle}>マーケティング指標</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead><tr><th>指標</th><th>値</th></tr></thead>
          <tbody>
            <tr><td><strong>総売上</strong></td><td>{marketingMetrics.totalRevenue.toLocaleString()}円</td></tr>
            <tr><td><strong>グループ件数</strong></td><td>{marketingMetrics.totalTransactions}件</td></tr>
            <tr><td><strong>ユニーク顧客数</strong></td><td>{marketingMetrics.uniqueCustomers}人</td></tr>
            <tr><td><strong>グループ平均単価</strong></td><td>{Math.round(marketingMetrics.avgSpendPerTransaction).toLocaleString()}円</td></tr>
            <tr><td><strong>顧客平均単価</strong></td><td>{Math.round(marketingMetrics.avgSpendPerCustomer).toLocaleString()}円</td></tr>
            <tr><td><strong>平均年齢</strong></td><td>{marketingMetrics.averageAge > 0 ? marketingMetrics.averageAge.toFixed(1) + '歳' : 'N/A'}</td></tr>
            <tr><td><strong>12歳以下の顧客</strong></td><td>{`${marketingMetrics.customers12AndUnder}人 (${marketingMetrics.percentage12AndUnder.toFixed(1)}%)`}</td></tr>
            
            {Object.entries(marketingMetrics.paymentToolBreakdown).map(([tool, data]) => {
              const salesPercentage = marketingMetrics.totalRevenue > 0 ? (data.sales / marketingMetrics.totalRevenue * 100).toFixed(1) : 0;
              const countPercentage = marketingMetrics.uniqueCustomers > 0 ? (data.count / marketingMetrics.uniqueCustomers * 100).toFixed(1) : 0;
              return [
                <tr key={`${tool}-header`}><td colSpan="2"><strong>決済ツール別: {tool}</strong></td></tr>,
                <tr key={`${tool}-sales`}><td style={{ paddingLeft: '2em' }}>売上</td><td>{`${data.sales.toLocaleString()}円 (${salesPercentage}%)`}</td></tr>,
                <tr key={`${tool}-count`}><td style={{ paddingLeft: '2em' }}>件数</td><td>{`${data.count}人 (${countPercentage}%)`}</td></tr>
              ];
            })}

            {Object.entries(marketingMetrics.windowBreakdown).map(([window, count]) => {
              const percentage = marketingMetrics.uniqueCustomers > 0 ? (count / marketingMetrics.uniqueCustomers * 100).toFixed(1) : 0;
              return (
                <tr key={`${window}-count`}><td><strong>窓口別: ${window}</strong></td><td>{`${count}人 (${percentage}%)`}</td></tr>
              );
            })}

            <tr><td colSpan="2"><strong>国籍別</strong></td></tr>
            {Object.entries(marketingMetrics.nationalityBreakdown).map(([nationality, count]) => {
                const percentage = marketingMetrics.uniqueCustomers > 0 ? (count / marketingMetrics.uniqueCustomers * 100).toFixed(1) : 0;
                return (
                    <tr key={nationality}><td style={{ paddingLeft: '2em' }}>{nationality}</td><td>{`${count}人 (${percentage}%)`}</td></tr>
                );
            })}

            <tr><td colSpan="2"><strong>時間別決済</strong></td></tr>
            {Object.entries(marketingMetrics.hourlyBreakdown).map(([hour, count]) => {
                const percentage = marketingMetrics.uniqueCustomers > 0 ? (count / marketingMetrics.uniqueCustomers * 100).toFixed(1) : 0;
                return (
                    <tr key={hour}><td style={{ paddingLeft: '2em' }}>{hour}</td><td>{`${count}人 (${percentage}%)`}</td></tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}