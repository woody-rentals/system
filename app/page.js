import styles from "./page.module.scss";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
    <main className={styles.main}>
      <Link href='/daily-account'>
        日計計算
      </Link>
      <Link href='/live-camera'>
        ライブカメラ
      </Link>
    </main>
    
    </div>
  );
}
