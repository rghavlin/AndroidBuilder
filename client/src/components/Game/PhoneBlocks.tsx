import React from 'react';
import { cn } from "@/lib/utils";

/**
 * Renders the phone's block-structured text (saved messages, e-book chapters).
 *
 * Block types: 'text' (a paragraph), 'heading' (a section label, optionally
 * `emphasis`), 'steps' (a numbered list), 'bullets' (a dashed list), 'note'
 * (a smaller aside). Unknown types fall back to a paragraph.
 */
export default function PhoneBlocks({ blocks }: { blocks: any[] }) {
  return (
    <>
      {blocks.map((block: any, i: number) => {
        if (block.type === 'heading') {
          return (
            <h4
              key={i}
              className={cn(
                "text-[0.65rem] font-bold mt-2.5 mb-1",
                block.emphasis
                  ? "uppercase tracking-widest text-cyan-200"
                  : "text-cyan-200/90"
              )}
            >
              {block.text}
            </h4>
          );
        }
        if (block.type === 'steps') {
          return (
            <ol key={i} className="list-decimal pl-4 space-y-1 text-[0.62rem] leading-relaxed">
              {block.items.map((item: string, j: number) => <li key={j}>{item}</li>)}
            </ol>
          );
        }
        if (block.type === 'bullets') {
          return (
            <ul key={i} className="pl-3 space-y-1 text-[0.62rem] leading-relaxed">
              {block.items.map((item: string, j: number) => (
                <li key={j} className="before:content-['—_'] before:text-cyan-100/40">{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'note') {
          return (
            <p key={i} className="mt-2 text-[0.58rem] italic text-cyan-100/50 leading-relaxed">
              Note: {block.text}
            </p>
          );
        }
        return (
          <p key={i} className="text-[0.62rem] leading-relaxed">{block.text}</p>
        );
      })}
    </>
  );
}
