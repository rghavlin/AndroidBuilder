// The saved messages are authored data the reader renders block by block, so a
// typo'd block type would render as nothing at all with no error anywhere.
// These tests are the schema the reader assumes.
import { describe, it, expect } from 'vitest';
import { PHONE_MESSAGES, getPhoneMessage } from '../../client/src/game/phone/PhoneMessages.js';

/** Block types PhoneWindow's MessageReader knows how to draw. */
const RENDERABLE_TYPES = new Set(['text', 'heading', 'steps', 'bullets', 'note']);

describe('phone/PhoneMessages', () => {
  it('carries the CDC alert', () => {
    const alert = getPhoneMessage('cdc-alert');

    expect(alert).toBeTruthy();
    expect(alert.subject).toBe('CDC ALERT');
    expect(alert.from).toBe('CDC');
    expect(alert.body.length).toBeGreaterThan(0);
  });

  it('returns null for a message that does not exist', () => {
    expect(getPhoneMessage('no-such-message')).toBeNull();
  });

  it('gives every message the header fields the inbox lists it by', () => {
    for (const message of PHONE_MESSAGES) {
      expect(message.id, 'message id').toBeTruthy();
      expect(message.subject, `${message.id} subject`).toBeTruthy();
      expect(message.from, `${message.id} from`).toBeTruthy();
      expect(message.received, `${message.id} received`).toBeTruthy();
    }
  });

  it('uses only block types the reader can draw, each with its own payload', () => {
    for (const message of PHONE_MESSAGES) {
      for (const block of message.body) {
        expect(RENDERABLE_TYPES.has(block.type), `${message.id}: block type "${block.type}"`).toBe(true);

        if (block.type === 'steps' || block.type === 'bullets') {
          expect(Array.isArray(block.items), `${message.id}: ${block.type} needs items`).toBe(true);
          expect(block.items.length).toBeGreaterThan(0);
          for (const item of block.items) expect(typeof item).toBe('string');
        } else {
          expect(typeof block.text, `${message.id}: ${block.type} needs text`).toBe('string');
          expect(block.text.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps message ids unique — the reader looks messages up by id', () => {
    const ids = PHONE_MESSAGES.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
