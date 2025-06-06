// src/sounds.js
import { Howl } from 'howler';

const soundManifest = {
  click: new Howl({ src: ['/sounds/click.mp3'], volume: 0.8 }),
  win: new Howl({ src: ['/sounds/win.mp3'], volume: 0.9 }),
  lose: new Howl({ src: ['/sounds/lose.mp3'], volume: 0.9 }),
};

// Вот ключевой момент - мы экспортируем каждую функцию отдельно
export const playClick = () => {
  soundManifest.click.play();
};

export const playWin = () => {
  soundManifest.win.play();
};

export const playLose = () => {
  soundManifest.lose.play();
};