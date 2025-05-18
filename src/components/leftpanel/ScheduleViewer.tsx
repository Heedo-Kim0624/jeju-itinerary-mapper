import React from 'react';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, Edit3, Trash2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
// import { toast } from 'sonner'; // This was an error, toast is not used here. If needed, import from 'sonner'

interface ScheduleViewerProps {
  itinerary?: ItineraryDay[];
  selectedDay?: number | null;
  onDaySelect?: (day: number) => void;
  onClose?: () => void;
  startDate?: Date;
  itineraryDay?: ItineraryDay | null; // Specific day's data if passed directly
  onEditPlace?: (placeId: string | number, day: number) => void; // Placeholder
  onRemovePlace?: (placeId: string | number, day: number) => void; // Placeholder
  onViewPlaceInfo?: (placeId: string | number) => void; // Placeholder
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  itinerary,
  selectedDay,
  onDaySelect,
  onClose,
  startDate = new Date(),
  itineraryDay, // if a specific day's itinerary is passed
  onEditPlace,
  onRemovePlace,
  onViewPlaceInfo,
}) => {

  const getDayDate = (dayOffset: number): Date => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + dayOffset -1); // day 1 is offset 0 from startDate
    return newDate;
  };

  const currentDayToDisplay = itineraryDay || (selectedDay !== null && itinerary ? 
    itinerary.find(d => d.day === selectedDay) : null);

  if (!currentDayToDisplay) {
    return (
      <div className="p-4 text-center text-gray-500">
        {itinerary && itinerary.length > 0 ? '날짜를 선택해주세요.' : '표시할 일정이 없습니다.'}
      </div>
    );
  }
  
  const dayDate = getDayDate(currentDayToDisplay.day);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Day {currentDayToDisplay.day}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(dayDate, 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
            </p>
          </div>
          {onClose && (
             <Button variant="ghost" size="sm" onClick={onClose}>닫기</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-280px)]"> {/* Adjust height as needed */}
          <Accordion type="single" collapsible className="w-full">
            {currentDayToDisplay.places && currentDayToDisplay.places.length > 0 ? (
              currentDayToDisplay.places.map((p, index) => (
                <AccordionItem value={`item-${index}`} key={p.id || index} className="border-b last:border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 w-full text-left">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{p.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {p.start_time && p.end_time 
                            ? `${p.start_time.substring(0,5)} - ${p.end_time.substring(0,5)}` 
                            : '시간 미정'}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {p.start_time && p.end_time 
                            ? `예정 시간: ${p.start_time.substring(0,5)} ~ ${p.end_time.substring(0,5)}`
                            : '방문 시간: 미정'}
                          {p.duration && ` (예상 소요: ${p.duration}분)`}
                        </span>
                      </div>
                       {p.address_name && ( // Use address_name instead of formatted_address
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{p.address_name}</span>
                        </div>
                      )}
                      {p.memo && (
                        <p className="italic text-gray-500 dark:text-gray-400">메모: {p.memo}</p>
                      )}
                    </div>
                    {/* Action buttons (optional) */}
                    <div className="mt-3 flex space-x-2">
                      {onViewPlaceInfo && (
                        <Button variant="outline" size="xs" onClick={() => onViewPlaceInfo(p.id)}>
                          <Info className="h-3 w-3 mr-1" /> 정보
                        </Button>
                      )}
                       {onEditPlace && (
                        <Button variant="outline" size="xs" onClick={() => onEditPlace(p.id, currentDayToDisplay.day)}>
                           <Edit3 className="h-3 w-3 mr-1" /> 수정
                        </Button>
                      )}
                      {onRemovePlace && (
                        <Button variant="destructive" size="xs" onClick={() => onRemovePlace(p.id, currentDayToDisplay.day)}>
                           <Trash2 className="h-3 w-3 mr-1" /> 삭제
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                이 날짜에 추가된 장소가 없습니다.
              </div>
            )}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ScheduleViewer;
