"use client";
import { useRef } from "react";
import { useToast } from "@/hooks/useToast";
import { useIntakeStore } from "@/store/useIntakeStore";
import { PARTS_COMPRESSION } from "@/lib/image-compression";
import { loadCompressedImages } from "@/components/intake/load-images";
import { toSignedImageUrl } from "@/lib/blob-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/**
 * Parts-on-arrival photos section of the Enter Job sheet.
 *
 * Captures condition-record photos of the parts as they arrived.
 */
export function PartsPhotosSection() {
  const { showToast } = useToast();
  const partsPhotoInputRef = useRef<HTMLInputElement>(null);

  const {
    isDispatched,
    partsOnArrivalPhotos,
    addPartsPhotos,
    removePartsPhoto,
  } = useIntakeStore();

  // Add parts photos to array
  const handleAddPartsPhotos = async (files: FileList) => {
    try {
      const { images, oversizedMessages } = await loadCompressedImages(
        files,
        PARTS_COMPRESSION,
        "Parts photo",
        "parts-photos",
      );
      oversizedMessages.forEach(showToast);

      if (images.length === 0) {
        showToast("No images could be processed");
        return;
      }

      addPartsPhotos(images);
      showToast(`${images.length} photo(s) added`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to load images: ${errorMessage}`);
      console.error("Error loading images:", error);
    }
  };

  return (
    <div className="mb-5">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
        PARTS ON ARRIVAL PHOTOS{" "}
        <span className="text-gray-400 font-normal normal-case">
          (optional)
        </span>
      </label>
      <Input
        disabled={isDispatched}
        ref={partsPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            handleAddPartsPhotos(files);
            e.target.value = "";
          }
        }}
      />
      {partsOnArrivalPhotos.length > 0 ? (
        <div className="space-y-3">
          {partsOnArrivalPhotos.length === 1 ? (
            <div className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <img
                src={toSignedImageUrl(partsOnArrivalPhotos[0])}
                alt="Parts Photo"
                className="w-full rounded-lg"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                Photo 1 of 1
              </div>
              <button
                onClick={() => removePartsPhoto(0)}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 shadow-lg"
              >
                ×
              </button>
            </div>
          ) : (
            <Carousel className="w-full">
              <CarouselContent>
                {partsOnArrivalPhotos.map((photo, index) => (
                  <CarouselItem key={index}>
                    <div className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={toSignedImageUrl(photo)}
                        alt={`Parts Photo ${index + 1}`}
                        className="w-full rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                        Photo {index + 1} of {partsOnArrivalPhotos.length}
                      </div>
                      <button
                        onClick={() => removePartsPhoto(index)}
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          )}
          <Button
            onClick={() => partsPhotoInputRef.current?.click()}
            className="w-full border border-dashed border-teal-500 bg-emerald-50 rounded-lg py-3 text-gray-600 text-sm font-medium hover:bg-teal-50 flex items-center justify-center gap-2"
          >
            📦 Add more photos
          </Button>
        </div>
      ) : (
        <button
          disabled={isDispatched}
          onClick={() => partsPhotoInputRef.current?.click()}
          className={`w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-6 text-gray-500 text-sm flex flex-col items-center gap-2 hover:border-gray-400 transition-colors ${isDispatched ? "opacity-75" : ""}`}
        >
          <div className="text-2xl">📦</div>
          <div className="font-medium text-gray-700">
            Tap to photograph parts on arrival
          </div>
          <div className="text-xs text-gray-500">
            Condition record — pallet, box or loose parts
          </div>
        </button>
      )}
    </div>
  );
}
