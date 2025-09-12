'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { liveCamera } from '@/data/live-camera/liveCamera';
import styles from './liveCamera.module.scss';
import WeatherDisplay from '@/components/live-camera/WeatherDisplay';
import WindInfo from '@/components/live-camera/WindInfo';
import GetWindowWidth from '@/utils/GetWindowWidth';

export default function LiveCamera() {
  const [data, setData] = useState(null); // 全体データ
  const [latestCameraImage, setLatestCameraImage] = useState(null); // 最後の画像のパス
  const [error, setError] = useState(null);

  const selectedCamera = 'iwatake'; // 使用するカメラを選択（'test', 'happo', 'iwatake', 'hakuba47', 'goryu', 'tsugaike'）
  const cameraTitle = liveCamera[selectedCamera].title;
  const resortId = liveCamera[selectedCamera].resortId;
  const cameraId = liveCamera[selectedCamera].cameraId;
  const key = liveCamera[selectedCamera].key;


  const ref = useRef(null);

  const windowWidth = GetWindowWidth();
  const vw5 = windowWidth * 0.05; //5vw

  const dailyWeathers = data?.daily_weathers || []; //週間天気 今日を含む1週間
  const todayWeather = dailyWeathers[0] || {}; //今日の1日の天気
  const tomorrowWeather = dailyWeathers[1] || {}; //明日の1日の天気
  const hourlyWeathers = data?.hourly_weathers || []; //今日の今後3時間ごとの天気
  const displayName = data?.display_name || ''; //リゾート名

  const titleRef = useRef(null);

  // 全体データの更新
  const fetchFullData = async () => {
    try {
      const apiUrl = `https://skiday.app/api/v1/resorts/${resortId}/${cameraId}/embed?api_key=${key}`;
      const response = await fetch(apiUrl);
      
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
      
      // ネットワークエラーかAPIエラーかを判別
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('This appears to be a network/CORS error');
      }
      
      setError(err.message);
    }
  };

  useEffect(() => {
    // 初回データ取得
    fetchFullData();

    // 全体データの15分ごと更新
    const dataInterval = setInterval(() => {
      fetchFullData();
    }, 15 * 60 * 1000); // 15分
    
    // クリーンアップ
    return () => clearInterval(dataInterval);
  }, []); 

  const updatedTime = '2021-09-01 12:00:00'; // 更新日時



  return (
    <main>
      {error ? (
        <div className={styles.errorFetch}>Error: {error}</div>
      ) : data ? (
        <div className={styles.container}>
          <div className={styles.weather}>
            <div className={styles.topInfo}>
              <p>Snow Info by <strong>snow-forecast.com</strong></p>
              <p>UPDATED: {updatedTime}</p>
            </div>
              <div className={styles.futureContainer}>
                {[0,1,2].map((i) => (
                    <div className={styles.future} key={i}>
                    <div className={styles.futureTitle}>
                      <h3>{i === 0 ? 'Tomorrow' : `${i + 1} days later`}</h3>
                    </div>
                    <div className={styles.futureInfo}>
                      <WeatherDisplay weatherData={todayWeather} iconSize={{width: vw5, height: vw5}}/>
                      <div className={styles.futureTemp}>-4℃ - 2℃</div>
                      <div className={styles.futureSnow}><Image width={vw5} height={vw5} src={'/weather/snow-title.svg'} alt={'snow icon'} /><p>40</p></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.cameraTitle}>
                {/* <h1>{displayName}</h1> */}
                <h1 ref={titleRef}>{cameraTitle}</h1>
              </div> 
              

              <div className={styles.today} ref={ref} >
                <div className={styles.todayTitle}>
                  <h3>Today&apos;s information</h3>
                </div>
                <div className={styles.todayInfo}>
                   <WeatherDisplay todayWeather={true} weatherData={todayWeather} iconSize={{width: vw5, height: vw5}}/>
                   <div className={styles.todayTemp}>-4℃</div>
                    <WindInfo weatherData={todayWeather} iconSize={{width: 60, height: 60}} />
                </div>
                <div className={styles.todaySnowContainer}>
                  <div className={styles.todaySnowIcon}>
                    <Image width={vw5} height={vw5} src={'/weather/snow-title.svg'} alt={'snow icon'} />
                  </div>
                  <div className={styles.todaySnow}>
                    <p>40<span>cm</span></p>
                    <span>morning</span>
                  </div>
                  <div className={styles.todaySnow}>
                    <p>40<span>cm</span></p>
                    <span>after noon</span>
                  </div>
                  <div className={styles.todaySnow}>
                    <p>40<span>cm</span></p>
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
            <div className={styles.topLabel}>
              powerd by <strong>SKIDAY</strong>
            </div>
            <div className={styles.bottomLabel}>
              <p>View live images on your phone</p>
              <p>ライブ画像をスマホで見る</p>
              <Image width={70} height={70} src={'/images/qr-skiday.png'} alt={'skiday QR code'} />
            </div>

          </div>
      </div>
      ) : (
        <div className={styles.loading}>Loading...</div>
      )}
    </main>
  );
}
