import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X, Sparkles, Music, Paintbrush, Volume2 } from "lucide-react";

interface CreditsWindowProps {
    onClose: () => void;
}

export default function CreditsWindow({ onClose }: CreditsWindowProps) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/90 backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in duration-200">
            <Card className="w-[520px] max-h-[85vh] bg-card border-2 border-primary/20 shadow-2xl relative overflow-hidden flex flex-col">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <Button
                    className="absolute right-3 top-3 h-8 w-8 p-0 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 z-10"
                    variant="ghost"
                    onClick={onClose}
                    title="Close Credits"
                >
                    <X className="h-5 w-5" />
                </Button>

                <CardHeader className="border-b border-border/50 bg-muted/30 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Game Credits</CardTitle>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm text-muted-foreground">
                    {/* Music Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider border-b border-border/30 pb-1.5">
                            <Music className="w-4 h-4 text-primary" />
                            Music & Ambience
                        </div>
                        <ul className="space-y-2.5 list-disc list-inside pl-1 text-[13px] leading-relaxed">
                            <li>
                                Energetic background music by ZHRØ —{' '}
                                <a href="https://freesound.org/s/750340/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    freesound.org
                                </a>{' '}
                                — License: Attribution 4.0
                            </li>
                            <li>
                                Loopable horror ambience by ZHRØ —{' '}
                                <a href="https://freesound.org/s/702966/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    freesound.org
                                </a>{' '}
                                — License: Attribution 4.0
                            </li>
                            <li>
                                Dark urban/lofi background music by ZHRØ —{' '}
                                <a href="https://freesound.org/s/755404/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    freesound.org
                                </a>{' '}
                                — License: Attribution 4.0
                            </li>
                            <li>
                                Relaxation music #69 by ZHRØ —{' '}
                                <a href="https://freesound.org/s/808969/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    freesound.org
                                </a>{' '}
                                — License: Attribution 4.0
                            </li>
                            <li>
                                Sad piano music by ZHRØ —{' '}
                                <a href="https://freesound.org/s/688767/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    freesound.org
                                </a>{' '}
                                — License: Attribution 4.0
                            </li>
                            <li>
                                Emotional Sad Guitar Music by Tunetank —{' '}
                                <a href="https://pixabay.com/music/acoustic-group-emotional-sad-guitar-music-349888/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    pixabay.com
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Graphics & Tiles Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider border-b border-border/30 pb-1.5">
                            <Paintbrush className="w-4 h-4 text-primary" />
                            Graphics & Tilesets
                        </div>
                        <ul className="space-y-2.5 list-disc list-inside pl-1 text-[13px] leading-relaxed">
                            <li>
                                Black and white tiles by Reactorcore —{' '}
                                <a href="http://www.reactorcoregames.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    reactorcoregames.com
                                </a>
                            </li>
                            <li>
                                Standard tiles by Little Martian —{' '}
                                <a href="https://little-martian.itch.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    itch.io
                                </a>
                                ,{' '}
                                <a href="https://little-martian.itch.io/retro-textures-pack" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                    retro-textures-pack
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Sound Effects Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wider border-b border-border/30 pb-1.5">
                            <Volume2 className="w-4 h-4 text-primary" />
                            Sound Effects
                        </div>
                        <p className="pl-1 text-[13px] leading-relaxed">
                            Sidearm Studios, Darkwood Audio, YourPalRob, Snake
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
