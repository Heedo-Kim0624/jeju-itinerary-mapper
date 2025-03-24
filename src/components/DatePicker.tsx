
import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface DatePickerProps {
  onDatesSelected: (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ onDatesSelected }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      toast.error('출발일과 도착일을 모두 선택해주세요');
      return;
    }

    if (endDate < startDate) {
      toast.error('도착일은 출발일 이후여야 합니다');
      return;
    }

    onDatesSelected({
      startDate,
      endDate,
      startTime,
      endTime,
    });
    
    setOpen(false);
    toast.success('일정이 설정되었습니다');
  };

  // Generate time options (30 minute intervals)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Format date for display
  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'yyyy.MM.dd')} - ${format(endDate, 'yyyy.MM.dd')}`;
    }
    return '날짜 선택';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="date-picker-trigger w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className={cn(
              "text-sm",
              (!startDate || !endDate) ? "text-muted-foreground" : "text-foreground"
            )}>
              {formatDateRange()}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{startTime} - {endTime}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 glass-panel" 
        align="start"
      >
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">출발일</Label>
              <div className="border rounded-md overflow-hidden">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">도착일</Label>
              <div className="border rounded-md overflow-hidden">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">관광 시작 시간</Label>
              <Select 
                value={startTime} 
                onValueChange={setStartTime}
              >
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="시작 시간" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`start-${time}`} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">관광 종료 시간</Label>
              <Select 
                value={endTime} 
                onValueChange={setEndTime}
              >
                <SelectTrigger id="end-time">
                  <SelectValue placeholder="종료 시간" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={`end-${time}`} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={handleConfirm}>확인</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
