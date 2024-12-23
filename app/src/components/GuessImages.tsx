import "../App.css";
import { IPuzzleImage, IPuzzleState } from "../logic/types";
import { useEffect, useRef, useState } from "react";
import { IMAGE_PLACEHOLDER_CAPTION } from "../constants";
import { ImageModal } from "./GameImages";

export const GradientPlaceholder = ({
  displayPlaceholder,
  isLoading,
}: {
  displayPlaceholder: boolean;
  isLoading: boolean;
}) => (
  <div className="h-full w-full overflow-hidden">
    <div
      className={`h-full w-full bg-gradient-to-br from-pastelBlue via-pastelPeach to-pastelCoral flex items-center justify-center 
        ${displayPlaceholder && !isLoading ? "bg-[size:100%_100%]" : "animate-gradient bg-[size:400%_400%]"}`}
    ></div>
  </div>
);

export const ImageDisplay = ({ image }: { image: IPuzzleImage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <>
      <div
        className="overflow-hidden rounded-3xl shadow-[4px_6px_6px_-2px_rgba(0,0,0,0.25)]"
        onClick={() => {
          if (!image.isLoading) setIsExpanded(true);
        }}
      >
        <div className="aspect-square">
          {image.isLoading || image.displayPlaceholder ? (
            <GradientPlaceholder
              displayPlaceholder={image.displayPlaceholder}
              isLoading={image.isLoading}
            />
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

const CarouselImage = ({ image }: { image: IPuzzleImage }) => {
  return (
    <div>
      <ImageDisplay image={image} />
    </div>
  );
};

const GuessIndicator = ({
  index,
  caption,
  isGuessed,
  isSelected,
  onSelect,
}: {
  index: number;
  caption: string;
  isGuessed: boolean;
  isSelected: boolean;
  onSelect: (index: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineClamp, setLineClamp] = useState(2);

  // Dynamically calculate the number of lines to display based on the container height
  useEffect(() => {
    const calculateLines = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const lineHeight = 1.2 * 16; // assuming 16px font-size and 1.2 line-height
        const maxLines = Math.floor(containerHeight / lineHeight);
        setLineClamp(maxLines);
      }
    };

    calculateLines();
    window.addEventListener("resize", calculateLines);
    return () => {
      window.removeEventListener("resize", calculateLines);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={() => {
        onSelect(index);
      }}
      className={`rounded-2xl px-2 py-2 flex-grow flex items-center justify-center text-md cursor-pointer ${
        isSelected
          ? "shadow-[0px_0px_5px_0px_rgba(0,0,0,0.2)] bg-pastelBlue"
          : "bg-pastelBlueLightGray/70 hover:bg-pastelBlue/50 text-pastelLighterGray"
      }`}
    >
      <p
        className="w-full overflow-hidden text-center"
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: lineClamp,
          lineHeight: "1.2em",
        }}
      >
        {isGuessed ? caption : IMAGE_PLACEHOLDER_CAPTION}
      </p>
    </div>
  );
};

export default function GuessImages({
  puzzleState,
  onGuessSelect,
}: {
  puzzleState: IPuzzleState | undefined;
  onGuessSelect: (index: number) => void;
}) {
  if (!puzzleState) return null;

  const guessIndicators = Array(puzzleState.guessesTotal).fill(null);

  return (
    <div className="bg-pastelWhite rounded-3xl px-6 py-6">
      {/* Image Carousel */}
      <div className="flex flex-row gap-4 max-w-full">
        <div className="flex flex-col w-2/3">
          <CarouselImage
            image={
              puzzleState.guessImages[puzzleState.currentSelectedGuessIndex]
            }
          />
        </div>

        {/* Guess Indicators */}
        <div className="flex flex-col gap-2 w-1/3">
          {guessIndicators.map((_, index) => (
            <GuessIndicator
              key={index}
              index={index}
              caption={
                index < puzzleState.guessImages.length
                  ? puzzleState.guessImages[index].caption
                  : ""
              }
              isGuessed={index < puzzleState.guessImages.length}
              isSelected={index === puzzleState.currentSelectedGuessIndex}
              onSelect={onGuessSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
