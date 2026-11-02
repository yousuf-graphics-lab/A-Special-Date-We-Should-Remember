/**
 * Every word Samiya reads lives here, so the experience stays easy to edit.
 * Yousuf's letters and poem are reproduced exactly as written — please keep
 * them that way.
 */

export const SITE = {
  name: 'For Samiya',
  herName: 'Samiya',
  hisName: 'Yousuf',
  timeZone: 'Asia/Dhaka',
  music: {
    src: '/audio/a-quiet-promise.mp3',
    chime: '/audio/unlock-chime.mp3',
    title: 'A Quiet Promise',
    credit: 'Written and recorded for Samiya',
    volume: 0.32,
  },
} as const;

/* -------------------------------------------------------------------------- */
/* 1. The birthday lock                                                        */
/* -------------------------------------------------------------------------- */

const BIRTHDAY_DIGITS = '14112007'; // 14.11.2007 — held only in the browser.

export function normaliseBirthdayInput(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

/** Accepts 14.11.2007 / 14112007 / 14-11-2007 (and the same with slashes). */
export function isBirthdayAnswer(raw: string): boolean {
  const digits = normaliseBirthdayInput(raw);
  if (!digits) return false;
  if (digits === BIRTHDAY_DIGITS) return true;
  // Also allow the year first, in case she naturally writes it that way.
  if (digits === '20071411') return true;
  return false;
}

export const LOCK_COPY = {
  eyebrow: 'A little world, kept for you',
  title: 'Hey, My Samiya',
  subtitle: 'Someone has a little surprise for you.',
  hint: 'Before you enter my little world, unlock it with something only I would remember about you.',
  passwordLabel: 'Her birthday',
  passwordPlaceholder: 'DD.MM.YYYY',
  button: 'Unlock',
  unlockError: 'Hmm, not quite, my love. Try once more.',
  emptyError: 'Type my birthday first, my love.',
  footnote: 'This little lock is just between us — nothing is stored.',
} as const;

/* -------------------------------------------------------------------------- */
/* 2. The letter                                                               */
/* -------------------------------------------------------------------------- */

export const LETTER_ONE = {
  heading: 'My Dearest Samiya,',
  paragraphs: [
    'Sometimes, I wonder how one person can mean so much to another. Then I think of you, and somehow, my heart finds its answer.',
    'You have a special place in my heart that no words could ever fully describe. Your smile brings me happiness, your presence brings me peace, and even the smallest thoughts of you make my ordinary days feel beautiful.',
    'If there is one thing I wish for, it is to spend more beautiful moments with you, to see your smile a little closer, to hold your hand, and to make memories that we will always keep in our hearts.',
    'I may not always find the perfect words to express my feelings, but please know that you are precious to me in ways I cannot explain.',
    'You are not just someone I love. You are someone who makes my heart feel something truly special.',
  ],
  signOff: 'With all my love,',
  signature: 'Yousuf',
  envelopeLabel: 'For my Samiya',
  envelopeHint: 'Tap the seal to open',
  cta: "There's something more for you",
} as const;

/* -------------------------------------------------------------------------- */
/* 3. Flowers & poem                                                           */
/* -------------------------------------------------------------------------- */

export const FLOWERS_COPY = {
  eyebrow: 'A bouquet, picked for you',
  title: 'For The Girl Who Makes My World Beautiful',
  intro:
    'If I could give you something that would last forever, I would give you the way I see you. But since I cannot put that feeling into a gift, I tried to put a little of it into these words.',
  cta: 'Can I ask you something, Samiya?',
  bouquetNote: 'Every flower here is a thought of you.',
} as const;

export const POEM_TITLE = 'Tomar Chokhe';

export const POEM_STANZAS: string[][] = [
  [
    'Tomar chokhe takale mone hoy, hariye jai dur ojanay,,,',
    'Jeno hajar tarar mela bosheche nirob rater akasher konai...',
  ],
  [
    'Tomar kalo chuler chhayay, jodi ektu thai petam,,,',
    'Prithibir shob klanti bhule tomar majhei hariye jetam...',
  ],
  [
    'Tomar chokher mayay ache ek odbhut jadu,,,',
    'Ekbar takalei mon bole, tomakei bhalobashi jay shudhu...',
  ],
  [
    'Tomar ghono kalo chul jokhon batashe alto kore ure jay,,,',
    'Mone hoy kalo megher arale chand meteche lukochurir khelay...',
  ],
  [
    'Tomar ruper bornona dite ami chander upoma ani,,,',
    'Tobu chandke har manay tomar mukher mishti kahini...',
  ],
  [
    'Tumi shudhu shundor nou, tumi amar mugdhotar golpo,,,',
    'Tomay dekhle hridoy bole, ei onubhuti noy to eto olpo...',
  ],
  [
    'Tumi amar chokhe shobcheye shundor kobita,,,',
    'Tomay bhalobasha jeno hridoyjure ek mishti purnota...',
  ],
  [
    'Tomar chokhe shopno hoye, tomar chule hawa hoye,',
    'Thakte chai tomar pashe, ajibon evabe tomar roye...',
  ],
];

/* -------------------------------------------------------------------------- */
/* 4. The proposal                                                             */
/* -------------------------------------------------------------------------- */

export const PROPOSAL_COPY = {
  eyebrow: 'Under the same evening sky',
  title: 'My Samiya',
  line: "I have something I've been wanting to ask you.",
  question: 'Can I take you on a date?',
  sub: 'Just you and me, some beautiful moments, a little happiness, and memories that we can keep in our hearts.',
  yes: "Yes, I'd love to",
  no: 'No, not today',
  dodges: [
    'Are you sure, my love?',
    'Give my heart one more chance?',
    'It moved on its own, I promise.',
    "One tiny yes, and I'll stop running?",
  ],
  settled: "Alright — the choice is yours, and I'll respect it either way.",
  declineTitle: "That's okay, Samiya.",
  declineBody:
    "Your happiness matters to me more than anything. Maybe we can choose another day when you feel like it.",
  declineRetry: 'Give it another thought',
  declineLeave: 'Leave for now',
  leaveBody: 'The door stays open, and so does my heart. Come back whenever you feel like it.',
} as const;

/* -------------------------------------------------------------------------- */
/* 5. Planning                                                                 */
/* -------------------------------------------------------------------------- */

export const PLANNER_COPY = {
  eyebrow: 'Our little plan',
  title: "Then it's a date, my love!",
  sub: 'Now tell me, when would you like us to make this little dream come true?',
  calendarLabel: 'Choose a day',
  timeLabel: 'Choose a time',
  customTimeLabel: 'Or a time that suits you',
  activityLabel: 'What kind of date would make you happiest?',
  activityHelper: 'Pick whichever feels most like you.',
  messageLabel: 'Anything you want me to know before our date?',
  messagePlaceholder: 'Anything you want me to know before our date?',
  messageHelper: 'Completely optional.',
  confirm: 'Confirm Our Little Date',
  confirming: 'Saving our little plan…',
  summaryTitle: 'Our little appointment',
  summaryEmpty: 'Pick a day and a time, and it will appear here.',
  dateRequired: 'Please choose a day first, my love.',
  timeRequired: 'Please choose a time.',
  activityRequired: 'Please choose the kind of date you would like.',
  activityCustomRequired: 'Tell me where you have in mind.',
  pastDate: 'That day has already passed — choose one ahead of us.',
  saveError: "I couldn't save our plan just now. Your choices are still here — please try once more.",
  savedNote: 'This is your preferred plan for us, not a booking — we will arrange it together.',
} as const;

export type ActivityId =
  | 'coffee'
  | 'dinner'
  | 'walk'
  | 'sunset'
  | 'surprise'
  | 'elsewhere';

export const ACTIVITIES: {
  id: ActivityId;
  label: string;
  note: string;
}[] = [
  { id: 'coffee', label: 'A peaceful coffee date', note: 'Two cups, no rush.' },
  { id: 'dinner', label: 'A lovely dinner together', note: 'Candlelight and conversation.' },
  { id: 'walk', label: 'A walk while talking about everything', note: 'No destination needed.' },
  { id: 'sunset', label: 'A beautiful place with a sunset view', note: 'Golden hour, just us.' },
  { id: 'surprise', label: 'A surprise date planned by Yousuf', note: 'Leave it to me.' },
  { id: 'elsewhere', label: 'Somewhere else you have in mind', note: 'Your idea, my favourite plan.' },
];

export const ACTIVITY_LABELS: Record<ActivityId, string> = ACTIVITIES.reduce(
  (acc, item) => ({ ...acc, [item.id]: item.label }),
  {} as Record<ActivityId, string>,
);

export const TIME_SLOTS = [
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
] as const;

export const STAGES = [
  { id: 'lock', label: 'The Secret' },
  { id: 'letter', label: 'My Letter' },
  { id: 'flowers', label: 'Flowers and Poetry' },
  { id: 'proposal', label: 'The Question' },
  { id: 'plan', label: 'Our Date' },
  { id: 'thanks', label: 'A Little Thank You' },
] as const;

export type StageId = (typeof STAGES)[number]['id'];

/* -------------------------------------------------------------------------- */
/* 6. Thank you                                                                */
/* -------------------------------------------------------------------------- */

export const LETTER_TWO = {
  heading: 'My Dearest Samiya,',
  paragraphs: [
    'You have no idea how happy this little moment has made me. Just knowing that we are going to spend some time together gives me something beautiful to look forward to.',
    'I am already imagining the little things, your smile, our conversations, the way time might pass without us even noticing, and all those simple moments that somehow become the most precious memories.',
    'I do not need everything to be perfect. I just want us to enjoy ourselves, laugh together, talk about everything and nothing, and make a memory that will bring a smile to our faces whenever we think about it.',
    'Thank you for being someone so special in my life. I hope this date becomes one of those little moments that we both remember with a smile.',
    'Until then, take care of yourself for me.',
  ],
  signOff: 'With all my love,',
  signature: 'Yousuf',
  closing: 'Looking forward to seeing you, Samiya.',
  readAgain: 'Read My Letter Again',
  review: 'Review Our Date',
} as const;

export const OPTIONAL_COPY = {
  voice: {
    eyebrow: 'Optional',
    title: 'A Little Message From You',
    body: "If you feel like it, leave me a little voice message. I'd love to hear what you have to say.",
    privacy:
      'If you submit a recording, it stays private and only Yousuf can listen to it in his admin panel.',
    record: 'Record Voice',
    stop: 'Stop Recording',
    listen: 'Listen to Recording',
    listenHint: 'Listen to Recording',
    remove: 'Delete Recording',
    again: 'Record Again',
    submit: 'Submit Voice Message',
    submitted: 'Voice message saved privately for Yousuf.',
    skip: 'You can skip this — it is entirely your choice.',
  },
  photos: {
    eyebrow: 'Optional',
    title: 'Five Little Moments From You',
    body: "If you'd like to share five pictures with me, I'd love to keep these little memories close to my heart. Only share the pictures you're comfortable sharing.",
    privacy:
      'Anything you share here is private — only Yousuf can see it, in his admin panel.',
    add: 'Add a photo',
    replace: 'Replace',
    remove: 'Remove',
    moveLeft: 'Move photo earlier',
    moveRight: 'Move photo later',
    count: (n: number) => `${n} of 5 photos selected`,
    submit: 'Share These Photos',
    submitted: 'Photos shared privately with Yousuf.',
    emptyHint:
      'Choose up to five photos — one is perfectly lovely too. You can skip this completely.',
    skip: 'No photos? That is completely fine.',
    max: 'Five photos is the little limit here.',
    typeError: 'Please choose a JPEG, PNG or WebP photo.',
    sizeError: 'That photo is a little too large (max 8 MB).',
  },
  location: {
    eyebrow: 'Optional',
    title: 'Where Would You Love to Meet?',
    body: 'If you already have a place in mind, tell me. Or share where you are, and I will come to you.',
    placeLabel: 'Place name or address',
    placePlaceholder: 'e.g. a little café by the river',
    share: 'Share My Current Location',
    sharing: 'Finding your location…',
    shared: 'Your current location is ready to be shared.',
    clear: 'Remove location',
    privacy:
      'Only the place you submit is shared — never your live location. Only Yousuf can see it, in his admin panel.',
    denied:
      "No problem at all — your browser didn't share it. You can type a place instead, or skip this.",
    error: "I couldn't read your location just now. You can type a place instead, or skip this.",
    skip: 'You can leave this blank and still confirm our date.',
    manualNote: 'Saved as a place you chose.',
    deviceNote: 'Saved as your current location at the moment you shared it.',
  },
} as const;
