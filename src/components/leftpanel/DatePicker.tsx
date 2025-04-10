import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, ArrowLeft } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

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
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [mobileStep, setMobileStep] = useState<'start' | 'end' | 'time'>('start');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { isMobile, isPortrait } = useIsMobile();

  // Update current date time when component mounts
  useEffect(() => {
    setCurrentDateTime(new Date());
  }, []);

  // Function to check if a date-time combination is in the past
  const isDateTimeInPast = (date: Date, time: string): boolean => {
    if (!date) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    return selectedDateTime < currentDateTime;
  };

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      toast.error('출발일과 도착일을 모두 선택해주세요');
      return;
    }

    if (endDate < startDate) {
      toast.error('도착일은 출발일 이후여야 합니다');
      return;
    }

    if (isDateTimeInPast(startDate, startTime)) {
      toast.error('과거 시간은 선택할 수 없습니다');
      return;
    }

    onDatesSelected({
      startDate,
      endDate,
      startTime,
      endTime,
    });
    
    setOpen(false);
    setDialogOpen(false);
    toast.success('일정이 설정되었습니다');
  };

  const handleMobileStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      setMobileStep('end');
    }
  };

  const handleMobileEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    if (date) {
      setMobileStep('time');
    }
  };

  const handleBackToStartDate = () => {
    setMobileStep('start');
  };

  const handleBackToEndDate = () => {
    setMobileStep('end');
  };

  // Generate time options (1 hour intervals)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      const formattedHour = hour.toString().padStart(2, '0');
      options.push(`${formattedHour}:00`);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Format date for display
  const formatDateRange = () => {
    if (startDate && endDate) {
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span>시작: {format(startDate, 'yyyy.MM.dd')} {startTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>종료: {format(endDate, 'yyyy.MM.dd')} {endTime}</span>
          </div>
        </div>
      );
    }
    return '날짜 선택';
  };

  // Function to disable past dates
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Mobile dialog content
  const getMobileDialogContent = () => {
    switch (mobileStep) {
      case 'start':
        return (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>출발일 선택</DialogTitle>
              <DialogDescription>여행을 시작할 날짜를 선택해주세요</DialogDescription>
            </DialogHeader>
            <div className="border rounded-md overflow-hidden">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleMobileStartDateSelect}
                disabled={isPastDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </div>
          </div>
        );
      case 'end':
        return (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>도착일 선택</DialogTitle>
              <DialogDescription>여행을 종료할 날짜를 선택해주세요</DialogDescription>
            </DialogHeader>
            <Button 
              variant="outline" 
              className="mb-2" 
              onClick={handleBackToStartDate}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              출발일 다시 선택
            </Button>
            <div className="border rounded-md overflow-hidden">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleMobileEndDateSelect}
                disabled={isPastDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </div>
          </div>
        );
      case 'time':
        return (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>시간 선택</DialogTitle>
              <DialogDescription>관광 시작 및 종료 시간을 선택해주세요</DialogDescription>
            </DialogHeader>
            <Button 
              variant="outline" 
              className="mb-2" 
              onClick={handleBackToEndDate}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              도착일 다시 선택
            </Button>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-start-time">도착 비행기 시간</Label>
                <Select 
                  value={startTime} 
                  onValueChange={setStartTime}
                >
                  <SelectTrigger id="mobile-start-time">
                    <SelectValue placeholder="시작 시간" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem 
                        key={`mobile-start-${time}`} 
                        value={time}
                        disabled={startDate && isDateTimeInPast(startDate, time)}
                      >
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile-end-time">돌아가는 비행기 시간</Label>
                <Select 
                  value={endTime} 
                  onValueChange={setEndTime}
                >
                  <SelectTrigger id="mobile-end-time">
                    <SelectValue placeholder="종료 시간" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={`mobile-end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleConfirm}>확인</Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // For mobile portrait view, use Dialog instead of Popover
  if (isMobile && isPortrait) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="date-picker-trigger w-full justify-between h-auto"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className={cn(
                "text-sm",
                (!startDate || !endDate) ? "text-muted-foreground" : "text-foreground"
              )}>
                {formatDateRange()}
              </span>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-panel">
          {getMobileDialogContent()}
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop view - original popover implementation
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="date-picker-trigger w-full justify-between h-auto"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={cn(
              "text-sm",
              (!startDate || !endDate) ? "text-muted-foreground" : "text-foreground"
            )}>
              {formatDateRange()}
            </span>
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
                  disabled={isPastDate}
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
                  disabled={isPastDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">도착 비행기 시간</Label>
              <Select 
                value={startTime} 
                onValueChange={setStartTime}
              >
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="시작 시간" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem 
                      key={`start-${time}`} 
                      value={time}
                      disabled={startDate && isDateTimeInPast(startDate, time)}
                    >
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">돌아가는 비행기 시간</Label>
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
