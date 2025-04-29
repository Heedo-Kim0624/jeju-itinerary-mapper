import React from 'react';
import { TrashIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Place } from '@/types/supabase';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useRegionSelection } from '@/hooks/use-region-selection';
import { useItineraryCreator } from '@/hooks/use-itinerary-creator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const PlaceCart: React.FC = () => {
  const { selectedPlaces, removePlace } = useSelectedPlaces();
  const { startDate, endDate } = useTripDetails();
  const { selectedLocations } = useRegionSelection();
  const { createItinerary, isCreating } = useItineraryCreator();
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatDateRange = () => {
    if (!startDate || !endDate) return '';
    
    const start = format(new Date(startDate), 'M.d (E)', { locale: ko });
    const end = format(new Date(endDate), 'M.d (E)', { locale: ko });
    
    return `${start} ~ ${end}`;
  };

  const renderLocationBadges = () => {
    if (!selectedLocations.length) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {selectedLocations.map((location) => (
          <Badge key={location} variant="outline" className="text-xs">
            {location}
          </Badge>
        ))}
      </div>
    );
  };

  const handleRemovePlace = (place: Place, event: React.MouseEvent) => {
    event.stopPropagation();
    removePlace(place);
  };

  const handleCreateItinerary = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "일정 기간을 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlaces.length < 2) {
      toast({
        title: "최소 2개 이상의 장소를 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    try {
      await createItinerary({
        selected_places: selectedPlaces.map(p => ({ 
          id: p.id.toString(), // Convert ID to string
          name: p.name 
        })),
        candidate_places: [],
        start_datetime: startDate,
        end_datetime: endDate
      });
    } catch (error) {
      console.error("일정 생성 중 오류 발생:", error);
      toast({
        title: "일정 생성 중 오류가 발생했습니다",
        description: "잠시 후 다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <h3 className="text-base font-medium">나의 장소</h3>
        <div className="text-sm text-muted-foreground mt-1">
          {formatDateRange()}
        </div>
        {renderLocationBadges()}
      </div>
      
      <ScrollArea className="flex-1">
        {selectedPlaces.length > 0 ? (
          <div className="p-3 space-y-2">
            {selectedPlaces.map((place) => (
              <div 
                key={place.id} 
                className="flex items-center justify-between bg-muted/30 rounded-md p-2 hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{place.name}</div>
                  <div className="text-xs text-muted-foreground">{place.category}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={(e) => handleRemovePlace(place, e)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            선택된 장소가 없습니다
          </div>
        )}
      </ScrollArea>
      
      <div className="p-3 border-t">
        <Button 
          className="w-full" 
          disabled={selectedPlaces.length < 2 || isCreating} 
          onClick={handleCreateItinerary}
        >
          {isCreating ? '일정 생성 중...' : '일정 생성하기'}
        </Button>
      </div>
    </div>
  );
};

export default PlaceCart;
