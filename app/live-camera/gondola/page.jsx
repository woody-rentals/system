'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { liveCamera } from '@/data/live-camera/liveCamera';
import styles from './liveGondola.module.scss';
import WeatherDisplay from '@/components/live-camera/WeatherDisplay';
import WindInfo from '@/components/live-camera/WindInfo';
import GetWindowWidth from '@/utils/GetWindowWidth';

export default function LiveGondola() {
  const [data, setData] = useState(null); // 全体データ
  const [latestCameraImage, setLatestCameraImage] = useState(null); // 最後の画像のパス
  const [error, setError] = useState(null);

  const cameraTitle = liveCamera.happo.title;
  const resortId = liveCamera.happo.resortId;
  const cameraId = liveCamera.happo.cameraId;
  const key = liveCamera.happo.key;


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
      const response = await fetch(`https://skiday.app/api/v1/resorts/${resortId}/${cameraId}/embed?api_key=${key}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      if (result.camera_images && result.camera_images.length > 0) {
        const lastImage = result.camera_images[result.camera_images.length - 1]; // 最後の画像を取得
        setLatestCameraImage(lastImage.image_path); // 画像パスをセット
      }
    } catch (err) {
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



  console.log(data, 'data');


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
                {[0,1,2].map((i) => (
                    <div className={styles.future} key={i}>
                    <div className={styles.futureTitle}>
                      <h3>1day later</h3>
                    </div>
                    <div className={styles.futureInfo}>
                      <WeatherDisplay weatherData={todayWeather} iconSize={{width: vw5, height: vw5}}/>
                      <div className={styles.futurerTemp}>-4℃ - 2℃</div>
                      <div className={styles.futurerSnow}><Image width={vw5} height={vw5} src={'/svg/weather/snow-title.svg'} alt={'snow icon'} />40<span>cm</span></div>
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
                   <WeatherDisplay weatherData={todayWeather}/>
                   <div className={styles.todayTemp}>-4℃</div>
                    <WindInfo weatherData={todayWeather} iconSize={{width: 30, height: 30}} />
                </div>
                <div className={styles.todaySnowContainer}>
                  <div className={styles.todaySnowIcon}>
                    <Image width={50} height={50} src={'/svg/weather/snow-title.svg'} alt={'snow icon'} />
                  </div>
                  <div className={styles.todaySnow}>
                    <p>40cm</p>
                    <span>morning</span>
                  </div>
                  <div className={styles.todaySnow}>
                    <p>40cm</p>
                    <span>after noon</span>
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
