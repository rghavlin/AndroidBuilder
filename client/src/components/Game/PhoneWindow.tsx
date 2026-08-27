import React, { useState, useSyncExternalStore } from 'react';
import { cn } from "@/lib/utils";
import { Power, MessageSquare, Truck, ChevronLeft, X } from 'lucide-react';
import AttachmentSlot from '@/components/Inventory/AttachmentSlot';
import LeftPanelWindow from './LeftPanelWindow';
import { useInventory } from "@/contexts/InventoryContext";
import { useGame } from "@/contexts/GameContext.jsx";
import { useLog } from "@/contexts/LogContext";
import { useAudio } from "@/contexts/AudioContext";
import { getPhone, phoneCharges, setPhonePower, canTogglePhonePower } from '@/game/phone/Phone';
import * as RemoteDeviceRegistry from '@/game/remote/RemoteDeviceRegistry';
import { hasAutonomy } from '@/game/remote/RemoteDeviceKinds';
import { PHONE_MESSAGES, getPhoneMessage } from '@/game/phone/PhoneMessages';
import engine from '../../game/GameEngine.js';

interface PhoneWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Which screen the handset is showing. 'home' is the app grid. */
type PhoneScreen = 'home' | 'devices' | 'messages';

/** Fallback if a phone predates the def's attachment slots. */
const BATTERY_SLOT = { id: 'battery', name: 'Battery', allowedCategories: ['battery'] };

export default function PhoneWindow({ isOpen, onClose }: PhoneWindowProps) {
  const { inventoryVersion } = useInventory();
  const { selectRemoteDevice } = useGame();
  const { addLog } = useLog();
  const { playSound } = useAudio();
  const [screen, setScreen] = useState<PhoneScreen>('home');
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);

  // Leaving an app closes whatever it had open, so coming back starts at its
  // own top level rather than mid-message.
  const goToScreen = (next: PhoneScreen) => {
    setOpenMessageId(null);
    setScreen(next);
  };

  // Power state and charge both live on the engine, so re-render on its pulse
  // the same way the inventory contexts do.
  useSyncExternalStore((cb) => engine.subscribe(cb), () => engine.getSnapshot());

  if (!isOpen) return null;

  const phone = getPhone(engine);
  const charges = phoneCharges(engine);
  const isOn = !!engine.isPhoneOn && charges > 0;
  const canToggle = canTogglePhonePower(engine);
  const batterySlot = phone?.attachmentSlots?.find((s: any) => s.id === 'battery') || BATTERY_SLOT;

  const handlePower = () => {
    const result = setPhonePower(engine, !engine.isPhoneOn);
    if (!result.success) {
      addLog(result.reason || 'The phone does not respond.', 'error');
      playSound('Fail');
      return;
    }
    if (result.on) {
      playSound('SwitchOn');
    } else {
      playSound('SwitchOff');
      // Coming back to a dark handset should start at the home screen, not
      // halfway into an app the player can no longer see.
      goToScreen('home');
      if (result.linkDropped && engine.player) {
        engine.camera?.centerOn(engine.player.x, engine.player.y);
        addLog('You lose contact with your remote devices.', 'info');
      }
    }
    engine.notifyUpdate();
  };

  // Picking a device puts the map back in front of the player — steering it is
  // done out there, not in here.
  const handleSelectDevice = (key: string | null) => {
    const result = selectRemoteDevice(key);
    if (result?.success) onClose();
  };

  return (
    <LeftPanelWindow onClose={onClose} testId="phone-window">
      <div className="relative flex-1 min-h-0 flex items-stretch gap-4 p-4">
        <button
          onClick={onClose}
          title="Close"
          data-testid="phone-close-button"
          className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-md bg-secondary/40 border border-primary/20 hover:bg-primary/15 transition-colors focus:outline-none"
        >
          <X className="w-4 h-4 text-primary" />
        </button>

        {/* Left rail: the hardware the player touches, not the software */}
        <div className="w-28 shrink-0 flex flex-col items-center gap-6 pt-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">
              Power
            </span>
            <button
              onClick={handlePower}
              disabled={!canToggle}
              data-testid="phone-power-button"
              title={canToggle
                ? (isOn ? 'Switch the phone off' : 'Switch the phone on (costs a charge)')
                : 'The battery is dead'}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                "equipment-slot-metal focus:outline-none focus-visible:outline-none",
                canToggle ? "hover:brightness-110 active:scale-95" : "opacity-40 cursor-not-allowed",
                isOn && "!border-cyan-400 shadow-[inset_0_0_10px_rgba(34,211,238,0.3),0_0_10px_rgba(34,211,238,0.4)]"
              )}
            >
              <Power className={cn("h-6 w-6", isOn ? "text-cyan-300" : "text-zinc-400")} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">
              Battery
            </span>
            {phone ? (
              <AttachmentSlot
                key={`phone-battery:${inventoryVersion}`}
                weapon={phone}
                slot={batterySlot}
              />
            ) : (
              <div className="w-12 h-12 rounded-md border-2 border-dashed border-border" />
            )}
            <span className={cn(
              "text-[0.65rem] font-mono",
              charges > 0 ? "text-muted-foreground" : "text-destructive"
            )}>
              {charges > 0 ? `${charges} charge${charges === 1 ? '' : 's'}` : 'dead'}
            </span>
          </div>
        </div>

        {/* The handset itself */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <div
            className="h-full aspect-[9/17] max-w-full rounded-[2rem] p-2 shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #3a4048 0%, #1c2025 45%, #2a2f36 100%)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}
            data-testid="phone-frame"
          >
            {/* Speaker slit and lens, so the frame reads as hardware */}
            <div className="h-4 flex items-center justify-center gap-2">
              <div className="w-10 h-1 rounded-full bg-black/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-black/70 ring-1 ring-white/10" />
            </div>

            <div
              className={cn(
                "h-[calc(100%-1.5rem)] rounded-[1.4rem] overflow-hidden flex flex-col transition-colors duration-300",
                isOn ? "bg-[#08110f]" : "bg-[#05070a]"
              )}
              style={!isOn ? {
                backgroundImage: 'linear-gradient(150deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 45%)'
              } : undefined}
              data-testid="phone-screen"
            >
              {isOn ? (
                <PhoneScreenContent
                  screen={screen}
                  charges={charges}
                  onNavigate={goToScreen}
                  onSelectDevice={handleSelectDevice}
                  openMessageId={openMessageId}
                  onOpenMessage={setOpenMessageId}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </LeftPanelWindow>
  );
}

function PhoneScreenContent({
  screen,
  charges,
  onNavigate,
  onSelectDevice,
  openMessageId,
  onOpenMessage
}: {
  screen: PhoneScreen;
  charges: number;
  onNavigate: (screen: PhoneScreen) => void;
  onSelectDevice: (key: string | null) => void;
  openMessageId: string | null;
  onOpenMessage: (id: string | null) => void;
}) {
  const openMessage = openMessageId ? getPhoneMessage(openMessageId) : null;

  // Back steps out one level at a time: out of a message to the inbox, out of
  // an app to the home screen.
  const goBack = () => {
    if (openMessage) onOpenMessage(null);
    else onNavigate('home');
  };

  return (
    <>
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[0.6rem] font-mono text-cyan-300/70 border-b border-cyan-400/10">
        <span className="uppercase tracking-widest">
          {screen === 'home' ? 'No service' : screen}
        </span>
        <span>{charges}</span>
      </div>

      {screen === 'home' ? (
        <div className="flex-1 grid grid-cols-2 content-start gap-3 p-4">
          <PhoneAppIcon
            label="Messages"
            icon={<MessageSquare className="h-7 w-7" />}
            onClick={() => onNavigate('messages')}
            testId="phone-app-messages"
          />
          <PhoneAppIcon
            label="Remote"
            icon={<Truck className="h-7 w-7" />}
            onClick={() => onNavigate('devices')}
            testId="phone-app-devices"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <button
            onClick={goBack}
            className="flex items-center gap-1 px-2 py-1.5 text-[0.65rem] text-cyan-300/70 hover:text-cyan-200 transition-colors focus:outline-none shrink-0"
          >
            <ChevronLeft className="h-3 w-3" /> {openMessage ? 'Inbox' : 'Home'}
          </button>
          {screen === 'devices' ? (
            <DeviceList onSelect={onSelectDevice} />
          ) : openMessage ? (
            <MessageReader message={openMessage} />
          ) : (
            <MessageList onOpen={onOpenMessage} />
          )}
        </div>
      )}
    </>
  );
}

/** The inbox: what was still on the handset when the network went down. */
function MessageList({ onOpen }: { onOpen: (id: string) => void }) {
  if (PHONE_MESSAGES.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 text-center">
        <p className="text-[0.7rem] text-cyan-100/40 font-mono">No messages.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 flex flex-col gap-1.5">
      {PHONE_MESSAGES.map((message) => (
        <button
          key={message.id}
          onClick={() => onOpen(message.id)}
          data-testid={`phone-message-${message.id}`}
          className="w-full text-left px-2.5 py-2 rounded-lg border border-cyan-400/15 bg-cyan-400/5 text-cyan-200/80 hover:bg-cyan-400/10 transition-colors focus:outline-none"
        >
          <span className="block text-[0.7rem] font-bold leading-tight">{message.subject}</span>
          <span className="block text-[0.6rem] font-mono text-cyan-100/40">
            {message.from} — {message.received}
          </span>
        </button>
      ))}
    </div>
  );
}

/** One saved message, rendered from its blocks. */
function MessageReader({ message }: { message: any }) {
  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 text-cyan-100/75"
      data-testid="phone-message-reader"
    >
      <h3 className="text-[0.75rem] font-black uppercase tracking-widest text-cyan-200 pt-1">
        {message.subject}
      </h3>
      <p className="text-[0.55rem] font-mono text-cyan-100/35 mb-2">
        {message.from} — {message.received}
      </p>

      {message.body.map((block: any, i: number) => {
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
    </div>
  );
}

/** Display name for one controllable, whatever form it currently takes. */
function deviceName(target: any): string {
  if (target.kind === 'drone-air') return target.drone?.sourceItem?.name || 'Recon Drone';
  return target.item?.name || 'Device';
}

/** What the player needs to know before picking it: where it is, roughly. */
function deviceStatus(target: any): string {
  if (target.kind === 'drone-air') return 'Airborne';
  if (target.kind === 'drone-ground') return 'On the ground';
  return hasAutonomy(target.item) ? 'Wagon — self-driving' : 'Wagon';
}

/**
 * Everything the phone can reach right now. The registry answers that question
 * for the whole game (the map renderer and the FOV layer read the same list),
 * so this screen is a view of it and nothing more.
 */
function DeviceList({ onSelect }: { onSelect: (key: string | null) => void }) {
  const devices = RemoteDeviceRegistry.listControllables(engine);
  const linkedKey = engine.activeDeviceId;

  if (devices.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 text-center">
        <p className="text-[0.7rem] text-cyan-100/40 font-mono">No devices in range.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 flex flex-col gap-1.5">
      {devices.map((target: any) => {
        const isLinked = target.key === linkedKey;
        return (
          <button
            key={target.key}
            onClick={() => onSelect(target.key)}
            data-testid={`phone-device-${target.key}`}
            className={cn(
              "w-full text-left px-2.5 py-2 rounded-lg border transition-colors focus:outline-none",
              isLinked
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                : "border-cyan-400/15 bg-cyan-400/5 text-cyan-200/80 hover:bg-cyan-400/10"
            )}
          >
            <span className="block text-[0.7rem] font-bold leading-tight">
              {deviceName(target)}
            </span>
            <span className="block text-[0.6rem] font-mono text-cyan-100/40">
              {deviceStatus(target)}{isLinked ? ' — linked' : ''}
            </span>
          </button>
        );
      })}

      {/* Hanging up: the only way back to steering yourself without powering
          the handset down. */}
      {linkedKey && (
        <button
          onClick={() => onSelect(null)}
          data-testid="phone-device-release"
          className="w-full text-left px-2.5 py-2 rounded-lg border border-cyan-400/15 text-[0.65rem] text-cyan-100/50 hover:bg-cyan-400/10 transition-colors focus:outline-none"
        >
          Release control
        </button>
      )}
    </div>
  );
}

function PhoneAppIcon({
  label,
  icon,
  onClick,
  testId
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors focus:outline-none",
        "text-cyan-200/80 hover:text-cyan-100 hover:bg-cyan-400/10"
      )}
    >
      <span className="w-14 h-14 rounded-2xl flex items-center justify-center bg-cyan-400/10 border border-cyan-400/25">
        {icon}
      </span>
      <span className="text-[0.6rem] uppercase tracking-wider">{label}</span>
    </button>
  );
}
