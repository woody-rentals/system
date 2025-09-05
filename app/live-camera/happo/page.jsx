'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { liveCamera } from '@/data/live-camera/liveCamera';
import styles from './liveHappo.module.scss';
import WeatherDisplay from '@/components/live-camera/WeatherDisplay';
import WindInfo from '@/components/live-camera/WindInfo';
import GetWindowWidth from '@/utils/GetWindowWidth';

export default function LiveHappo() {
  const [data, setData] = useState(null); // データを管理
  const [latestCameraImage, setLatestCameraImage] = useState(null); // 画像URLを管理
  const [error, setError] = useState(null); // エラー管理
  const [currentIndex, setCurrentIndex] = useState(0); // カメラ切り替え用

  const cameras = Object.values(liveCamera); // カメラ情報を配列として取得
  const currentCamera = cameras[currentIndex]; // 現在のカメラを取得

  const key = currentCamera.key; // 環境変数のAPIキー
  const ref = useRef(null);
  const titleRef = useRef(null);

  const windowWidth = GetWindowWidth();
  const vw5 = windowWidth * 0.05;

  const dailyWeathers = data?.daily_weathers || [];
  const todayWeather = dailyWeathers[0] || {};
  const updatedTime = new Date().toLocaleString(); // 現在日時

  // データ取得関数
  const fetchFullData = async () => {
    try {
      const response = await fetch(
        `https://skiday.app/api/v1/resorts/${currentCamera?.resortId}/${currentCamera?.cameraId}/embed?api_key=${key}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      if (result.camera_images && result.camera_images.length > 0) {
        const lastImage = result.camera_images[result.camera_images.length - 1];
        setLatestCameraImage(lastImage.image_path);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    // 初回データ取得
    fetchFullData();

    // カメラ切り替え（5秒ごと）
    const switchInterval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % cameras.length);
    }, 50000);

    return () => clearInterval(switchInterval); // クリーンアップ
  }, [currentIndex]); // インデックスが変わるたびデータを取得

  return (
    <main>
      {error ? (
        <div className={styles.errorFetch}>Error: {error}</div>
      ) : data ? (
        <div className={styles.container}>
          <div className={styles.weather}>
            <div className={styles.topInfo}>
              <p>Snow Info by snow-forecast.com</p>
              <p>UPDATED: {updatedTime}</p>
            </div>
            <div className={styles.futureContainer}>
              {[0, 1, 2].map(i => (
                <div className={styles.future} key={i}>
                  <div className={styles.futureTitle}>
                    <h3>1day later</h3>
                  </div>
                  <div className={styles.futureInfo}>
                    <WeatherDisplay
                      weatherData={todayWeather}
                      iconSize={{ width: vw5, height: vw5 }}
                    />
                    <div className={styles.futurerTemp}>-4℃ - 2℃</div>
                    <div className={styles.futurerSnow}>
                      <Image
                        width={vw5}
                        height={vw5}
                        src={'/svg/weather/snow-title.svg'}
                        alt={'snow icon'}
                      />
                      40<span>cm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cameraTitle}>
              <h1 ref={titleRef}>{currentCamera?.title || 'No Title'}</h1>
            </div>

            <div className={styles.today} ref={ref}>
              <div className={styles.todayTitle}>
                <h3>Today&apos;s information</h3>
              </div>
              <div className={styles.todayInfo}>
                <WeatherDisplay weatherData={todayWeather} />
                <div className={styles.todayTemp}>-4℃</div>
                <WindInfo weatherData={todayWeather} iconSize={{ width: 30, height: 30 }} />
              </div>
              <div className={styles.todaySnowContainer}>
                <div className={styles.todaySnowIcon}>
                  <Image
                    width={50}
                    height={50}
                    src={'/svg/weather/snow-title.svg'}
                    alt={'snow icon'}
                  />
                </div>
                <div className={styles.todaySnow}>
                  <p>40cm</p>
                  <span>morning</span>
                </div>
                <div className={styles.todaySnow}>
                  <p>40cm</p>
                  <span>afternoon</span>
                </div>
                <div className={styles.todaySnow}>
                  <p>40cm</p>
                  <span>night</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.liveCamera}>
            {latestCameraImage ? (
              <div className={styles.cameraImgContainer}>
                <Image
                  src={latestCameraImage}
                  alt="最新画像"
                  fill
                  className={styles.cameraImg}
                />
              </div>
            ) : (
              <p>ライブ画像が取得できません</p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.loading}>Loading...</div>
      )}
    </main>
  );
}
