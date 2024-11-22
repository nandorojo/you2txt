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
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { APP_URL } from "./APP_URL";

export default function Page() {
  const [url, setUrl] = useState("");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const { toast } = useToast();

  const mutation = useAsyncCallback(
    async () => {
      const response = await fetch(`/${url}&timestamps=${includeTimestamps}`);
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
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-4'>
      <h1 className='text-2xl lg:text-4xl lg:text-center font-bold tracking-tighter'>
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
        className='w-full max-w-xl space-y-4'
      >
        <div
          className='relative w-full'
          style={{
            boxShadow: "0 8px 29px -2px #a8a8a8",
          }}
        >
          <div className='pointer-events-none bg-gradient-to-bl from-gray-50 to-gray-100 rounded-tl-md rounded-bl-md absolute inset-y-0 left-0 flex items-center px-2'>
            <span className='text-sm'>{APP_URL}/</span>
          </div>
          <Input
            type='url'
            placeholder='https://www.youtube.com/watch?v=...'
            className='pl-[110px] h-12 border-transparent'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={mutation.loading}
            autoFocus
            required
          />
        </div>

        <div className='flex items-center justify-center gap-4'>
          <Button
            type='submit'
            className='bg-[#FF0032] hover:bg-red-700 text-white'
            disabled={mutation.loading}
          >
            {mutation.loading ? "Transcribing..." : "Transcribe Video"}
          </Button>

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
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Include timestamps
            </label>
          </div>
        </div>
      </form>

      <Dialog
        open={Boolean(mutation.result)}
        onOpenChange={() => mutation.reset()}
      >
        <DialogContent className='max-h-[80dvh]'>
          <DialogHeader>
            <DialogTitle>Transcript</DialogTitle>
          </DialogHeader>
          <div className='whitespace-pre-wrap font-mono text-sm overflow-y-auto'>
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
                  description:
                    "The transcript has been copied to your clipboard.",
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
