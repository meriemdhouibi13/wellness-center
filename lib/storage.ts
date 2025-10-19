import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getApp, getApps } from 'firebase/app';

function getFirebaseStorage() {
  if (!getApps().length) throw new Error('Firebase not initialized');
  const app = getApp();
  return getStorage(app);
}

export async function uploadUserAvatar(
  uid: string,
  uri: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storage = getFirebaseStorage();

  // Fetch the file as blob
  const resp = await fetch(uri);
  const blob = await resp.blob();

  const fileRef = ref(storage, `avatars/${uid}/avatar_${Date.now()}.jpg`);
  const uploadTask = uploadBytesResumable(fileRef, blob as any);

  // Wrap in a promise that resolves when complete
  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes) {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          onProgress(progress);
        }
      },
      (error) => reject(error),
      () => resolve()
    );
  });

  const url = await getDownloadURL(fileRef);
  return url;
}
