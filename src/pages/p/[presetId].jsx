import { useRouter } from 'next/router';
import ImageGeneratorPage from '../ImageGenerator';

export default function PresetPage() {
  // The preset loading is handled in ImageGenerator.jsx via useEffect
  return <ImageGeneratorPage />;
}
