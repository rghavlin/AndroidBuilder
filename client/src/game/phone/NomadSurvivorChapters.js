/**
 * "Nomad Survivor" — the field manual saved on the player's phone as an e-book.
 *
 * It used to be nine paperback volumes found as loot. Now it is one book with
 * a chapter per build, and a chapter's recipe unlocks when the player has read
 * every page of it (see NomadSurvivorEbook.readChapter).
 *
 * Pure data, no imports, so GameEngine can seed fresh-game progress from it
 * without pulling in the phone or crafting modules.
 *
 * `id` is the chapter's progress key in engine.bookStats AND the value recipes
 * name in `requiredBook`. It keeps the old paperback defIds on purpose: saves
 * already carry progress under these keys, and the crafting gate already reads
 * them, so nothing has to be migrated. `number` is only the display order, so
 * it need not match the old volume number (volume 1, the sled, was removed).
 *
 * `pages` is what reading the chapter costs (1 AP per page). The ingredient
 * list is NOT written into the prose — the reader builds it from the recipe
 * itself once the chapter is finished, so the two can't drift apart.
 *
 * Body blocks use the same types as PhoneMessages ('text', 'heading', 'steps',
 * 'bullets', 'note'). The reader reveals them in proportion to pages read.
 */

export const NOMAD_SURVIVOR_TITLE = 'Nomad Survivor';
export const NOMAD_SURVIVOR_SUBTITLE = 'A field manual for life on the move';

export const NOMAD_SURVIVOR_CHAPTERS = [
  {
    id: 'book.nomad_survivor_2',
    number: 1,
    title: 'The Planter Box',
    pages: 15,
    body: [
      { type: 'text', text: 'Tins run out. Gardens do not, if you treat them right. A planter box turns any patch of ground, rooftop or porch into a place food can grow.' },
      { type: 'heading', text: 'Building the box' },
      { type: 'steps', items: [
        'Frame four sides from planks and nail the corners square.',
        'Fill the box with good soil, not dirt scraped from a roadside.',
        'Set it where it will catch the sun for most of the day.'
      ] },
      { type: 'note', text: 'Seeds want water and patience. Check them every day; they will not forgive a week of neglect.' }
    ]
  },
  {
    id: 'book.nomad_survivor_3',
    number: 2,
    title: 'The Rain Collector',
    pages: 15,
    body: [
      { type: 'text', text: 'You can go weeks without food but only days without water, and every stream within walking distance of a town is suspect. The sky is the cleanest well you have.' },
      { type: 'heading', text: 'Catching the rain' },
      { type: 'steps', items: [
        'Build a wide catchment and slope it toward a single outlet.',
        'Seal the joints so the water ends up in the container, not on the ground.',
        'Place it in the open, away from overhanging trees and rooftops.'
      ] },
      { type: 'note', text: 'Even rainwater picks up grime from the collector. Boil it when you can.' }
    ]
  },
  {
    id: 'book.nomad_survivor_4',
    number: 3,
    title: 'The Wagon',
    pages: 30,
    body: [
      { type: 'text', text: 'Everything you own is either on your back or somewhere you can no longer reach. The first rule of the road is to stop carrying what you could be pulling. The wagon is where moving stops being a struggle and starts being a plan.' },
      { type: 'heading', text: 'Wheels change everything' },
      { type: 'text', text: 'Wheels carry the weight so your legs do not have to. On a road a loaded wagon covers ground no pack could, and the bed can be fitted out later with whatever the trip demands.' },
      { type: 'steps', items: [
        'Build a stiff, flat bed. Flex in the frame shakes the wheels loose.',
        'Mount the wheels true — a wobbling wheel will wear through its fixing in a day.',
        'Fit a handle long enough that the wagon will not clip your heels.'
      ] },
      { type: 'note', text: 'A wagon is a platform, not just a cart. Leave room to bolt things onto it.' }
    ]
  },
  {
    id: 'book.nomad_survivor_5',
    number: 4,
    title: 'The Solar Charger',
    pages: 40,
    body: [
      { type: 'text', text: 'The grid is gone, but the sun still comes up every morning. Anything with a battery can be kept alive if you can catch a little of it.' },
      { type: 'heading', text: 'Wiring a charging station' },
      { type: 'steps', items: [
        'Salvage the panel cells and mount them on a rigid backing.',
        'Wire them to a charging cradle. Mind the polarity; reversed leads kill batteries.',
        'Set it outdoors, in daylight, angled toward the sun.'
      ] },
      { type: 'heading', text: 'Living with it' },
      { type: 'bullets', items: [
        'It does nothing at night or under a roof.',
        'Overcast days charge slowly. Plan around the weather.',
        'A charged spare battery is worth more than a full one in a dead device.'
      ] }
    ]
  },
  {
    id: 'book.nomad_survivor_6',
    number: 5,
    title: 'The Cargo Wagon',
    pages: 50,
    body: [
      { type: 'text', text: 'Out here you never stay put, so your home has to come with you. The cargo wagon is that home: your stores, your tools and your bed, all on wheels, trading a little speed for a great deal of room.' },
      { type: 'heading', text: 'Going bigger' },
      { type: 'text', text: 'A bigger bed means more weight on every joint. Everything that was good enough on the small wagon must be heavier here: thicker boards, stronger axles, more fixings.' },
      { type: 'steps', items: [
        'Frame a long bed and brace it at every joint — this one carries far more than the small wagon.',
        'Add a third axle in the middle so the bed cannot sag between the wheels.',
        'Load it evenly front to back before the first long haul.'
      ] },
      { type: 'note', text: 'If it is motorised, a heavier wagon drinks its battery faster. Carry spares.' }
    ]
  },
  {
    id: 'book.nomad_survivor_7',
    number: 6,
    title: 'The Stun Rod',
    pages: 25,
    body: [
      { type: 'text', text: 'Sometimes you cannot afford the noise of a gunshot, and sometimes you cannot afford to get close enough to swing a hammer twice. A stun rod buys you a moment.' },
      { type: 'heading', text: 'Building it' },
      { type: 'steps', items: [
        'Start with a sturdy rod that will not bend on impact.',
        'Run the leads to contacts at the striking end and insulate the grip thoroughly.',
        'Seat the power cell where a hard hit will not knock it loose.'
      ] },
      { type: 'heading', text: 'Using it' },
      { type: 'bullets', items: [
        'A stunned target is not a dead one. Use the opening.',
        'Every jolt drains the cell. Keep it charged before you need it.'
      ] }
    ]
  },
  {
    id: 'book.nomad_survivor_8',
    number: 7,
    title: 'The Auto Turret',
    pages: 50,
    body: [
      { type: 'text', text: 'You have to sleep. Something has to keep watch while you do. An automated turret is the closest thing to a second pair of eyes you will find out here.' },
      { type: 'heading', text: 'The parts that matter' },
      { type: 'bullets', items: [
        'A rifle reliable enough to fire unattended.',
        'A motion sensor to wake it, and a laser to aim it.',
        'A motor to traverse, and a plate to protect the works.'
      ] },
      { type: 'heading', text: 'Assembly' },
      { type: 'steps', items: [
        'Mount the rifle on a rod pivot driven by the motor.',
        'Wire the sensor and laser so they trigger the traverse before the trigger.',
        'Shield the mechanism. A turret that takes one hit and stops is not a defence.'
      ] },
      { type: 'note', text: 'A turret does not know friend from foe unless you tell it. Never stand downrange of one you did not set.' }
    ]
  },
  {
    id: 'book.nomad_survivor_9',
    number: 8,
    title: 'Remote Control',
    pages: 50,
    body: [
      { type: 'text', text: 'The phone in your pocket cannot call anyone anymore, but it can still talk to a receiver. Give a wagon ears, and you can send it where you would rather not walk.' },
      { type: 'heading', text: 'The RC receiver' },
      { type: 'text', text: "A spare smartphone holds everything a receiver needs: a radio, an antenna and a board to decode the signal. Strip it down, wire it in, and pair it with your own handset." },
      { type: 'heading', text: 'The autonomous controller' },
      { type: 'text', text: 'A receiver obeys. A controller decides. Add a processor and the wagon can find its own way to a destination you give it, without you steering every step.' },
      { type: 'steps', items: [
        'Build and test the receiver before you attempt the controller.',
        'Fit the processor to the receiver board.',
        'Mount the controller in the wagon and set a short first trip.'
      ] },
      { type: 'note', text: 'Every order you send costs the phone power. A dead phone strands whatever it was driving.' }
    ]
  }
];

/** Chapter by its id (the bookStats key / recipe requiredBook), or null. */
export function getNomadChapter(id) {
  return NOMAD_SURVIVOR_CHAPTERS.find(c => c.id === id) || null;
}

/** Fresh-game progress for every chapter: nothing read. */
export function freshChapterStats() {
  const stats = {};
  for (const chapter of NOMAD_SURVIVOR_CHAPTERS) {
    stats[chapter.id] = { pagesLeft: chapter.pages, milestonesReached: 0 };
  }
  return stats;
}

/**
 * Fill in progress for any chapter a save doesn't mention, as unread.
 * Never touches chapters the save already has — games saved while every
 * recipe was free keep their recipes.
 */
export function ensureChapterStats(engine) {
  if (!engine) return;
  if (!engine.bookStats) engine.bookStats = {};
  for (const chapter of NOMAD_SURVIVOR_CHAPTERS) {
    if (!engine.bookStats[chapter.id]) {
      engine.bookStats[chapter.id] = { pagesLeft: chapter.pages, milestonesReached: 0 };
    }
  }
}
