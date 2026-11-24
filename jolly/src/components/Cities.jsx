const CITIES = [
  { id: 'bangalore', name: 'Bangalore', local: 'ಬೆಂಗಳೂರು', lang: 'kn', line: 'Look for Jolly Ice creams at shops and parlours across the city.' },
  { id: 'salem', name: 'Salem', local: 'சேலம்', lang: 'ta', line: 'Scooping now, and very welcome on a Salem summer day.' }
];

export default function Cities() {
  return (
    <section className="cities" id="find-us" aria-label="Where to find Jolly Ice creams">
      {CITIES.map((c) => (
        <article key={c.id} className={`city city--${c.id}`}>
          <p className="city-local" lang={c.lang} aria-hidden="true">
            {c.local}
          </p>
          <h2 className="city-name">{c.name}</h2>
          <p className="city-line">{c.line}</p>
        </article>
      ))}
    </section>
  );
}
