import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X, PlayCircle, HelpCircle } from "lucide-react";

interface HelpWindowProps {
    onClose: () => void;
}

interface VideoItem {
    id: string;
    title: string;
    filename: string;
}

export default function HelpWindow({ onClose }: HelpWindowProps) {
    const videos: VideoItem[] = [
        { id: 'basics', title: 'Basics', filename: 'Basics.webm' },
        { id: 'inventory', title: 'Inventory', filename: 'Inventory.webm' },
        { id: 'guns', title: 'Guns', filename: 'guns.webm' },
        { id: 'crafting', title: 'Crafting & Disassembly', filename: 'craftinganddisassembly.webm' },
        { id: 'cooking', title: 'Cooking and water', filename: 'cookingandwater.webm' },
        { id: 'farming', title: 'Farming', filename: 'farming.webm' }
    ];

    const [selectedVideo, setSelectedVideo] = useState<VideoItem>(videos[0]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/90 backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in duration-200">
            <Card className="w-[1050px] bg-card border-2 border-primary/20 shadow-2xl relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <Button
                    className="absolute right-3 top-3 h-8 w-8 p-0 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 z-10"
                    variant="ghost"
                    onClick={onClose}
                    title="Close Help"
                >
                    <X className="h-5 w-5" />
                </Button>

                <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <HelpCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Game Help & Tutorials</CardTitle>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 flex gap-6 min-h-[480px]">
                    {/* Left Column: List Menu */}
                    <div className="w-[280px] flex-shrink-0 flex flex-col gap-2 border-r border-border/50 pr-6">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tutorials</h3>
                        {videos.map((vid) => (
                            <Button
                                key={vid.id}
                                variant={selectedVideo.id === vid.id ? "default" : "ghost"}
                                className={`w-full justify-start gap-3 py-3 px-4 h-auto font-bold tracking-wide uppercase transition-all duration-200 whitespace-normal text-left flex items-center ${
                                    selectedVideo.id === vid.id
                                        ? "shadow-lg shadow-primary/20 text-primary-foreground"
                                        : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                                }`}
                                onClick={() => setSelectedVideo(vid)}
                            >
                                <PlayCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="leading-tight">{vid.title}</span>
                            </Button>
                        ))}
                    </div>

                    {/* Right Column: Video Player */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div className="flex flex-col gap-2 mb-4">
                            <h2 className="text-xl font-bold tracking-tight uppercase">{selectedVideo.title}</h2>
                            <p className="text-xs text-muted-foreground">Click play on the video player below to watch the tutorial.</p>
                        </div>

                        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-border/50 shadow-inner flex items-center justify-center">
                            <video
                                key={selectedVideo.id}
                                src={`/video/help/${selectedVideo.filename}`}
                                controls
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
