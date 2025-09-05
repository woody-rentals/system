import styles from './page.module.scss';
import Link from 'next/link';

export default function LiveCamera() {
    return (
        <main className={styles.main}>
            <Link href='/live-camera/happo'>
                八方店
            </Link>
            <Link href='/live-camera/gondola'>
                ゴンドラ店
            </Link>

        </main>
    );
}