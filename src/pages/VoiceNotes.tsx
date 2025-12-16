import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mic, MicOff, Play, Pause, Trash2, Edit, Search, Square, Clock } from "lucide-react";
import { format } from "date-fns";

interface VoiceNote {
  id: string;
  title: string;
  audio_url: string;
  duration_seconds: number | null;
  created_at: string;
}

const VoiceNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<VoiceNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) fetchNotes();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("voice_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch voice notes", variant: "destructive" });
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await saveRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast({ title: "Recording", description: "Voice recording started..." });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({ title: "Error", description: "Could not access microphone. Please allow microphone access.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    if (!user) return;

    const fileName = `${user.id}/${Date.now()}.webm`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("voice-notes")
      .upload(fileName, audioBlob);

    if (uploadError) {
      toast({ title: "Error", description: "Failed to upload recording", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage
      .from("voice-notes")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("voice_notes").insert({
      user_id: user.id,
      title: `Note ${format(new Date(), "MMM d, h:mm a")}`,
      audio_url: urlData.publicUrl,
      duration_seconds: recordingTime,
    });

    if (insertError) {
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Voice note saved!" });
      fetchNotes();
    }
    setRecordingTime(0);
  };

  const playNote = (note: VoiceNote) => {
    if (playingId === note.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(note.audio_url);
    audioRef.current = audio;
    
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      toast({ title: "Error", description: "Failed to play audio", variant: "destructive" });
      setPlayingId(null);
    };

    audio.play();
    setPlayingId(note.id);
  };

  const deleteNote = async (note: VoiceNote) => {
    // Extract file path from URL
    const urlParts = note.audio_url.split("/voice-notes/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from("voice-notes").remove([filePath]);
    }

    const { error } = await supabase.from("voice_notes").delete().eq("id", note.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Voice note deleted" });
      fetchNotes();
    }
  };

  const updateTitle = async () => {
    if (!editingNote) return;

    const { error } = await supabase
      .from("voice_notes")
      .update({ title: editTitle })
      .eq("id", editingNote.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update title", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Title updated" });
      fetchNotes();
    }
    setEditingNote(null);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">Please log in to use voice notes.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Voice Notes</h1>
          <p className="text-muted-foreground">Record and save voice memos</p>
        </div>

        {/* Recording Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-red-500 animate-pulse" : "bg-primary"}`}>
                {isRecording ? (
                  <Mic className="w-10 h-10 text-white" />
                ) : (
                  <MicOff className="w-10 h-10 text-white" />
                )}
              </div>

              {isRecording && (
                <div className="flex items-center gap-2 text-lg font-mono">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  {formatDuration(recordingTime)}
                </div>
              )}

              <div className="flex gap-3">
                {!isRecording ? (
                  <Button onClick={startRecording} size="lg" className="gap-2">
                    <Mic className="w-5 h-5" /> Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} size="lg" variant="destructive" className="gap-2">
                    <Square className="w-5 h-5" /> Stop Recording
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredNotes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Mic className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No voice notes yet. Record your first note!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Button
                      variant={playingId === note.id ? "default" : "outline"}
                      size="icon"
                      onClick={() => playNote(note)}
                      className="shrink-0"
                    >
                      {playingId === note.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{note.title}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(note.duration_seconds)}
                        </span>
                        <span>{format(new Date(note.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingNote(note);
                        setEditTitle(note.title);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNote(note)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Note Title</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <Button onClick={updateTitle} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default VoiceNotes;