'use client';
import { useState } from 'react';
import styles from '@/app/daily-account/page.module.scss';

export default function FileUpload({ processFile, uploadedFileName, error }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
      <div className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`} onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); processFile(e.dataTransfer.files[0]); }}>
        <p>ここにWasabiのCSVファイルをドラッグ＆ドロップ or</p>
        <input id="file-upload" type="file" accept=".csv" onChange={(e) => processFile(e.target.files[0])} className={styles.fileInput} />
        <label htmlFor="file-upload" className={styles.fileInputLabel}>ファイルを選択</label>
      </div>
      {uploadedFileName && <p className={styles.uploadedFileName}>読み込んだファイル名: {uploadedFileName}</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}
    </>
  );
}