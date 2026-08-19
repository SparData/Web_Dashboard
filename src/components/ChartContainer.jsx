import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function ChartContainer({ options, style }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Initialize chart
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current, {
        renderer: 'svg', // SVG renderer is faster for clean dashboard visuals
        useDirtyRect: true
      });
    }

    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  // Update chart options when they change
  useEffect(() => {
    if (chartInstance.current && options) {
      chartInstance.current.setOption({
        backgroundColor: 'transparent',
        textStyle: {
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
        },
        ...options
      }, true);
    }
  }, [options]);

  return (
    <div 
      ref={chartRef} 
      style={{ width: '100%', height: '100%', minHeight: '320px', ...style }} 
    />
  );
}
