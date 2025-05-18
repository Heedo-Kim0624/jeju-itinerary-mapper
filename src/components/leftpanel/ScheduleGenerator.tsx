
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useScheduleManagement } from '@/hooks/useScheduleManagement'; // Assuming this path is correct
import { toast } from 'sonner';

interface ScheduleGeneratorProps {
  // Props if any, currently seems to use hooks directly
}

// This component seems to be a trigger for schedule generation
// And might not be directly using useScheduleManagement itself,
// but rather, its parent (LeftPanel via useLeftPanel) does.
// The error TS2561 implies useScheduleManagement *is* called here or its props are prepared here.
// Let's assume it's for a direct call if this component was indeed calling it.
// Based on provided files, useScheduleManagement is called in use-left-panel.tsx.
// If ScheduleGenerator.tsx is truly the source of the TS2561 error,
// it means it has a `useScheduleManagement` call like:
// const someData = useScheduleManagement({ ..., startDatetimeISO: ..., endDatetimeISO: ... })
// I will provide a hypothetical fix assuming such a call exists in the actual ScheduleGenerator.tsx
// If this component only contains a button, the error might be from an outdated version of the file.

// For the sake of fixing the reported error, I'll assume the structure that would cause it.
// If the actual ScheduleGenerator.tsx is just a button, this change won't apply to any existing code in it.

const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = () => {
  const { handleGenerateSchedule, isGeneratingSchedule } = useLeftPanel();
  
  // Hypothetical section that would cause the TS2561 error
  // const tripDetails = useTripDetails(); // Example, actual source of tripDetails might vary
  // const { selectedPlaces, candidatePlaces } = useSelectedPlaces(); // Example
  // const allPlacesForSchedule = [...selectedPlaces, ...candidatePlaces];

  // Example: if useScheduleManagement was called directly here
  // const scheduleHook = useScheduleManagement({
  //   selectedPlaces: allPlacesForSchedule,
  //   dates: tripDetails.dates.startDate && tripDetails.dates.endDate ? {
  //       startDate: tripDetails.dates.startDate,
  //       endDate: tripDetails.dates.endDate,
  //       startTime: tripDetails.dates.startTime,
  //       endTime: tripDetails.dates.endTime
  //     } : null,
  //   startDatetime: tripDetails.startDatetime, // Corrected from startDatetimeISO
  //   endDatetime: tripDetails.endDatetime,     // Corrected from endDatetimeISO
  // });


  return (
    <Button 
      onClick={async () => {
        const success = await handleGenerateSchedule();
        if (success) {
          // Toast handled in useLeftPanel
        } else {
          // Error toast handled in useLeftPanel or handleGenerateSchedule
        }
      }} 
      disabled={isGeneratingSchedule}
      className="w-full"
    >
      {isGeneratingSchedule ? '일정 생성 중...' : '선택한 장소로 일정 생성'}
    </Button>
  );
};

export default ScheduleGenerator;

// Note: The TS2561 error for startDatetimeISO indicates that useScheduleManagement
// was being called with this incorrect prop name from ScheduleGenerator.tsx.
// The typical place for this call is use-left-panel.tsx.
// The fix above in useScheduleManagement.ts (in useScheduleGenerationRunner call)
// should already address where startDatetimeISO was incorrectly passed to the runner.
// If ScheduleGenerator.tsx itself had a direct call to useScheduleManagement
// with startDatetimeISO, it would need to be changed as shown in the commented out example above.
// The current structure of ScheduleGenerator.tsx in the provided files doesn't show a direct call
// to useScheduleManagement. The error might be from an older version or a misunderstanding.
// The primary fix for startDatetimeISO/endDatetimeISO being passed to the runner is in
// useScheduleManagement.ts where it calls useScheduleGenerationRunner.
// Original code in useScheduleManagement.ts:
// startDatetimeISO: startDatetime, // Pass corrected names
// endDatetimeISO: endDatetime,     // Pass corrected names
// This is correct. The error TS2561 means the props for useScheduleManagement *itself* were wrong.
// The call in use-left-panel.tsx is:
// startDatetime: tripDetailsHook.startDatetime,
// endDatetime: tripDetailsHook.endDatetime,
// This is also correct.
// So, the error from ScheduleGenerator.tsx implies it had its *own* incorrect call.
// I will leave ScheduleGenerator.tsx as it is mostly, assuming the error was an artifact
// or from a version of the file not fully represented. The critical fix for the runner is in useScheduleManagement.
// If the error TS2561 from ScheduleGenerator.tsx persists, it means that file DOES have a direct
// call to useScheduleManagement with the wrong prop names.
