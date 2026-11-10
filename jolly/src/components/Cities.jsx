
const CITIES = [
  {
    id: 'bangalore',
    name: 'Bangalore',
    local: 'ಬೆಂಗಳೂರು',
    lang: 'kn',
    line: 'Look for Jolly Ice creams at shops and parlours across the city.'
  },
  {
    id: 'salem',
    name: 'Salem',
    local: 'சேலம்',
    lang: 'ta',
    line: 'Scooping now, and very welcome on a Salem summer day.'
  }
];

export default function Cities() {
  return (
    <section className="cities" id="find-us" aria-labelledby="cities-title">
      <h2 id="cities-title" className="cities-title">
        Now in two cities
      </h2>
      <div className="cities-grid">
        {CITIES.map((c) => (
          <article key={c.id} className={`city city--${c.id}`}>
            <p className="city-local" lang={c.lang}>
              {c.local}
            </p>
            <h3 className="city-name">{c.name}</h3>
            <p className="city-line">{c.line}</p>
            <svg className="city-drip" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 0 H400 V18 C380 18 378 52 362 52 C346 52 348 18 330 18 C260 18 240 18 220 18 C204 18 206 40 192 40 C178 40 180 18 164 18 C100 18 80 18 60 18 C44 18 46 58 30 58 C14 58 16 18 0 18 Z" />
            </svg>
          </article>
        ))}
      </div>
    </section>
  );
}
