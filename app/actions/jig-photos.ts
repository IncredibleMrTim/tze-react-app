"use server";

import { getAllJigPhotos, getJigPhotosByIds, setJigPhoto } from "@/lib/db";

export async function getJigPhotosAction() {
  try {
    const photos = await getAllJigPhotos();
    return { success: true, photos };
  } catch (error) {
    console.error("Failed to fetch jig photos:", error);
    return {
      success: false,
      photos: {} as Record<string, string>,
      error: "Failed to fetch jig photos",
    };
  }
}

// Fetches specific historical photos by id — used to resolve a CLEARED
// jig assignment's photoId, since the jig may have moved on to newer
// photos since (getAllJigPhotos only returns the latest photo per jig).
export async function getJigPhotosByIdsAction(photoIds: string[]) {
  try {
    const photos = await getJigPhotosByIds(photoIds);
    return {
      success: true,
      photos: photos.reduce(
        (acc: Record<string, string>, photo) => {
          acc[photo.id] = photo.photoData;
          return acc;
        },
        {} as Record<string, string>,
      ),
    };
  } catch (error) {
    console.error("Failed to fetch jig photos by id:", error);
    return {
      success: false,
      photos: {} as Record<string, string>,
      error: "Failed to fetch jig photos by id",
    };
  }
}

export async function setJigPhotoAction(jigId: string, photoUrl: string) {
  await setJigPhoto(jigId, photoUrl);
}
