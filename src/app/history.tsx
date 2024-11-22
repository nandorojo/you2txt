import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

export const useTranscriptionHistory = create(
  persist<{
    videos: {
      id: string;
      title: string;
      created_at: string;
      imgUrl: string;
    }[];
    actions: {
      addVideo: (video: { id: string; title: string; imgUrl: string }) => void;
      removeVideo: (videoId: string) => void;
    };
  }>(
    (set) => ({
      videos: [],
      actions: {
        addVideo: (video) =>
          set((state) => {
            if (state.videos.find((v) => v.id === video.id)) {
              return state;
            }
            return {
              videos: [
                ...state.videos,
                {
                  id: video.id,
                  title: video.title,
                  created_at: new Date().toISOString(),
                  imgUrl: video.imgUrl,
                },
              ],
            };
          }),
        removeVideo: (videoId) =>
          set((state) => ({
            videos: state.videos.filter((v) => v.id !== videoId),
          })),
      },
    }),
    {
      name: "transcription-history2",
      storage: createJSONStorage(() => localStorage),
      partialize({ actions, ...rest }) {
        return rest as any;
      },
    }
  )
);
