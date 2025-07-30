'use client';
import styles from '../app/page.module.scss';
import { paymentToolOptions } from '../data/paymentTools.js';

export default function ManualSlipForm({ 
  formInput, 
  setFormInput, 
  handleFormSubmit, 
  handleSaveManualSlipsToCsv, 
  processManualSlipsFile, 
  manualSlips, 
  isClient 
}) {
  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 id="manual-slips" className={styles.sectionTitle}>伝票入力</h2>
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
          <div className={styles.toggleSwitchContainer}>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={formInput.type === '物販'}
                onChange={() => setFormInput(prev => ({ ...prev, type: prev.type === '一般' ? '物販' : '一般' }))}
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.toggleLabel}>{formInput.type}</span>
          </div>
          <input name="slipNumber" value={formInput.slipNumber} onChange={(e) => setFormInput({...formInput, slipNumber: e.target.value})} placeholder="伝票番号" className={styles.formInputSingleRow} />
          <input name="amount" value={formInput.amount} onChange={(e) => setFormInput({...formInput, amount: parseFloat(e.target.value) || 0})} placeholder="金額" type="number" className={styles.formInputSingleRow} />
          <select name="paymentTool" value={formInput.paymentTool} onChange={(e) => setFormInput({...formInput, paymentTool: e.target.value})} className={styles.formSelectSingleRow}>{paymentToolOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
          <input name="memo" value={formInput.memo} onChange={(e) => setFormInput({...formInput, memo: e.target.value})} placeholder="内容・メモ" className={styles.formInputSingleRow} />
          <input name="name" value={formInput.name} onChange={(e) => setFormInput({...formInput, name: e.target.value})} placeholder="名前" className={styles.formInputSingleRow} />
          <div className={styles.formButtonsContainer}>
            <button type="submit" className={styles.formButtonSingleRow}>伝票を登録</button>
          </div>
      </form>
    </>
  );
}