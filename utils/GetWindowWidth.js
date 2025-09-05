'use client'
import { useState, useEffect } from 'react';

export default function GetWindowWidth() {
    const [windowWidth, setWindowWidth] = useState(null); // 初期値を0に設定

    useEffect(() => {
      const handleResize = () => {
        if (typeof window !== 'undefined') {
          setWindowWidth(window.innerWidth);
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResize);
        handleResize(); // 初期値の設定

        return () => window.removeEventListener('resize', handleResize);
      }
    }, []);

    return windowWidth;
}
