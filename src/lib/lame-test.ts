
import 'lamejs/lame.all.js';

export const getLame = () => {
  return (window as any).lamejs;
};
