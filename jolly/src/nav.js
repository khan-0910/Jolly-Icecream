// The nav is clear over the stage. Past it, it steps aside on the way down and comes back as a bar on the way up.
export function syncNav({ direction }) {
  const nav = document.querySelector('.nav');
  const past = document.getElementById('top').getBoundingClientRect().bottom < window.innerHeight - 2;
  nav.classList.toggle('nav--bar', past);
  nav.classList.toggle('nav--away', past && direction > 0);
}

export const inkNav = (color) => document.querySelector('.nav').style.setProperty('--nav', color);
