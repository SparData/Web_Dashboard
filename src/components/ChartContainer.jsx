import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  TitleComponent
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';

// Register only the chart components and renderers needed
echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  TitleComponent,
  SVGRenderer,
  CanvasRenderer
]);

export default function ChartContainer({ options, style }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, {
      renderer: 'svg',
      useDirtyRect: true
    });

    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for accurate container dimension tracking
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && chartRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (chartInstance.current) {
          chartInstance.current.resize();
        }
      });
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  // Update chart options when they change (using lazyUpdate and notMerge: false for performance)
  useEffect(() => {
    if (chartInstance.current && options) {
      chartInstance.current.setOption({
        backgroundColor: 'transparent',
        textStyle: {
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
        },
        ...options
      }, { notMerge: true, lazyUpdate: true });
    }
  }, [options]);

  return (
    <div 
      ref={chartRef} 
      style={{ width: '100%', height: '100%', minHeight: '320px', ...style }} 
    />
  );
}
