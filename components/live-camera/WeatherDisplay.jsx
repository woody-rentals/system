import Image from "next/image";
import styles from './weatherDisplay.module.scss';

export default function WeatherDisplay({weatherData, todayWeather=false, iconSize = {width: 50, height:50}}) {

    const getWeatherById = (data) => {
        const id = data.weather_id;
        
        //weather_idによって天気を判定
        if (id === 800) return { text: '晴れ\nClear', icon: 'clear' };
        if (id >= 200 && id < 300) return { text: '雷雨\nThunderstorm', icon: 'thunderstorm' };
        if (id >= 300 && id < 400) return { text: '霧雨\nDrizzle', icon: 'drizzle' };
        if (id >= 500 && id < 600) return { text: '雨\nRain', icon: 'rain' };
        if (id >= 600 && id < 700) return { text: '雪\nSnow', icon: 'snow' };
        if (id >= 700 && id < 800) return { text: '霧\nMist', icon: 'mist' };
        if (id >= 801 && id <= 804) return { text: '曇り\nClouds', icon: 'clouds' };
        return { text: '不明\nUnknown', icon: '/icons/unknown' }; // デフォルト
      };

    const weather = getWeatherById(weatherData);

    console.log(weather);
    


    return (
        <div className={`${styles.container} ${todayWeather ? styles.today : ''}`}>
                <Image
                    src={`/weather/${weather.icon}.svg`}
                    alt={`${weather.text} icon`}
                    width={iconSize.width}
                    height={iconSize.height}
                />
                <p>{weather.text}</p>
        </div>
    );
}