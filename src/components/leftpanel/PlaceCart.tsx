
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

interface PlaceCartProps {
  selectedPlaces: Place[];
  onRemovePlace: (id: string) => void;
  onViewOnMap: (place: Place) => void;
}

const PlaceCart: React.FC<PlaceCartProps> = ({ selectedPlaces, onRemovePlace, onViewOnMap }) => {
  const { dates } = useTripDetails();
  const { selectedRegions } = useRegionSelection();
  const { createItinerary } = useItineraryCreator();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = React.useState(false);

  const formatDateRange = () => {
    if (!dates) return '';
    
    const start = format(new Date(dates.startDate), 'M.d (E)', { locale: ko });
    const end = format(new Date(dates.endDate), 'M.d (E)', { locale: ko });
    
    return `${start} ~ ${end}`;
  };

  const renderLocationBadges = () => {
    if (!selectedRegions?.length) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {selectedRegions.map((location) => (
          <Badge key={location} variant="outline" className="text-xs">
            {location}
          </Badge>
        ))}
      </div>
    );
  };

  const handleRemovePlace = (place: Place, event: React.MouseEvent) => {
    event.stopPropagation();
    onRemovePlace(place.id.toString());
  };

  const handleCreateItinerary = async () => {
    if (!dates) {
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
      setIsCreating(true);
      const result = createItinerary(
        selectedPlaces,
        dates.startDate,
        dates.endDate,
        dates.startTime,
        dates.endTime
      );
      setIsCreating(false);
      
      if (result && result.length > 0) {
        navigate('/itinerary');
      }
    } catch (error) {
      setIsCreating(false);
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
                onClick={() => onViewOnMap(place)}
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
