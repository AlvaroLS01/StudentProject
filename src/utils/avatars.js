const avatarsContext = require.context('../assets/avataressp', false, /\.(png|jpe?g)$/);
const avatars = avatarsContext.keys().map((key) => {
  const src = avatarsContext(key);
  const name = key.replace('./', '').replace(/\.\w+$/, '');
  return { name, src };
});
export function getRandomAvatar() {
  return avatars[Math.floor(Math.random() * avatars.length)].src;
}
export default avatars;
