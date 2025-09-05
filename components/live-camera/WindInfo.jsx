import Image from "next/image";
import styles from './windInfo.module.scss';

export default function WindInfo({ weatherData, iconSize = {width: 30, height: 30}}) {

const windDegree = weatherData.wind.deg; // 角度を取得
const windSpeed = weatherData.wind.speed; // 風速を取得

// 風向きの角度によって方角を取得
  const getWindDirection = (degree) => {
    if (degree >= 337.5 || degree < 22.5) return 'North';
    if (degree >= 22.5 && degree < 67.5) return 'Northeast';
    if (degree >= 67.5 && degree < 112.5) return 'East';
    if (degree >= 112.5 && degree < 157.5) return 'Southeast';
    if (degree >= 157.5 && degree < 202.5) return 'South';
    if (degree >= 202.5 && degree < 247.5) return 'Southwest';
    if (degree >= 247.5 && degree < 292.5) return 'West';
    if (degree >= 292.5 && degree < 337.5) return 'Northwest';
    return '不明 Unknown'; // デフォルト
  };

    return (
        <div className={styles.container}> 
            <Image width={iconSize.width} height={iconSize.height} style={{rotate: `-${windDegree}deg`}} alt={'wind direction'} src={'/svg/weather/wind-arrow.svg'} />
            <div className={styles.info}>
              <span>{windSpeed}m/s</span>
              <span>{getWindDirection(windDegree)}</span>
            </div>
            
        </div>
    );
}