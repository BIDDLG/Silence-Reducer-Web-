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
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  } as any);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out flex flex-col items-center justify-center min-h-[300px]",
          isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50",
          isDragReject && "border-red-500 bg-red-50"
        )}
      >
        <input {...getInputProps()} />
        
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-200",
          isDragActive ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500",
          isDragReject && "bg-red-100 text-red-600"
        )}>
          {isDragReject ? (
            <AlertCircle className="w-10 h-10" />
          ) : isDragActive ? (
            <FileAudio className="w-10 h-10" />
          ) : (
            <UploadCloud className="w-10 h-10" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-2">
          {isDragActive ? "Drop your audio file here" : "Upload Audio"}
        </h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Drag and drop your audio file here, or click to browse.
        </p>

        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-sm transition-colors duration-200">
          Select File
        </button>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1"><FileAudio className="w-3 h-3" /> MP3, WAV, M4A, FLAC</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>Up to 500MB</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>100% Private</span>
        </div>
      </div>
    </div>
  );
}
