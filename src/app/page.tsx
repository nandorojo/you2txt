"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { Copy, Menu, Settings, Text } from "lucide-react";
import { toast, useToast } from "@/hooks/use-toast";
import { APP_URL } from "./APP_URL";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranscriptionHistory } from "@/app/history";
import { useRef } from "react";
import { useEffect } from "react";
import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

function useMutation() {
  return useAsyncCallback(
    async (
      url: string,
      includeTimestamps: boolean,
      filterOutMusic: boolean
    ) => {
      const response = await fetch(
        `/${url}&timestamps=${includeTimestamps}&filterOutMusic=${filterOutMusic}`
      );
      const id = response.headers.get("id");
      const title = response.headers.get("title");
      const imgUrl = response.headers.get("img-url");
      if (id && title && imgUrl) {
        const s = useTranscriptionHistory.getState();

        s.actions.addVideo({
          id: decodeURIComponent(atob(id)),
          title: decodeURIComponent(atob(title)),
          imgUrl: decodeURIComponent(atob(imgUrl)),
        });
      } else if (response.ok) {
        toast({
          title: "Transcript created, but...",
          description: "We couldn't save it to your history.",
        });
      }
      return response.text();
    },
    {
      onError(e, options) {
        toast({
          title: "Error",
          description: e.message || "Is that a valid YouTube URL?",
          variant: "destructive",
        });
      },
    }
  );
}

export default function Page() {
  const [url, setUrl] = useState("");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [filterOutMusic, setFilterOutMusic] = useState(true);
  const { toast } = useToast();

  const mutation = useMutation();

  return (
    <div className='flex flex-col lg:flex-row'>
      <aside className='z-[0] flex-col hidden lg:flex w-[250px] bg-muted/15 pt-16 gap-2 h-full fixed top-0 left-0 bottom-0 overflow-y-auto'>
        <div className='flex flex-col gap-2 flex-1 m-2 mt-0 bg-muted rounded-lg p-4'>
          <h2 className='font-medium tracking-tight'>Recents</h2>
          <div className='flex flex-col gap-1'>
            <History />
          </div>
        </div>
      </aside>
      <header className='absolute top-0 right-0 p-3 lg:hidden z-50'>
        <HistoryDialog />
      </header>
      <main className='flex min-h-screen bg-background flex-col justify-center gap-4 p-4 lg:flex-1'>
        <header className='absolute top-0 right-0 p-3 lg:hidden'>
          <HistoryDialog />
        </header>

        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            if (!url) return;

            mutation.execute(url, includeTimestamps, filterOutMusic);
          }}
          className='w-full space-y-4 self-center max-w-[680px]'
        >
          <h1 className='text-2xl lg:text-4xl text-left lg:text-center font-bold tracking-tighter'>
            YouTube Video → txt file
          </h1>
          <p className='text-lg lg:text-center text-muted-foreground'>
            Transcribe any YouTube video into a text file and use it to train
            your LLM.
          </p>
          <div className='relative w-full'>
            <div className=' bg-muted/50 pointer-events-none bg-gradient-to-bl from-background-50 to-background-100 dark:from-background-300 dark:to-background-500 rounded-tl-lg rounded-bl-lg absolute inset-y-0 left-0 flex items-center pr-2 pl-3'>
              <span>{APP_URL}/</span>
            </div>
            <input
              type='url'
              placeholder='Paste YouTube URL'
              className='w-full ring-0 outline-none pl-[138px] h-12 border-transparent border-none rounded-lg shadow-lg shadow-gray-700/10 focus:shadow-gray-700/20  focus-visible:border-none dark:shadow-gray-500/10 dark:focus:shadow-gray-500/20 transition-all duration-150'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={mutation.loading}
              required
              autoFocus
              style={
                {
                  // boxShadow: "0 8px 29px -2px",
                }
              }
            />
          </div>

          <div className='flex lg:items-center lg:justify-center gap-2 flex-wrap'>
            <Button
              type='submit'
              className='bg-[#FF0032] hover:bg-red-700 text-white'
              disabled={mutation.loading}
            >
              {mutation.loading ? "Transcribing..." : "Transcribe Video"}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' size='icon' type='button'>
                  <Settings className='h-4 w-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='flex flex-col gap-2'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='timestamps'
                    checked={includeTimestamps}
                    onCheckedChange={(checked) =>
                      setIncludeTimestamps(checked as boolean)
                    }
                  />
                  <label
                    htmlFor='timestamps'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70  select-none'
                  >
                    Include timestamps
                  </label>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='filterOutMusic'
                    checked={filterOutMusic}
                    onCheckedChange={(checked) =>
                      setFilterOutMusic(checked as boolean)
                    }
                  />
                  <label
                    htmlFor='filterOutMusic'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none'
                  >
                    Filter out music (recommended)
                  </label>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </form>

        <TranscriptDialog
          transcript={mutation.result}
          onClose={() => {
            mutation.reset();
          }}
        />

        <a target='_blank' href='https://x.com/fernandotherojo'>
          <footer className='fixed bottom-4 right-4 text-sm text-muted-foreground'>
            By @FernandoTheRojo
          </footer>
        </a>
      </main>
    </div>
  );
}

function TranscriptDialog({
  transcript,
  onClose,
}: {
  transcript: string | undefined;
  onClose: () => void;
}) {
  const prev = useRef(transcript);
  useEffect(() => {
    if (transcript) prev.current = transcript;
  });
  return (
    <Dialog open={Boolean(transcript)} onOpenChange={(n) => !n && onClose()}>
      <DialogContent className='max-h-[80dvh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Transcript</DialogTitle>
        </DialogHeader>
        <div className='whitespace-pre-wrap font-mono text-sm overflow-y-auto flex-1'>
          {transcript ?? prev.current}
        </div>
        <div className='flex justify-end mt-4 gap-2'>
          <Button
            variant='outline'
            onClick={async () => {
              if (!transcript) return;
              await navigator.clipboard.writeText(transcript);
              toast({
                title: "Copied to clipboard",
                description: "Go feed that thing to your LLM.",
              });
            }}
            className='gap-2'
          >
            <Copy className='h-4 w-4' />
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline'>History</Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='overflow-y-auto max-h-[80dvh] gap-2 flex flex-col origin-top-right'
      >
        <History />
      </PopoverContent>
    </Popover>
  );
}

function History() {
  const history = useTranscriptionHistory();
  return (
    <AnimatePresence>
      {history.videos.length === 0
        ? null
        : history.videos
            .slice()
            .reverse()
            .map((video) => {
              if (!video.imgUrl) return null;
              if (!video.title) return null;
              if (!video.id) return null;
              return <HistoryItem {...video} key={video.id} />;
            })}
    </AnimatePresence>
  );
}

function HistoryItem({
  id,
  title,
  imgUrl,
}: {
  id: string;
  title: string;
  imgUrl: string;
}) {
  const mutation = useMutation();
  return (
    <>
      <motion.div
        onClick={() =>
          mutation.execute(`https://www.youtube.com/watch?v=${id}`, true, true)
        }
        className={clsx(
          "p-2 rounded-lg bg-muted flex flex-col gap-3 cursor-pointer border-slate-400 shadow-sm",
          mutation.loading && "opacity-50"
        )}
        layoutId={id}
      >
        <Image
          width={1200}
          height={700}
          style={{
            width: "100%",
            aspectRatio: 1200 / 700,
          }}
          src={imgUrl}
          className='rounded-md overflow-clip'
          alt={title}
          unoptimized
        />
        <div className='text-sm font-medium text-ellipsis line-clamp-2'>
          {title}
        </div>
      </motion.div>

      <TranscriptDialog
        transcript={mutation.result}
        onClose={() => {
          mutation.reset();
        }}
      />
    </>
  );
}
