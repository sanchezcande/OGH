import { Player } from '@lottiefiles/react-lottie-player';

const LottieAnimation = ({ animationPath, width = 300, height = 300 }) => {
  return (
    <Player
      src={animationPath}
      background="transparent"
      speed={1}
      loop
      autoplay
      style={{ width, height }}
    />
  );
};

export default LottieAnimation;
