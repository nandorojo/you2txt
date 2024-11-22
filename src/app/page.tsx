import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export const APP_URL = "you2txt.com";

export default function Page() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-4'>
      <h1 className='text-2xl lg:text-4xl lg:text-center font-bold tracking-tighter'>
        YouTube Video → txt file
      </h1>
      <p className='text-lg lg:text-center text-muted-foreground'>
        Transcribe any YouTube video into a text file and use it to train your
        LLM.
      </p>

      <div className='relative w-full max-w-xl mt-4'>
        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
          <span className='text-sm text-muted-foreground'>{APP_URL}/</span>
        </div>
        <Input
          type='text'
          placeholder='YouTube URL...'
          className='pl-32 h-12'
        />
      </div>

      <div className='flex items-center gap-4 mt-2'>
        <Button className='bg-red-500 hover:bg-red-600 text-white'>
          Transcribe Video
        </Button>

        <div className='flex items-center space-x-2'>
          <Checkbox id='timestamps' />
          <label
            htmlFor='timestamps'
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            Include timestamps
          </label>
        </div>
      </div>

      <footer className='fixed bottom-4 right-4 text-sm text-muted-foreground'>
        By @fernandotherojo
      </footer>
    </main>
  );
}
