import React, { useState } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/types/itinerary';

interface ScheduleGeneratorProps {
  selectedPlaces: Place[];
  onItineraryCreated: (schedule: ItineraryDay[]) => void;
  onClose: () => void;
  setItinerary: (itinerary: ItineraryDay[]) => void;
  createItinerary: (places: Place[], days: number, startTime?: string, endTime?: string) => Promise<ItineraryDay[]>;
  onSetShowItinerary: (show: boolean) => void;
}

const ScheduleGenerator = ({ 
  selectedPlaces, 
  onItineraryCreated, 
  onClose,
  setItinerary,
  createItinerary,
  onSetShowItinerary
}) => {
  const [dayCount, setDayCount] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleApplyOptimization = async () => {
    if (!selectedPlaces || selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다.");
      return;
    }
    
    if (dayCount <= 0) {
      toast.error("일정 일수는 1 이상이어야 합니다.");
      return;
    }
    
    try {
      setIsOptimizing(true);
      
      const timeSettings = {
        startTime: startTime || "09:00",
        endTime: endTime || "21:00"
      };
      
      // 일정 최적화 함수 호출
      const optimizedSchedule = await createItinerary(
        selectedPlaces,
        dayCount,
        timeSettings.startTime,
        timeSettings.endTime
      );
      
      // 비동기 처리 결과 확인
      if (!optimizedSchedule || optimizedSchedule.length === 0) {
        toast.error("일정 최적화에 실패했습니다.");
        return;
      }
      
      // 상태 업데이트
      setItinerary(optimizedSchedule);
      toast.success(`${optimizedSchedule.length}일 최적화된 일정이 생성되었습니다!`);
      
      // 콜백 함수 호출 (있는 경우)
      if (onItineraryCreated) {
        onItineraryCreated(optimizedSchedule);
      }
      
    } catch (error) {
      console.error("일정 최적화 중 오류 발생:", error);
      toast.error("일정 최적화 중 오류가 발생했습니다.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!selectedPlaces || selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다.");
      return;
    }
    
    if (dayCount <= 0) {
      toast.error("일정 일수는 1 이상이어야 합니다.");
      return;
    }
    
    try {
      setIsGenerating(true);
      
      const timeSettings = {
        startTime: startTime || "09:00",
        endTime: endTime || "21:00"
      };
      
      // 일정 생성 함수 호출
      const generatedSchedule = await createItinerary(
        selectedPlaces,
        dayCount,
        timeSettings.startTime,
        timeSettings.endTime
      );
      
      // 비동기 처리 결과 확인
      if (!generatedSchedule || generatedSchedule.length === 0) {
        toast.error("일정 생성에 실패했습니다.");
        return;
      }
      
      // 상태 업데이트
      setItinerary(generatedSchedule);
      toast.success(`${generatedSchedule.length}일 일정이 생성되었습니다!`);
      
      // 콜백 함수 호출 (있는 경우)
      if (onItineraryCreated) {
        onItineraryCreated(generatedSchedule);
      }
      
      // 자동으로 일정 표시 화면으로 전환
      onSetShowItinerary(true);
      
    } catch (error) {
      console.error("일정 생성 중 오류 발생:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDayCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setDayCount(value);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
  };
  
  const handleConfirmPreferences = async () => {
    if (!selectedPlaces || selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다.");
      return false;
    }
    
    if (dayCount <= 0) {
      toast.error("일정 일수는 1 이상이어야 합니다.");
      return false;
    }
    
    try {
      // 일정 생성 호출
      const schedule = await createItinerary(
        selectedPlaces,
        dayCount,
        startTime || "09:00",
        endTime || "21:00"
      );
      
      if (schedule && schedule.length > 0) {
        setItinerary(schedule);
        
        // 일정 생성 시 콜백 호출
        if (onItineraryCreated) {
          onItineraryCreated(schedule);
        }
        
        // 모달 닫기
        onClose();
        return true;
      } else {
        toast.error("일정 생성에 실패했습니다.");
        return false;
      }
    } catch (error) {
      console.error("일정 생성 중 오류 발생:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return false;
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">일정 생성 옵션</h2>
      
      <div className="mb-4">
        <label htmlFor="dayCount" className="block text-sm font-medium text-gray-700">
          여행 일수:
        </label>
        <input
          type="number"
          id="dayCount"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={dayCount}
          onChange={handleDayCountChange}
          min="1"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
          시작 시간:
        </label>
        <input
          type="time"
          id="startTime"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={startTime}
          onChange={handleStartTimeChange}
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
          종료 시간:
        </label>
        <input
          type="time"
          id="endTime"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={endTime}
          onChange={handleEndTimeChange}
        />
      </div>

      <div className="flex justify-between">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={handleCreateSchedule}
          disabled={isGenerating}
        >
          {isGenerating ? "생성 중..." : "일정 생성"}
        </button>

        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={handleApplyOptimization}
          disabled={isOptimizing}
        >
          {isOptimizing ? "최적화 중..." : "일정 최적화"}
        </button>
      </div>
      
      <div className="mt-4">
        <button
          className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          onClick={handleConfirmPreferences}
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default ScheduleGenerator;
