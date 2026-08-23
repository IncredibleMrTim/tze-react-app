"use server";

import { getAllJigPhotos, setJigPhoto } from "@/lib/db";

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

export async function setJigPhotoAction(jigId: string, photoUrl: string) {
  await setJigPhoto(jigId, photoUrl);
}
