
import React, { useState, useRef } from 'react';
import Map from '@/components/rightpanel/Map';
import SearchSection from '@/components/jeju/SearchSection';
import CategorySelector from '@/components/jeju/CategorySelector';
import ContentSection from '@/components/jeju/ContentSection';
import MobileStepView from '@/components/jeju/MobileStepView';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useItinerary } from '@/hooks/use-itinerary';
import { usePlaces } from '@/hooks/use-places';

const Index: React.FC = () => {
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  }>({
    startDate: null,
    endDate: null,
    startTime: '10:00',
    endTime: '18:00',
  });
  
  const [promptText, setPromptText] = useState<string>('');
  const [mobileStep, setMobileStep] = useState<number>(1);
  const [isPanelHidden, setIsPanelHidden] = useState<boolean>(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const { isMobile, isPortrait } = useIsMobile();
  
  const {
    places,
    filteredPlaces,
    selectedCategory,
    selectedPlace,
    selectedPlaces,
    loading,
    hasSearched,
    hasCategorySelected,
    currentPage,
    handleCategoryClick,
    handlePlaceSelect,
    handleSearch,
    handlePageChange
  } = usePlaces();
  
  const {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  // Calculate derived state
  const isDateSelectionComplete = dateRange.startDate !== null && dateRange.endDate !== null;
  const isSearchComplete = hasSearched;
  const isCategorySelectionComplete = hasSearched && (selectedCategory !== null || hasCategorySelected);
  const isPlaceListReady = isCategorySelectionComplete && filteredPlaces.length > 0;
  
  // Pagination
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
  
  // Event handlers
  const handleDatesSelected = (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => {
    setDateRange({
      startDate: dates.startDate,
      endDate: dates.endDate,
      startTime: dates.startTime,
      endTime: dates.endTime,
    });
  };
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptText(e.target.value);
  };
  
  const handleSearchClick = () => {
    handleSearch(promptText, isDateSelectionComplete);
  };
  
  const handleCreateItinerary = () => {
    if (!isPlaceListReady) {
      toast.error('먼저 장소 목록을 확인해주세요');
      return;
    }
    
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('여행 날짜를 먼저 선택해주세요');
      return;
    }
    
    setLoading(true);
    
    setTimeout(() => {
      const placesToUse = selectedPlaces.length > 0 ? selectedPlaces : filteredPlaces;
      
      generateItinerary(
        placesToUse,
        dateRange.startDate,
        dateRange.endDate,
        dateRange.startTime,
        dateRange.endTime
      );
      
      setLoading(false);
      toast.success('일정이 생성되었습니다');
    }, 1500);
  };
  
  const goToNextStep = () => {
    if (mobileStep < 5) {
      setMobileStep(prevStep => prevStep + 1);
    }
  };
  
  const goToPrevStep = () => {
    if (mobileStep > 1) {
      setMobileStep(prevStep => prevStep - 1);
    }
  };
  
  const togglePanel = () => {
    setIsPanelHidden(!isPanelHidden);
  };

  // Render based on device orientation
  if (isMobile && isPortrait) {
    return (
      <MobileStepView
        mobileStep={mobileStep}
        dateRange={dateRange}
        promptText={promptText}
        selectedCategory={selectedCategory}
        filteredPlaces={filteredPlaces}
        loading={loading}
        selectedPlace={selectedPlace}
        currentPage={currentPage}
        totalPages={totalPages}
        itinerary={itinerary}
        selectedItineraryDay={selectedItineraryDay}
        isPanelHidden={isPanelHidden}
        isDateSelectionComplete={isDateSelectionComplete}
        isSearchComplete={isSearchComplete}
        isPlaceListReady={isPlaceListReady}
        onDatesSelected={handleDatesSelected}
        onPromptChange={handlePromptChange}
        onCategoryClick={handleCategoryClick}
        onSelectPlace={handlePlaceSelect}
        onPageChange={handlePageChange}
        onSearch={handleSearchClick}
        onCreateItinerary={handleCreateItinerary}
        onSelectItineraryDay={handleSelectItineraryDay}
        goToNextStep={goToNextStep}
        goToPrevStep={goToPrevStep}
        togglePanel={togglePanel}
      />
    );
  }
  
  // Desktop layout
  return (
    <div className="flex h-screen overflow-hidden bg-jeju-light-gray">
      <div className="w-[30%] h-full p-4 flex flex-col">
        <SearchSection
          dateRange={dateRange}
          promptText={promptText}
          loading={loading}
          isDateSelectionComplete={isDateSelectionComplete}
          onDatesSelected={handleDatesSelected}
          onPromptChange={handlePromptChange}
          onSearch={handleSearchClick}
        />
        
        <CategorySelector
          selectedCategory={selectedCategory}
          isSearchComplete={isSearchComplete}
          onCategoryClick={handleCategoryClick}
        />
        
        <ContentSection
          showItinerary={showItinerary}
          filteredPlaces={filteredPlaces}
          loading={loading}
          selectedPlace={selectedPlace}
          currentPage={currentPage}
          totalPages={totalPages}
          itinerary={itinerary}
          dateRange={dateRange}
          selectedItineraryDay={selectedItineraryDay}
          isPlaceListReady={isPlaceListReady}
          isCategorySelectionComplete={isCategorySelectionComplete}
          onSelectPlace={handlePlaceSelect}
          onPageChange={handlePageChange}
          onCreateItinerary={handleCreateItinerary}
          onSelectItineraryDay={handleSelectItineraryDay}
          setShowItinerary={setShowItinerary}
          setItinerary={setItinerary}
          setSelectedItineraryDay={setSelectedItineraryDay}
        />
      </div>
      
      <div className="w-[70%] h-full p-4 animate-fade-in" style={{ minHeight: '600px' }}>
        <div className="w-full h-full rounded-lg overflow-hidden shadow-lg bg-white">
          <Map
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            itinerary={itinerary}
            selectedDay={selectedItineraryDay}
            selectedPlaces={selectedPlaces}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
