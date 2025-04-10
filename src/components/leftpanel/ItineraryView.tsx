
import React, { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { categoryColors, getCategoryName } from '@/utils/categoryColors';
import type { Place, ItineraryDay } from '@/types/supabase';

interface ItineraryViewProps {
  itinerary: ItineraryDay[];
  startDate: Date;
  onSelectDay: (day: number) => void;
  selectedDay: number | null;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  startDate,
  onSelectDay,
  selectedDay,
}) => {
  const handleDayClick = (day: number) => {
    onSelectDay(day);
  };

  const getDateForDay = (day: number) => {
    const date = addDays(new Date(startDate), day - 1);
    return format(date, 'yyyy년 MM월 dd일');
  };

  const getDayOfWeek = (day: number) => {
    const date = addDays(new Date(startDate), day - 1);
    return format(date, 'EEEE', { locale: ko });
  };

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>일정이 생성되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex overflow-x-auto pb-2 mb-4">
        {itinerary.map((day) => (
          <Button
            key={day.day}
            variant={selectedDay === day.day ? "default" : "outline"}
            className="mr-2 whitespace-nowrap"
            onClick={() => handleDayClick(day.day)}
          >
            Day {day.day}
          </Button>
        ))}
      </div>
      
      {selectedDay && (
        <div className="flex-1">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{getDateForDay(selectedDay)} ({getDayOfWeek(selectedDay)})</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span>총 이동거리: {itinerary.find(day => day.day === selectedDay)?.totalDistance.toFixed(1)} km</span>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-4 relative">
              <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200 z-0"></div>
              
              {itinerary
                .find(day => day.day === selectedDay)
                ?.places.map((place, index) => (
                  <div key={place.id} className="relative z-10 ml-16 bg-white rounded-lg p-3 border animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div 
                      className="absolute left-[-32px] w-12 h-12 rounded-full flex items-center justify-center font-bold text-white z-10" 
                      style={{ backgroundColor: categoryColors[place.category]?.marker || '#1F1F1F' }}
                    >
                      {index + 1}
                    </div>
                    
                    <div className="pl-3">
                      <h3 className="font-medium">{place.name}</h3>
                      
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{place.address}</span>
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{place.operatingHours}</span>
                      </div>
                      
                      <div className="mt-2">
                        <span 
                          className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[place.category]?.bg || 'bg-gray-100'} ${categoryColors[place.category]?.text || 'text-gray-800'}`}
                        >
                          {getCategoryName(place.category)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ItineraryView;
