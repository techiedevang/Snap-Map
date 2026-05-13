import React, { useState } from 'react';
import './BeforeAfterSlider.css';

interface BeforeAfterSliderProps {
  beforeImg: string;
  afterImg: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImg, afterImg }) => {
  const [sliderPos, setSliderPos] = useState(50);

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  };

  return (
    <div
      className="slider-container"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      <div className="img-layer after-img">
        <img src={afterImg} alt="After" />
      </div>
      <div
        className="img-layer before-img"
        style={{ width: `${sliderPos}%` }}
      >
        <img src={beforeImg} alt="Before" />
      </div>
      <div
        className="slider-handle"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="slider-line"></div>
        <div className="slider-button">&lt;&gt;</div>
      </div>
      <div className="slider-labels">
        <span className="label before">Before</span>
        <span className="label after">After</span>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
