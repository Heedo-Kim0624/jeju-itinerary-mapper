import { useState } from 'react';
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay } from './use-itinerary-creator';
import { toast } from 'sonner';
import axios from 'axios';

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };

  const generateItinerary = async (
    payload: SchedulePayload | null
  ): Promise<ItineraryDay[] | null> => {
    if (!payload) {
      toast.error('일정 생성을 위한 데이터가 부족합니다.');
      return null;
    }

    setIsGeneratingItinerary(true);

    try {
      console.log('[일정 생성] 서버에 일정 생성 요청 전송 중...');
      console.log('[일정 생성] 요청 페이로드:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/generate-itinerary`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[일정 생성] 서버 응답:', response.data);

      if (!response.data || !response.data.itinerary) {
        toast.error('서버에서 일정을 생성하지 못했습니다.');
        return null;
      }

      // Add detailed logging for routes
      console.log('--- 서버에서 가져온 경로 데이터 ---');
      response.data.routes.forEach((route: any, index: number) => {
        console.log(`날짜: ${route.date || `Day ${index+1}`}`);
        console.log(`  nodeIds: [${route.nodeIds.join(', ')}]`);
        console.log(`  총 노드 수: ${route.nodeIds.length}`);
        if (route.linkIds) {
          console.log(`  linkIds: [${route.linkIds.join(', ')}]`);
          console.log(`  총 링크 수: ${route.linkIds.length}`);
        }
        console.log(`  총 이동 거리: ${route.totalDistance || 'N/A'} m`);
        console.log('---');
      });

      const itinerary = response.data.itinerary.map((day: any, index: number) => {
        // Find corresponding route for this day
        const route = response.data.routes[index];
        const routeNodeIds = route?.nodeIds?.map(String) || [];
        const routeLinkIds = route?.linkIds?.map(String) || [];

        return {
          day: day.day,
          places: day.places.map((place: any) => ({
            ...place,
            id: String(place.id), // Ensure ID is a string
            arriveTime: place.arrive_time,
            departTime: place.depart_time,
            stayDuration: place.stay_duration,
            travelTimeToNext: place.travel_time_to_next,
            timeBlock: place.time_block,
          })),
          totalDistance: route?.totalDistance || 0,
          routeData: {
            nodeIds: routeNodeIds,
            linkIds: routeLinkIds
          }
        };
      });

      console.log('[일정 생성] 처리된 일정 결과:', itinerary);
      setItinerary(itinerary);
      setShowItinerary(true);
      setSelectedItineraryDay(1); // Set first day as selected

      toast.success('일정이 성공적으로 생성되었습니다!');
      return itinerary;
    } catch (error) {
      console.error('[일정 생성] 오류 발생:', error);
      toast.error('일정 생성 중 오류가 발생했습니다.');
      return null;
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary
  };
};
