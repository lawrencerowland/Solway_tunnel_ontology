import emblem0 from '../../../../pics/emblem/emblem0.png';
import emblem1 from '../../../../pics/emblem/emblem1.png';
import emblem2 from '../../../../pics/emblem/emblem2.png';
import emblem3 from '../../../../pics/emblem/emblem3.png';
import emblem4 from '../../../../pics/emblem/emblem4.png';
import emblem5 from '../../../../pics/emblem/emblem5.png';
import emblem6 from '../../../../pics/emblem/emblem6.png';

export default function Storyboard() {
  const images = [
    emblem0,
    emblem1,
    emblem2,
    emblem3,
    emblem4,
    emblem5,
    emblem6,
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl">Storyboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((src, idx) => (
          <img key={idx} src={src} alt={`Storyboard ${idx}`} className="max-w-full h-auto" />
        ))}
      </div>
    </div>
  );
}
