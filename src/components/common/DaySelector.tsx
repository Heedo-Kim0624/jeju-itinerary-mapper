
import React from 'react';
import styles from './DaySelector.module.css';
import type { ItineraryDay } from '@/types/core'; // Assuming ItineraryDay has 'day' and 'date'

interface DaySelectorProps {
  itinerary: ItineraryDay[] | null; // Changed to ItineraryDay[] based on typical usage
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ itinerary, selectedDay, onSelectDay }) => {
  if (!itinerary || itinerary.length === 0) {
    return null;
  }
  
  return (
    <div className={styles.daySelector}>
      {itinerary.map((dayItem) => ( // Changed 'day' to 'dayItem' to avoid conflict
        <button
          key={dayItem.day}
          className={`${styles.dayButton} ${selectedDay === dayItem.day ? styles.selected : ''}`}
          onClick={() => onSelectDay(dayItem.day)}
        >
          {dayItem.day}일차
          {dayItem.date && <span className={styles.dayDate}>{dayItem.date}</span>}
        </button>
      ))}
    </div>
  );
};

export default DaySelector;
