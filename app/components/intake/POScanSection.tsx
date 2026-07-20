"use client";
import { useRef } from "react";
import { HiOutlineCamera, HiOutlineSparkles } from "react-icons/hi";
import { useToast } from "@/hooks/useToast";
import { useIntakeStore } from "@/hooks/useIntakeStore";
import type { ScanPOResponse } from "@/api/scan-po/route";
import { PO_COMPRESSION } from "@/lib/image-compression";
import { loadCompressedImages } from "@/components/intake/load-images";
import { blobUrlToBase64, toBlobProxyUrl } from "@/lib/blob-upload";
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
 * PO scanning section of the Enter Job sheet.
 *
 * Stages PO page photos, then sends them all to the scan-po API which uses
 * Claude to auto-fill the intake form via the intake store.
 */
export function POScanSection() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    poPages,
    scanning,
    scanResult,
    scanData,
    showRawData,
    addPoPages,
    removePoPage,
    setScanning,
    setShowRawData,
    applyScanResult,
    setScanError,
  } = useIntakeStore();

  // Add pages to staging area (don't scan yet)
  const handleAddPages = async (files: FileList) => {
    try {
      const { images, oversizedMessages } = await loadCompressedImages(
        files,
        PO_COMPRESSION,
        "PO page",
        "po-pages",
      );
      oversizedMessages.forEach(showToast);

      if (images.length === 0) {
        showToast("No images could be processed");
        return;
      }

      addPoPages(images);
      showToast(`${images.length} page(s) added`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to load images: ${errorMessage}`);
      console.error("Error loading images:", error);
    }
  };

  // Trigger actual scan of all staged pages
  const handleScanAllPages = async () => {
    if (poPages.length === 0) return;

    setScanning(true);

    try {
      // Fetch each staged page back from Blob storage and re-encode as base64 for Claude
      const base64DataArray = await Promise.all(poPages.map(blobUrlToBase64));

      // Call API route to scan all pages
      const response = await fetch("/api/scan-po", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base64DataArray }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Scan failed");
      }

      const result: ScanPOResponse = await response.json();

      // Apply all scan results at once (includes setting scanning: false)
      applyScanResult(result);
      showToast("PO scanned successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setScanError(errorMessage);
      showToast("Scan failed: " + errorMessage);
    }
  };

  return (
    <div className="mb-5">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
        SCAN PO —{" "}
        <span className="font-normal normal-case text-gray-400">
          Claude auto-fills the form
        </span>
      </label>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            handleAddPages(files);
            // Reset input so same file can be selected again
            e.target.value = "";
          }
        }}
      />
      {poPages.length > 0 ? (
        <div className="space-y-3">
          {/* Carousel for PO pages */}
          {poPages.length === 1 ? (
            // Single image - no carousel needed
            <div className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <img
                src={toBlobProxyUrl(poPages[0])}
                alt="PO Page"
                className="w-full rounded-lg"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                Page 1 of 1
              </div>
              <button
                onClick={() => removePoPage(0)}
                disabled={scanning}
                className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 disabled:opacity-50 shadow-lg"
              >
                ×
              </button>
            </div>
          ) : (
            // Multiple images - use carousel
            <Carousel className="w-full">
              <CarouselContent>
                {poPages.map((page, index) => (
                  <CarouselItem key={index}>
                    <div className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={toBlobProxyUrl(page)}
                        alt={`PO Page ${index + 1}`}
                        className="w-full rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                        Page {index + 1} of {poPages.length}
                      </div>
                      <button
                        onClick={() => removePoPage(index)}
                        disabled={scanning}
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 disabled:opacity-50 shadow-lg"
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

          {/* Action buttons - always visible */}
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="w-full border border-dashed border-teal-500 bg-emerald-50 rounded-lg py-3 text-gray-600 text-sm font-medium hover:bg-teal-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <HiOutlineCamera />
              Add page
            </Button>
            <Button
              onClick={handleScanAllPages}
              disabled={scanning}
              className="w-full py-3 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <HiOutlineSparkles />
              {scanning ? "Scanning..." : scanResult ? "Rescan PO" : "Scan PO"}
            </Button>
          </div>

          {/* Scan result display */}
          {scanResult && (
            <div
              className={`text-sm px-3 py-3 rounded-lg border ${
                scanResult.startsWith("✓")
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {scanResult.startsWith("✓") ? (
                <div>
                  {scanResult.split("\n").map((line, i) => (
                    <div
                      key={i}
                      className={i === 0 ? "font-semibold mb-1" : "text-sm"}
                    >
                      {line}
                    </div>
                  ))}
                  {scanData && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <button
                        onClick={() => setShowRawData(!showRawData)}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 font-medium"
                      >
                        <span>{showRawData ? "▼" : "▶"}</span>
                        Show raw scan data
                      </button>
                      {showRawData && (
                        <pre className="mt-2 text-xs bg-white/50 rounded p-2 overflow-x-auto text-gray-700 font-mono">
                          {JSON.stringify(scanData, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                scanResult
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 text-sm disabled:opacity-50 flex flex-col items-center gap-2"
        >
          <div className="text-3xl">📷</div>
          <div className="font-medium text-gray-700">
            {scanning ? "Scanning..." : "Tap to photograph PO"}
          </div>
          <div className="text-xs text-gray-500">
            Add multiple pages one at a time · Claude reads customer, PO number
            & parts
          </div>
        </button>
      )}
    </div>
  );
}
