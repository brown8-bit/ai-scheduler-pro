import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description?: string | null;
  event_date: string;
  is_recurring?: boolean;
  recurrence_pattern?: string | null;
}

interface CalendarExportProps {
  events: Event[];
}

const CalendarExport = ({ events }: CalendarExportProps) => {
  const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const generateICSContent = (): string => {
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Schedulr//Calendar Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    events.forEach((event) => {
      const startDate = new Date(event.event_date);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default duration

      ics += `BEGIN:VEVENT
UID:${event.id}@schedulr.app
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${event.title.replace(/,/g, '\\,')}
DESCRIPTION:${(event.description || '').replace(/,/g, '\\,').replace(/\n/g, '\\n')}
END:VEVENT
`;
    });

    ics += 'END:VCALENDAR';
    return ics;
  };

  const downloadICS = () => {
    if (events.length === 0) {
      toast({ title: "No events to export", variant: "destructive" });
      return;
    }

    const icsContent = generateICSContent();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedulr-events.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Calendar exported! 📅", description: "Import the .ics file into your calendar app." });
  };

  const openGoogleCalendar = () => {
    if (events.length === 0) {
      toast({ title: "No events to export", variant: "destructive" });
      return;
    }

    const event = events[0];
    const startDate = new Date(event.event_date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(event.description || '')}`;
    
    window.open(url, '_blank');
    toast({ title: "Opening Google Calendar...", description: "For multiple events, use the ICS export." });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadICS} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          Download .ICS (Apple/Outlook)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openGoogleCalendar} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          Add to Google Calendar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CalendarExport;
