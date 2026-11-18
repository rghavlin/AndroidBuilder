import React from 'react';
import { cn } from "@/lib/utils";
import { useLog } from "@/contexts/LogContext";
import { useAudio } from "@/contexts/AudioContext";
import PhoneBlocks from './PhoneBlocks';
import {
  NOMAD_SURVIVOR_CHAPTERS,
  NOMAD_SURVIVOR_TITLE,
  NOMAD_SURVIVOR_SUBTITLE,
  getNomadChapter
} from '@/game/phone/NomadSurvivorChapters';
import {
  AP_PER_PAGE,
  chapterProgress,
  chapterBuildSheets,
  chaptersFinished,
  pagesReadable,
  readChapter
} from '@/game/phone/NomadSurvivorEbook';
import engine from '../../game/GameEngine.js';

/**
 * The Nomad Survivor e-book app: a chapter list and a chapter reader.
 *
 * All the rules (what reading costs, when a recipe unlocks) live in
 * game/phone/NomadSurvivorEbook — this file only draws progress and turns
 * button presses into readChapter calls plus their log lines and sounds.
 * PhoneWindow re-renders on the engine pulse, so nothing here keeps its own
 * copy of the progress.
 */

/** Thin progress bar shared by the list and the reader. */
function PageBar({ pagesRead, pages }: { pagesRead: number; pages: number }) {
  const percent = pages > 0 ? (pagesRead / pages) * 100 : 0;
  const done = pagesRead >= pages;
  return (
    <span className="relative block h-1.5 rounded-full bg-cyan-400/10 overflow-hidden">
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-300",
          done ? "bg-emerald-300/80" : "bg-cyan-300/80"
        )}
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

/** Table of contents. */
export function ChapterList({ onOpen }: { onOpen: (id: string) => void }) {
  const finished = chaptersFinished(engine);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 flex flex-col gap-1.5" data-testid="phone-ebook-chapters">
      <div className="px-1 pb-1">
        <h3 className="text-[0.75rem] font-black uppercase tracking-widest text-cyan-200">
          {NOMAD_SURVIVOR_TITLE}
        </h3>
        <p className="text-[0.55rem] font-mono text-cyan-100/40">
          {NOMAD_SURVIVOR_SUBTITLE} — {finished}/{NOMAD_SURVIVOR_CHAPTERS.length} chapters read
        </p>
      </div>

      {NOMAD_SURVIVOR_CHAPTERS.map((chapter) => {
        const progress = chapterProgress(engine, chapter.id);
        return (
          <button
            key={chapter.id}
            onClick={() => onOpen(chapter.id)}
            data-testid={`phone-ebook-chapter-${chapter.number}`}
            className={cn(
              "w-full text-left px-2.5 py-2 rounded-lg border transition-colors focus:outline-none",
              progress.finished
                ? "border-emerald-400/25 bg-emerald-400/5 text-cyan-100/80 hover:bg-emerald-400/10"
                : "border-cyan-400/15 bg-cyan-400/5 text-cyan-200/80 hover:bg-cyan-400/10"
            )}
          >
            <span className="block text-[0.7rem] font-bold leading-tight">
              {chapter.number}. {chapter.title}
            </span>
            <span className="block text-[0.6rem] font-mono text-cyan-100/40 mb-1">
              {progress.finished
                ? 'Learned'
                : `${progress.pagesRead}/${progress.pages} pages`}
            </span>
            <PageBar pagesRead={progress.pagesRead} pages={progress.pages} />
          </button>
        );
      })}
    </div>
  );
}

/** One chapter: the text read so far, then either the build sheet or the read controls. */
export function ChapterReader({ chapterId }: { chapterId: string }) {
  const { addLog } = useLog();
  const { playSound } = useAudio();
  const chapter = getNomadChapter(chapterId);
  if (!chapter) return null;

  const progress = chapterProgress(engine, chapterId);
  const blocks = chapter.body;
  // The text unrolls as the player reads: always the opening paragraph, then
  // more in proportion to pages read, and all of it once the chapter is done.
  const visibleCount = progress.finished
    ? blocks.length
    : Math.max(1, Math.floor(blocks.length * progress.pagesRead / progress.pages));
  const isPlayerTurn = engine.turnPhase === 'PLAYER_TURN' && !engine.isAutosaving;

  const handleRead = (amount: number | 'max') => {
    const result: any = readChapter(engine, chapterId, amount);
    if (!result.success) {
      addLog(result.reason || 'You cannot read right now.', 'error');
      playSound('Fail');
      return;
    }
    const label = `${NOMAD_SURVIVOR_TITLE}, chapter ${chapter.number}`;
    addLog(`You read ${result.pagesRead} page${result.pagesRead === 1 ? '' : 's'} of ${label}.`, 'item');
    if (result.finished) {
      const learned = result.learned.length > 0 ? result.learned.join(' and ') : 'something new';
      addLog(`You finished ${label}. You learned how to craft: ${learned}!`, 'success');
      playSound('LevelUp');
    } else {
      playSound('Click');
    }
    engine.notifyUpdate();
  };

  const readOptions: Array<{ label: string; amount: number | 'max'; testId: string }> = [
    { label: '1 page', amount: 1, testId: 'phone-ebook-read-1' },
    { label: '5 pages', amount: 5, testId: 'phone-ebook-read-5' },
    { label: 'Max', amount: 'max', testId: 'phone-ebook-read-max' }
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col" data-testid="phone-ebook-reader">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 text-cyan-100/75">
        <p className="text-[0.55rem] font-mono uppercase tracking-widest text-cyan-100/35 pt-1">
          Chapter {chapter.number}
        </p>
        <h3 className="text-[0.75rem] font-black uppercase tracking-widest text-cyan-200">
          {chapter.title}
        </h3>
        <div className="mt-1 mb-2">
          <PageBar pagesRead={progress.pagesRead} pages={progress.pages} />
          <p className="mt-0.5 text-[0.55rem] font-mono text-cyan-100/35">
            {progress.pagesRead}/{progress.pages} pages
          </p>
        </div>

        <PhoneBlocks blocks={blocks.slice(0, visibleCount)} />

        {progress.finished ? (
          chapterBuildSheets(chapterId).map((sheet) => (
            <div
              key={sheet.name}
              className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-2.5 py-2"
              data-testid="phone-ebook-build-sheet"
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-widest text-emerald-200/90">
                Learned: {sheet.name}
              </p>
              {sheet.tools.length > 0 && (
                <p className="mt-1 text-[0.58rem] text-cyan-100/60">
                  <span className="text-cyan-100/40">Tools: </span>{sheet.tools.join(', ')}
                </p>
              )}
              <ul className="mt-1 pl-3 space-y-0.5 text-[0.58rem] text-cyan-100/70">
                {sheet.materials.map((m) => (
                  <li key={m} className="before:content-['—_'] before:text-cyan-100/40">{m}</li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="mt-3 text-[0.58rem] italic text-cyan-100/35">
            Keep reading to learn this build.
          </p>
        )}
      </div>

      {!progress.finished && (
        <div className="shrink-0 border-t border-cyan-400/10 px-2 py-2">
          <p className="mb-1.5 text-[0.55rem] font-mono text-cyan-100/40 text-center">
            Read — {AP_PER_PAGE} AP per page
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {readOptions.map((opt) => {
              const pages = pagesReadable(engine, chapterId, opt.amount);
              // A fixed request that can't be met in full is refused rather
              // than quietly shortened, so "5 pages" never means 3.
              const enabled = isPlayerTurn && pages > 0
                && (opt.amount === 'max' || pages === opt.amount);
              return (
                <button
                  key={opt.testId}
                  onClick={() => handleRead(opt.amount)}
                  disabled={!enabled}
                  data-testid={opt.testId}
                  title={opt.amount === 'max' && pages > 0 ? `Read ${pages} pages` : undefined}
                  className={cn(
                    "px-1 py-1.5 rounded-md border text-[0.6rem] transition-colors focus:outline-none",
                    enabled
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                      : "border-cyan-400/10 text-cyan-100/25 cursor-not-allowed"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
