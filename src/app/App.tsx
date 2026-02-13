import { ValentineExperience } from './components/ValentineExperience';
import puzzleImage from 'figma:asset/b806966b77e0a8ca2dd95e03ef1079851d637f43.png';
import fullImage from 'figma:asset/ca3588c5ab4f61d95b21818c122f9c52e9f54285.png';

export default function App() {
  return (
    <div className="size-full min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-purple-50">
      <ValentineExperience 
        puzzleImageSrc={puzzleImage} 
        fullImageSrc={fullImage}
        gridSize={3} 
      />
    </div>
  );
}
