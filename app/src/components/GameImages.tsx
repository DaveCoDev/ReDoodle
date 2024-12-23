import "../App.css";
import { useState } from "react";
import { IPuzzleImage, IPuzzleState } from "../logic/types";

export const GradientPlaceholder = () => (
  <div className="w-full h-full overflow-hidden">
    <div
      className={`w-full h-full bg-gradient-to-br from-pastelBlue via-pastelPeach to-pastelCoral flex items-center justify-center animate-gradient bg-[size:400%_400%]`}
    ></div>
  </div>
);

export const ImageModal = ({
  image: { base64Image, caption },
  onClose,
}: {
  image: IPuzzleImage;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div className="max-w-[90vw] max-h-[90vh]">
      <img
        src={base64Image}
        alt={caption}
        className="max-w-full max-h-[90vh] object-contain"
      />
    </div>
  </div>
);

export const ImageDisplay = ({ image }: { image: IPuzzleImage }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <p className="mb-2 text-center text-pastelGray font-semibold text-lg">
        {image.headingText}
      </p>
      <div
        className="relative overflow-hidden rounded-3xl shadow-[4px_6px_6px_-2px_rgba(0,0,0,0.25)] cursor-pointer"
        onClick={() => {
          if (!image.isLoading) setIsExpanded(true);
        }}
      >
        <div className="w-full aspect-square">
          {image.isLoading ? (
            <GradientPlaceholder />
          ) : (
            <img src={image.base64Image} alt={image.caption} />
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-pastelGray font-semibold text-md">
        <em>{image.caption}</em>
      </p>
      {isExpanded && !image.isLoading && !image.displayPlaceholder && (
        <ImageModal
          image={image}
          onClose={() => {
            setIsExpanded(false);
          }}
        />
      )}
    </>
  );
};

export default function GameImages({
  puzzleState,
}: {
  puzzleState: IPuzzleState;
}) {
  return (
    <div className="bg-pastelWhite rounded-3xl px-6 py-4">
      <div className="flex flex-row gap-6 justify-between">
        <div className="flex-1">
          <ImageDisplay image={puzzleState.startImage} />
        </div>
        <div className="flex-1">
          <ImageDisplay image={puzzleState.goalImage} />
        </div>
      </div>
    </div>
  );
}
