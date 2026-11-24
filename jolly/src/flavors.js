// Each flavour: copy, the flood colours behind it, and the colours of its 3D scoop.
// scoop/scoopShade colour the hand-drawn cone, used only where 3D isn't available.
export const FLAVORS = [
  {
    id: 'vanilla', name: 'Vanilla', lines: ['Vanilla'], type: 0,
    tagline: 'The classic, duh.',
    body: 'Soft, round and creamy, flecked all through with vanilla. The one the whole table agrees on.',
    pairs: 'hot gulab jamun',
    bg: '#FFCE45', word: '#FFF4CF', ink: '#4E2605',
    col: '#FFF0C6', shade: '#F6D88F', bit: '#2E1A0C', scoop: '#FFF8E2', scoopShade: '#F3DFA6'
  },
  {
    id: 'cookies', name: 'Cookies & cream', lines: ['Cookies', '& cream'], type: 1,
    tagline: 'Crunch in every spoon.',
    body: 'Sweet cream packed with dark chocolate cookie, some in big chunks, some crumbled right in.',
    pairs: 'a second scoop',
    bg: '#2B2340', word: '#CFC2F2', ink: '#F6F1FF',
    col: '#F6F1F0', shade: '#DDD3DA', bit: '#241A1C', scoop: '#F6F3F7', scoopShade: '#D9D3DF'
  },
  {
    id: 'strawberry', name: 'Strawberry', lines: ['Strawberry'], type: 2,
    tagline: 'Pink, proud and properly fruity.',
    body: 'Bright strawberry cream with the sweet-sharp taste of real berries, not just the colour.',
    pairs: 'long summer afternoons',
    bg: '#CF1B4C', word: '#FFB9CA', ink: '#FFF1F4',
    col: '#FFA3B9', shade: '#F4738F', bit: '#C4173F', scoop: '#FFB7C7', scoopShade: '#F28FA8'
  },
  {
    id: 'irish', name: 'Irish', lines: ['Irish'], type: 3,
    tagline: 'Smooth, mellow, a little grown-up.',
    body: 'Irish cream flavour, rich and silky, with a soft toffee and coffee warmth that lingers.',
    pairs: 'late dinners',
    bg: '#5E3018', word: '#E9B67B', ink: '#FFEBD2',
    col: '#E3B682', shade: '#C08A52', bit: '#6A3413', scoop: '#E2C29F', scoopShade: '#C99F78'
  },
  {
    id: 'guava', name: 'Guava', lines: ['Guava'], type: 4,
    tagline: 'Yes, there is chilli in it.',
    body: 'Pink guava with a pinch of chilli powder, like the cut guava from the cart outside school. Sweet first, then a little heat.',
    pairs: 'anyone who says they like it spicy',
    bg: '#C3E07F', word: '#F0452F', ink: '#4D110A',
    col: '#FF9384', shade: '#EE6459', bit: '#B3140E', scoop: '#FF9F96', scoopShade: '#EC7A73'
  }
];

// The pinned stage: a title stop, then one stop per flavour.
export const STOPS = [
  { id: 'jolly', lines: ['Jolly'], bg: '#FFCBD9', word: '#E8265E', ink: '#4A0D24', flavor: 2 },
  ...FLAVORS.map((f, i) => ({ id: f.id, lines: f.lines, bg: f.bg, word: f.word, ink: f.ink, flavor: i }))
];
