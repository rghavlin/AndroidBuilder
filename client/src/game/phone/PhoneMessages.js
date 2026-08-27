/**
 * Messages saved on the player's phone.
 *
 * Static for now: these are what was already on the handset when the network
 * went down, so the list is the same in every game. Each entry is keyed by id
 * and the body is a list of blocks rather than one prose string, so a future
 * quest step can add a message (or the reader can restyle one) without anyone
 * having to parse formatting out of the text.
 *
 * Block types: 'text' (a paragraph), 'heading' (a section label), 'steps' (a
 * numbered list), 'bullets' (a dashed list), 'note' (a smaller aside).
 */

export const PHONE_MESSAGES = [
  {
    id: 'cdc-alert',
    from: 'CDC',
    subject: 'CDC ALERT',
    received: 'Emergency broadcast',
    body: [
      { type: 'heading', text: 'Notice:' },
      {
        type: 'text',
        text: "Scientists have discovered antibodies against the zombie virus inside the brainstems of infected humans. These antibodies keep the brainstem intact, allowing it to drive the body's central nervous system."
      },
      { type: 'heading', text: 'Emergency Infection Treatment:' },
      {
        type: 'steps',
        items: [
          'Using a scalpel or knife, extract the brainstem from a recently-dead infected human.',
          'Use a hammer or other crushing object to reduce the brainstem to pulp.',
          'Consume the pulp.',
          'The progression of the virus will be halted for roughly six hours in any patient consuming the brainstem pulp.'
        ]
      },
      { type: 'heading', text: 'Alternative, longer lasting treatment:' },
      {
        type: 'bullets',
        items: ['Boil the brainstem in water and consume it as a stew.']
      },
      { type: 'heading', text: 'PATIENT ZERO', emphasis: true },
      {
        type: 'text',
        text: 'Scientists need the brain of the first individual infected to synthesize a cure for the zombie virus. Patient zero is believed to be in Thompkinsville, approximately 100 miles due south of the Sally Ebberston Biolab. We are asking the general public to be on the lookout for patient zero and to bring the patient to the Sally Ebberston Biolab.'
      },
      {
        type: 'note',
        text: 'Only the head of patient zero is needed to synthesize the cure.'
      }
    ]
  }
];

/** One saved message by id, or null. */
export function getPhoneMessage(id) {
  return PHONE_MESSAGES.find(message => message.id === id) || null;
}
