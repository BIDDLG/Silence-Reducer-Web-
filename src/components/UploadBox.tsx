import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileAudio, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadBoxProps {
  onUpload: (file: File) => void;
}

export function UploadBox({ onUpload }: UploadBoxProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac'],
      'video/*': ['.mp4', '.mkv', '.avi', '.mov', '.webm']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  } as any);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 transition-colors">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ease-in-out flex flex-col items-center justify-center min-h-[250px]",
          isDragActive ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/50",
          isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/20"
        )}
      >
        <input {...getInputProps()} />
        
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-200",
          isDragActive ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-500",
          isDragReject && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        )}>
          {isDragReject ? (
            <AlertCircle className="w-10 h-10" />
          ) : isDragActive ? (
            <FileAudio className="w-10 h-10" />
          ) : (
            <UploadCloud className="w-10 h-10" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          {isDragActive ? "Drop your file here" : "Upload Audio or Video"}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
          Drag and drop your audio or video file here, or click to browse. Video files will have their audio automatically extracted.
        </p>

        <button className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold py-3 px-8 rounded-xl shadow-sm transition-all duration-200">
          Select File
        </button>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <span className="flex items-center gap-1"><FileAudio className="w-3 h-3" /> MP3, WAV, MP4, WEBM, etc.</span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
          <span>Up to 500MB</span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
          <span>100% Private</span>
        </div>
      </div>
    </div>
  );
}
