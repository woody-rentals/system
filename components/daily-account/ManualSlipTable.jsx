'use client';
import { paymentToolOptions } from '@/data/daily-account/paymentTools.js';
import styles from '@/app/daily-account/page.module.scss';

export default function ManualSlipTable({ 
  manualSlips, 
  editingSlipId, 
  editingSlipData, 
  handleEditClick, 
  handleUpdateSlip, 
  handleCancelEdit, 
  handleDeleteSlip, 
  setEditingSlipData 
}) {
  if (manualSlips.length === 0) return null;

  const renderSlipRow = (slip) => (
    <tr key={slip.id}>
      {editingSlipId === slip.id ? (
        <>
          <td><input type="text" value={editingSlipData.slipNumber} onChange={(e) => setEditingSlipData({...editingSlipData, slipNumber: e.target.value})} className={styles.tableInput} /></td>
          <td><input type="number" value={editingSlipData.amount} onChange={(e) => setEditingSlipData({...editingSlipData, amount: parseFloat(e.target.value) || 0})} className={styles.tableInput} /></td>
          <td><select value={editingSlipData.paymentTool} onChange={(e) => setEditingSlipData({...editingSlipData, paymentTool: e.target.value})} className={styles.tableSelect}>{paymentToolOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></td>
          <td><input type="text" value={editingSlipData.memo} onChange={(e) => setEditingSlipData({...editingSlipData, memo: e.target.value})} className={styles.tableInput} /></td>
          <td><input type="text" value={editingSlipData.name} onChange={(e) => setEditingSlipData({...editingSlipData, name: e.target.value})} className={styles.tableInput} /></td>
          <td>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={editingSlipData.type === '物販'}
                onChange={() => setEditingSlipData(prev => ({ ...prev, type: prev.type === '一般' ? '物販' : '一般' }))}
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.toggleLabel}>{editingSlipData.type}</span>
          </td>
          <td className={styles.actionsCell}>
            <button type="button" onClick={handleUpdateSlip} className={`${styles.tableButton} ${styles.saveButton}`}>保存</button>
            <button type="button" onClick={handleCancelEdit} className={`${styles.tableButton} ${styles.cancelButton}`}>キャンセル</button>
          </td>
        </>
      ) : (
        <>
          <td>{slip.slipNumber}</td><td>{slip.amount.toLocaleString()}円</td><td>{slip.paymentTool}</td><td>{slip.memo}</td><td>{slip.name}</td><td>{slip.type}</td>
          <td className={styles.actionsCell}>
            <button type="button" onClick={() => handleEditClick(slip)} className={styles.tableButton}>編集</button>
            <button type="button" onClick={() => handleDeleteSlip(slip.id)} className={`${styles.tableButton} ${styles.deleteButton}`}>削除</button>
          </td>
        </>
      )}
    </tr>
  );

  const generalSlips = manualSlips.filter(slip => slip.type === '一般');
  const merchandiseSlips = manualSlips.filter(slip => slip.type === '物販');

  return (
    <>
      {generalSlips.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>伝票一覧 (一般)</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th>伝票番号</th><th>金額</th><th>決済ツール</th><th>内容・メモ</th><th>名前</th><th>種別</th><th>操作</th></tr></thead>
              <tbody>{generalSlips.map(renderSlipRow)}</tbody>
            </table>
          </div>
        </>
      )}

      {merchandiseSlips.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>伝票一覧 (物販)</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th>伝票番号</th><th>金額</th><th>決済ツール</th><th>内容・メモ</th><th>名前</th><th>種別</th><th>操作</th></tr></thead>
              <tbody>{merchandiseSlips.map(renderSlipRow)}</tbody>
              <tfoot>
                <tr>
                  <td colSpan="1"><strong>合計</strong></td>
                  <td><strong>{merchandiseSlips.reduce((sum, slip) => sum + slip.amount, 0).toLocaleString()}円</strong></td>
                  <td colSpan="5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  );
}