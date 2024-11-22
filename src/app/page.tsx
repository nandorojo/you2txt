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
import { Copy, Menu, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { APP_URL } from "./APP_URL";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Page() {
  const [url, setUrl] = useState("");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [filterOutMusic, setFilterOutMusic] = useState(true);
  const { toast } = useToast();

  const mutation = useAsyncCallback(
    async () => {
      const response = await fetch(
        `/${url}&timestamps=${includeTimestamps}&filterOutMusic=${filterOutMusic}`
      );
      if (!response.ok) {
        throw new Error("Failed to get transcript");
      }
      return response.text();
    },
    {
      onError(e, options) {
        toast({
          title: "Error",
          description: "Is that a valid YouTube URL?",
          variant: "destructive",
        });
      },
    }
  );

  return (
    <main className='flex min-h-screen bg-background flex-col  justify-center gap-4 p-4'>
      <h1 className='text-2xl lg:text-4xl text-left lg:text-center font-bold tracking-tighter'>
        YouTube Video → txt file
      </h1>
      <p className='text-lg lg:text-center text-muted-foreground'>
        Transcribe any YouTube video into a text file and use it to train your
        LLM.
      </p>

      <form
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          if (!url) return;

          mutation.execute();
        }}
        className='w-full space-y-4 self-center max-w-[600px]'
      >
        <div className='relative w-full'>
          <div className=' bg-muted/50 pointer-events-none bg-gradient-to-bl from-background-50 to-background-100 dark:from-background-300 dark:to-background-500 rounded-tl-lg rounded-bl-lg absolute inset-y-0 left-0 flex items-center pr-2 pl-3'>
            <span>{APP_URL}/</span>
          </div>
          <input
            type='url'
            placeholder='Enter YouTube URL'
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

        <div className='flex items-center justify-center gap-2 flex-wrap'>
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

      <Dialog
        open={Boolean(mutation.result)}
        onOpenChange={() => mutation.reset()}
      >
        <DialogContent className='max-h-[80dvh] flex flex-col'>
          <DialogHeader>
            <DialogTitle>Transcript</DialogTitle>
          </DialogHeader>
          <div className='whitespace-pre-wrap font-mono text-sm overflow-y-auto flex-1'>
            {mutation.result}
          </div>
          <div className='flex justify-end mt-4'>
            <Button
              variant='outline'
              onClick={async () => {
                if (!mutation.result) return;
                await navigator.clipboard.writeText(mutation.result);
                toast({
                  title: "Copied to clipboard",
                  description: "Go feed that thing to your LLM.",
                });
              }}
              className='gap-2'
            >
              <Copy className='h-4 w-4' />
              Copy to clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <a target='_blank' href='https://x.com/fernandotherojo'>
        <footer className='fixed bottom-4 right-4 text-sm text-muted-foreground'>
          By @FernandoTheRojo
        </footer>
      </a>
    </main>
  );
}
