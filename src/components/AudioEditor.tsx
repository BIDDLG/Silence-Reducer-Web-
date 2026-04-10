import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download, RotateCcw, Settings2, Scissors, Activity, FileAudio, Info, ZoomIn, ZoomOut, Repeat, FastForward, Volume2, Zap, Plus, Minus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

// Import lamejs as a raw string to inject it as a script
// This avoids bundling issues with its internal require/MPEGMode
import lamejsRaw from 'lamejs/lame.all.js?raw';

interface AudioEditorProps {
  file: File;
  onReset: () => void;
}

export function AudioEditor({ file, onReset }: AudioEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // URL management to avoid "signal is aborted" and memory leaks
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const [highQualityBuffer, setHighQualityBuffer] = useState<AudioBuffer | null>(null);

  // FFmpeg state
  const ffmpegRef = useRef(new FFmpeg());
  const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    const loadFfmpeg = async () => {
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('progress', ({ progress }) => {
        setExportProgress(Math.round(progress * 100));
      });
      await ffmpeg.load();
      setIsFfmpegLoaded(true);
    };
    loadFfmpeg().catch(console.error);
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    
    let isCancelled = false;
    const decodeFile = async () => {
      try {
        let arrayBuffer: ArrayBuffer;

        if (file.type.startsWith('video/')) {
          setProcessingStatus("Extracting audio from video...");
          setIsProcessing(true);
          
          // Wait for ffmpeg to load
          let attempts = 0;
          while (!ffmpegRef.current.loaded && attempts < 100) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
          }

          if (!ffmpegRef.current.loaded) {
            throw new Error("FFmpeg failed to load for video extraction");
          }

          const ffmpeg = ffmpegRef.current;
          const ext = file.name.split('.').pop() || 'mp4';
          const inputName = `input_video.${ext}`;
          const outputName = 'output_audio.wav';

          await ffmpeg.writeFile(inputName, await fetchFile(file));
          await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', outputName]);

          const data = await ffmpeg.readFile(outputName);
          arrayBuffer = (data as Uint8Array).buffer;

          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(outputName);
          
          setIsProcessing(false);
          setProcessingStatus(null);
        } else {
          arrayBuffer = await file.arrayBuffer();
        }

        // Force 44.1kHz to prevent Bluetooth/OS downsampling
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        if (!isCancelled) {
          setHighQualityBuffer(buffer);
        }
        if (ctx.state !== 'closed') {
          ctx.close();
        }
      } catch (e) {
        console.error("Error decoding high quality buffer", e);
      }
    };
    decodeFile();
    
    return () => {
      isCancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Playback Controls
  const [zoom, setZoom] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);

  // Advanced Silence Reducer Settings
  const [preset, setPreset] = useState("Default");
  const [threshold, setThreshold] = useState(-40.00); // dB
  const [silenceDuration, setSilenceDuration] = useState(1.000); // seconds
  const [reduction, setReduction] = useState(100); // %
  const [maximum, setMaximum] = useState(1.000); // seconds
  const [fullCrossfade, setFullCrossfade] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const processedBlobRef = useRef<Blob | null>(null);
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'processed'>('original');
  const [exportFormat, setExportFormat] = useState<'wav' | 'mp3'>('wav');
  const [processedDuration, setProcessedDuration] = useState(0);
  const [stats, setStats] = useState<{ detected: number, removed: number } | null>(null);
  const [estimatedStats, setEstimatedStats] = useState<{ detected: number, removed: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);

  const [isExportFormatOpen, setIsExportFormatOpen] = useState(false);
  const exportFormatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(event.target as Node)) {
        setIsPresetOpen(false);
      }
      if (exportFormatRef.current && !exportFormatRef.current.contains(event.target as Node)) {
        setIsExportFormatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const targetBuffer = viewMode === 'processed' ? processedBuffer : highQualityBuffer;
  const canProcess = isReady && targetBuffer !== null;

  const isLoopingRef = useRef(isLooping);
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#cbd5e1',
      progressColor: '#4CAF50',
      cursorColor: '#1B5E20',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 120,
      normalize: true,
      minPxPerSec: 50,
    });

    wavesurferRef.current = ws;

    if (originalUrl) {
      currentUrlRef.current = originalUrl;
      ws.load(originalUrl);
    }

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => {
      if (isLoopingRef.current) {
        ws.play();
      } else {
        setIsPlaying(false);
      }
    });

    return () => {
      ws.destroy();
    };
  }, [originalUrl]);

  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.zoom(zoom * 50);
    }
  }, [zoom, isReady]);

  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate, isReady]);

  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setVolume(volume);
    }
  }, [volume, isReady]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canProcess) {
        analyzeAudio();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [threshold, silenceDuration, reduction, maximum, canProcess, highQualityBuffer]);

  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      const targetUrl = viewMode === 'processed' ? processedAudioUrl : originalUrl;
      if (targetUrl && targetUrl !== currentUrlRef.current) {
        currentUrlRef.current = targetUrl;
        wavesurferRef.current.load(targetUrl).catch(err => {
          if (err.name !== 'AbortError') {
            console.error('WaveSurfer load error:', err);
          }
        });
      }
    }
  }, [viewMode, processedAudioUrl, originalUrl, isReady]);

  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
    switch (newPreset) {
      case "Default":
        setThreshold(-40.00);
        setSilenceDuration(1.000);
        setReduction(100);
        setMaximum(1.000);
        break;
      case "Eliminate all silences":
        setThreshold(-30.00);
        setSilenceDuration(0.200);
        setReduction(100);
        setMaximum(0.000);
        break;
      case "Reduce silences 50%":
        setThreshold(-30.00);
        setSilenceDuration(0.500);
        setReduction(50);
        setMaximum(0.000);
        break;
      case "Reduce silences to half a second":
        setThreshold(-30.00);
        setSilenceDuration(0.500);
        setReduction(100);
        setMaximum(0.500);
        break;
      case "Shorten silences longer than 5 seconds":
        setThreshold(-30.00);
        setSilenceDuration(5.000);
        setReduction(100);
        setMaximum(5.000);
        break;
    }
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00.00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const detectSilences = () => {
    const decodedData = highQualityBuffer;
    if (!decodedData) return null;

    const sampleRate = decodedData.sampleRate;
    const length = decodedData.length;
    const thresholdLinear = Math.pow(10, threshold / 20);
    const minSilenceSamples = silenceDuration * sampleRate;
    
    // Add a small padding (e.g., 40ms) to avoid cutting off speech tails or breaths
    const paddingSamples = Math.floor(sampleRate * 0.04);
    
    let isSilent = false;
    let silenceStart = 0;
    const silenceRegions: {start: number, end: number, originalLength: number, newLength: number}[] = [];

    const blockSize = Math.floor(sampleRate * 0.01); 
    
    // Extract all channels for accurate RMS
    const channels = [];
    for (let c = 0; c < decodedData.numberOfChannels; c++) {
      channels.push(decodedData.getChannelData(c));
    }
    
    // Helper to find zero crossing to avoid clicks when cutting
    const findZeroCrossing = (index: number, direction: 1 | -1): number => {
      const maxSearch = Math.floor(sampleRate * 0.02); // 20ms search window
      let i = index;
      let count = 0;
      const channelData = channels[0]; // Use primary channel for zero crossing
      while (i > 0 && i < length - 1 && count < maxSearch) {
        if (channelData[i] * channelData[i+1] <= 0) {
          return i;
        }
        i += direction;
        count++;
      }
      return index;
    };
    
    for (let i = 0; i < length; i += blockSize) {
      let maxAmplitude = 0;
      const end = Math.min(i + blockSize, length);
      for (let j = i; j < end; j++) {
        for (let c = 0; c < channels.length; c++) {
          const abs = Math.abs(channels[c][j]);
          if (abs > maxAmplitude) maxAmplitude = abs;
        }
      }

      const currentBlockSilent = maxAmplitude < thresholdLinear;

      if (currentBlockSilent && !isSilent) {
        isSilent = true;
        silenceStart = i;
      } else if (!currentBlockSilent && isSilent) {
        isSilent = false;
        const silenceLen = i - silenceStart;
        
        if (silenceLen >= minSilenceSamples) {
          // Apply padding safely so start and end don't cross
          const actualPadding = Math.min(paddingSamples, Math.floor(silenceLen / 2));
          const paddedStart = silenceStart + actualPadding;
          const paddedEnd = i - actualPadding;
          
          // Snap to zero crossings to prevent clicks without needing crossfades
          const zcStart = findZeroCrossing(paddedStart, 1);
          const zcEnd = findZeroCrossing(paddedEnd, -1);
          
          const finalLen = zcEnd - zcStart;

          if (finalLen > 0) {
            silenceRegions.push({ 
              start: zcStart, 
              end: zcEnd,
              originalLength: finalLen,
              newLength: 0
            });
          }
        }
      }
    }

    if (isSilent) {
      const silenceLen = length - silenceStart;
      if (silenceLen >= minSilenceSamples) {
        const actualPadding = Math.min(paddingSamples, Math.floor(silenceLen / 2));
        const paddedStart = silenceStart + actualPadding;
        const paddedEnd = length; // End of file, no padding at the very end
        
        const zcStart = findZeroCrossing(paddedStart, 1);
        const finalLen = paddedEnd - zcStart;

        if (finalLen > 0) {
          silenceRegions.push({ 
            start: zcStart, 
            end: paddedEnd,
            originalLength: finalLen,
            newLength: 0
          });
        }
      }
    }

    let totalSilenceRemoved = 0;

    for (const region of silenceRegions) {
      let newLen = region.originalLength * (1 - (reduction / 100));
      if (maximum > 0) {
        const maxSamples = maximum * sampleRate;
        if (newLen > maxSamples) {
          newLen = maxSamples;
        }
      }
      if (reduction === 100 && maximum === 0) {
        newLen = 0;
      }
      region.newLength = Math.floor(newLen);
      totalSilenceRemoved += (region.originalLength - region.newLength);
    }

    return {
      regions: silenceRegions,
      detected: silenceRegions.length,
      removedSamples: totalSilenceRemoved,
      removed: totalSilenceRemoved / sampleRate,
      sampleRate,
      length,
      numberOfChannels: decodedData.numberOfChannels,
      decodedData
    };
  };

  const analyzeAudio = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const result = detectSilences();
        if (result) {
          setEstimatedStats({
            detected: result.detected,
            removed: result.removed
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsAnalyzing(false);
      }
    }, 10);
  };

  const processAudio = async () => {
    if (!canProcess) return;
    setIsProcessing(true);
    setError(null);
    setStats(null);
    setProcessedAudioUrl(null);
    setProcessingStatus("Detecting silence...");
    
    try {
      const result = detectSilences();
      if (!result) throw new Error("Audio not decoded yet");

      const { regions: silenceRegions, detected: detectedSilenceCount, removedSamples, removed: totalSilenceRemovedSeconds, sampleRate, length, numberOfChannels, decodedData } = result;
      
      const newLength = Math.max(1, length - removedSamples);
      
      if (newLength === length || detectedSilenceCount === 0) {
        setError("No silence detected with current settings. Try increasing the Threshold or decreasing Duration.");
        setIsProcessing(false);
        setProcessingStatus(null);
        return;
      }

      setProcessingStatus(`Processing ${detectedSilenceCount} regions...`);
      const offlineCtx = new OfflineAudioContext(numberOfChannels, newLength, sampleRate);
      const newBuffer = offlineCtx.createBuffer(numberOfChannels, newLength, sampleRate);

      for (let c = 0; c < numberOfChannels; c++) {
        const oldData = decodedData.getChannelData(c);
        const newData = newBuffer.getChannelData(c);
        
        let newIndex = 0;
        let oldIndex = 0;
        let regionIndex = 0;

        while (oldIndex < length) {
          if (regionIndex < silenceRegions.length && oldIndex >= silenceRegions[regionIndex].start && oldIndex < silenceRegions[regionIndex].end) {
            const region = silenceRegions[regionIndex];
            
            if (region.newLength > 0) {
              const keepStart = region.start + Math.floor((region.originalLength - region.newLength) / 2);
              const chunk = new Float32Array(oldData.subarray(keepStart, keepStart + region.newLength));
              
              newData.set(chunk, Math.min(newIndex, newLength - chunk.length));
              newIndex += region.newLength;
            }
            
            oldIndex = region.end;
            regionIndex++;
          } else {
            let copyEnd = length;
            if (regionIndex < silenceRegions.length) {
              copyEnd = silenceRegions[regionIndex].start;
            }
            
            const copyLength = copyEnd - oldIndex;
            // Copy the chunk to avoid modifying the original decoded data
            const chunk = new Float32Array(oldData.subarray(oldIndex, copyEnd));
            
            newData.set(chunk, Math.min(newIndex, newLength - chunk.length));
            
            newIndex += copyLength;
            oldIndex = copyEnd;
          }
        }
      }

      setProcessingStatus(`Encoding to ${exportFormat.toUpperCase()}...`);
      let blob: Blob;
      if (exportFormat === 'mp3') {
        blob = await bufferToMp3(newBuffer);
      } else {
        blob = bufferToWav(newBuffer);
      }
      
      const url = URL.createObjectURL(blob);
      processedBlobRef.current = blob;
      setProcessedAudioUrl(url);
      setProcessedBuffer(newBuffer);
      setProcessedDuration(newBuffer.duration);
      setViewMode('processed');
      setStats({
        detected: detectedSilenceCount,
        removed: totalSilenceRemovedSeconds
      });
      setProcessingStatus(null);
      
      // Scroll to download section
      setTimeout(() => {
        const downloadSection = document.getElementById('processed-audio-section');
        if (downloadSection) {
          downloadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
    } catch (error) {
      console.error("Error processing audio:", error);
      setError(error instanceof Error ? error.message : "An error occurred while processing the audio.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const normalizeAudio = async () => {
    if (!canProcess) return;
    setIsProcessing(true);
    setError(null);
    setProcessingStatus("Normalizing...");
    try {
      const decodedData = targetBuffer;
      if (!decodedData) throw new Error("Audio not decoded yet");

      const sampleRate = decodedData.sampleRate;
      const numberOfChannels = decodedData.numberOfChannels;
      const length = decodedData.length;

      let maxAmplitude = 0;
      for (let c = 0; c < numberOfChannels; c++) {
        const channelData = decodedData.getChannelData(c);
        for (let i = 0; i < length; i++) {
          const abs = Math.abs(channelData[i]);
          if (abs > maxAmplitude) maxAmplitude = abs;
        }
      }

      if (maxAmplitude === 0) {
        setIsProcessing(false);
        setProcessingStatus(null);
        return;
      }

      const multiplier = 1.0 / maxAmplitude;

      const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);
      const newBuffer = offlineCtx.createBuffer(numberOfChannels, length, sampleRate);

      for (let c = 0; c < numberOfChannels; c++) {
        const oldData = decodedData.getChannelData(c);
        const newData = newBuffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
          newData[i] = oldData[i] * multiplier;
        }
      }

      const wavBlob = bufferToWav(newBuffer);
      processedBlobRef.current = wavBlob;
      const url = URL.createObjectURL(wavBlob);
      setProcessedAudioUrl(url);
      setProcessedDuration(newBuffer.duration);
      setProcessingStatus(null);
    } catch (error) {
      console.error("Error normalizing audio:", error);
      setError("An error occurred while normalizing the audio.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const reverseAudio = async () => {
    if (!canProcess) return;
    setIsProcessing(true);
    setError(null);
    setProcessingStatus("Reversing...");
    try {
      const decodedData = targetBuffer;
      if (!decodedData) throw new Error("Audio not decoded yet");

      const sampleRate = decodedData.sampleRate;
      const numberOfChannels = decodedData.numberOfChannels;
      const length = decodedData.length;

      const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);
      const newBuffer = offlineCtx.createBuffer(numberOfChannels, length, sampleRate);

      for (let c = 0; c < numberOfChannels; c++) {
        const oldData = decodedData.getChannelData(c);
        const newData = newBuffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
          newData[i] = oldData[length - 1 - i];
        }
      }

      const wavBlob = bufferToWav(newBuffer);
      processedBlobRef.current = wavBlob;
      const url = URL.createObjectURL(wavBlob);
      setProcessedAudioUrl(url);
      setProcessedDuration(newBuffer.duration);
      setProcessingStatus(null);
    } catch (error) {
      console.error("Error reversing audio:", error);
      setError("An error occurred while reversing the audio.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleExport = async () => {
    if (!processedAudioUrl || !processedBlobRef.current) return;

    if (exportFormat === 'wav') {
      const a = document.createElement('a');
      a.href = processedAudioUrl;
      a.download = `processed_${file.name.split('.')[0]}.wav`;
      a.click();
      return;
    }

    if (!isFfmpegLoaded) {
      alert("Encoder is still loading, please wait a moment...");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const ffmpeg = ffmpegRef.current;
      const blob = processedBlobRef.current;
      const inputName = 'input.wav';
      const outputName = `output.${exportFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(blob));

      let args = ['-i', inputName];
      
      if (exportFormat === 'mp3') {
        args.push('-b:a', '320k');
      } else if (exportFormat === 'aac' || exportFormat === 'm4a') {
        args.push('-c:a', 'aac', '-b:a', '256k');
      } else if (exportFormat === 'ogg') {
        args.push('-c:a', 'libvorbis', '-q:a', '8');
      } else if (exportFormat === 'flac') {
        args.push('-c:a', 'flac');
      }
      
      args.push(outputName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const outBlob = new Blob([(data as Uint8Array).buffer], { type: `audio/${exportFormat}` });
      const outUrl = URL.createObjectURL(outBlob);

      const a = document.createElement('a');
      a.href = outUrl;
      a.download = `processed_${file.name.split('.')[0]}.${exportFormat}`;
      a.click();

      URL.revokeObjectURL(outUrl);
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

    } catch (err) {
      console.error("Export error:", err);
      alert("An error occurred during export.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Helper for rendering control rows
  const ControlRow = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    onChange, 
    format = (v: number) => v.toFixed(2) 
  }: { 
    label: string, 
    value: number, 
    min: number, 
    max: number, 
    step: number, 
    onChange: (v: number) => void,
    format?: (v: number) => string
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex justify-between items-center sm:w-32 shrink-0">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <input 
          type="number" 
          value={format(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sm:hidden w-16 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-900 dark:text-white focus:outline-none focus:border-green-500 font-mono"
        />
      </div>
      <div className="flex items-center gap-3 flex-1 w-full">
        <button 
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-green-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <button 
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <input 
        type="number" 
        value={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hidden sm:block w-20 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm text-right text-slate-900 dark:text-white focus:outline-none focus:border-green-500 font-mono shadow-inner"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">{file.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {canProcess ? formatTime(highQualityBuffer?.duration || 0) : 'Loading...'}
            </p>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <RotateCcw className="w-4 h-4" />
          Clear Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor Area */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Waveform Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  {viewMode === 'original' ? 'Original Audio' : 'Processed Audio'}
                </h3>
                {processedAudioUrl && (
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setViewMode('original')}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                        viewMode === 'original' 
                          ? "bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm" 
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      )}
                    >
                      Original
                    </button>
                    <button 
                      onClick={() => setViewMode('processed')}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                        viewMode === 'processed' 
                          ? "bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm" 
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      )}
                    >
                      Processed
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md shrink-0">
                {formatTime(currentTime)} / {formatTime(viewMode === 'original' ? (highQualityBuffer?.duration || 0) : processedDuration)}
              </div>
            </div>
            
            <div 
              ref={containerRef} 
              className={cn("w-full bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden", !isReady && "opacity-50")}
            />

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono text-slate-400 w-8 text-center">{zoom}x</span>
                <button
                  onClick={() => setZoom(Math.min(5, zoom + 0.5))}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={cn("p-2 rounded-lg transition-colors", isLooping ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-slate-500 hover:text-green-600 hover:bg-green-50")}
                  title="Loop Playback"
                >
                  <Repeat className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlayPause}
                  disabled={!isReady}
                  className="w-14 h-14 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <button
                  onClick={() => setPlaybackRate(playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)}
                  className={cn("p-2 rounded-lg transition-colors flex items-center gap-1", playbackRate !== 1 ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-slate-500 hover:text-green-600 hover:bg-green-50")}
                  title="Playback Speed"
                >
                  <FastForward className="w-5 h-5" />
                  <span className="text-xs font-bold">{playbackRate}x</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-24 accent-green-600"
                  title="Volume"
                />
              </div>
            </div>
          </div>

          {/* Results Card */}
          {processedAudioUrl && (
            <div id="processed-audio-section" className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Processed Result
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {stats && (
                    <span className="hidden sm:inline-block text-sm font-medium text-emerald-700 dark:text-emerald-500 bg-emerald-100/50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {stats.detected} silences found
                    </span>
                  )}
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Saved {formatTime(Math.max(0, (highQualityBuffer?.duration || 0) - processedDuration))}
                  </span>
                  <button 
                    onClick={() => {
                      setProcessedAudioUrl(null);
                      setProcessedBuffer(null);
                      setViewMode('original');
                    }}
                    className="text-sm font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Undo Changes
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex-1 relative" ref={exportFormatRef}>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Export Format</p>
                    <button
                      onClick={() => setIsExportFormatOpen(!isExportFormatOpen)}
                      className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm transition-colors"
                    >
                      <span>{exportFormat}</span>
                      <svg className={cn("w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2", isExportFormatOpen ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    
                    {isExportFormatOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 bottom-full mb-1 sm:bottom-auto sm:mb-0 sm:top-full">
                        {[
                          { id: 'wav', name: 'WAV', quality: 'Lossless (Original)' },
                          { id: 'mp3', name: 'MP3', quality: 'High (320kbps)' },
                          { id: 'aac', name: 'AAC', quality: 'High (256kbps)' },
                          { id: 'ogg', name: 'OGG', quality: 'High (320kbps)' },
                          { id: 'flac', name: 'FLAC', quality: 'Lossless (Compressed)' },
                          { id: 'm4a', name: 'M4A', quality: 'High (256kbps)' },
                        ].map((fmt) => (
                          <button
                            key={fmt.id}
                            onClick={() => {
                              setExportFormat(fmt.id as any);
                              setIsExportFormatOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                              exportFormat === fmt.id 
                                ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-bold" 
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium"
                            )}
                          >
                            <span className="uppercase">{fmt.id}</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{fmt.quality}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 whitespace-nowrap relative overflow-hidden"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                      <span className="relative z-10">Exporting {exportProgress}%</span>
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-emerald-800/30 transition-all duration-300 ease-out"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download {exportFormat.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 h-fit transition-colors">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-green-100 dark:bg-green-500/20 rounded-lg">
                <Scissors className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              Silence Reduction
            </h3>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Info className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6 bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 w-full sm:w-24 shrink-0">Presets:</label>
              <div className="flex-1 min-w-0 w-full relative" ref={presetRef}>
                <button
                  onClick={() => setIsPresetOpen(!isPresetOpen)}
                  className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg pl-3 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm transition-colors"
                >
                  <span className="truncate">{preset}</span>
                  <svg className={cn("w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2", isPresetOpen ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {isPresetOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
                    {[
                      "Default",
                      "Eliminate all silences",
                      "Reduce silences 50%",
                      "Reduce silences to half a second",
                      "Shorten silences longer than 5 seconds"
                    ].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          handlePresetChange(p);
                          setIsPresetOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm transition-colors",
                          preset === p 
                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-medium" 
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <ControlRow 
              label="Threshold (dB):" 
              value={threshold} 
              min={-80} max={0} step={1} 
              onChange={setThreshold} 
            />
            <ControlRow 
              label="Duration (s):" 
              value={silenceDuration} 
              min={0.01} max={10} step={0.01} 
              onChange={setSilenceDuration} 
              format={(v) => v.toFixed(3)}
            />
            <ControlRow 
              label="Reduction (%):" 
              value={reduction} 
              min={0} max={100} step={1} 
              onChange={setReduction} 
              format={(v) => v.toString()}
            />
            <ControlRow 
              label="Maximum (s):" 
              value={maximum} 
              min={0} max={10} step={0.1} 
              onChange={setMaximum} 
              format={(v) => v.toFixed(3)}
            />

            <div className="flex items-center justify-between py-4 mt-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full crossfade:</label>
              <button 
                onClick={() => setFullCrossfade(!fullCrossfade)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative shadow-inner",
                  fullCrossfade ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-sm",
                  fullCrossfade ? "translate-x-7" : "translate-x-1"
                )} />
              </button>
            </div>

            {/* Estimated Stats Display */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Estimated Reduction</span>
                {isAnalyzing && <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {estimatedStats ? formatTime(estimatedStats.removed) : "0:00.00"}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">saved</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {estimatedStats ? `${estimatedStats.detected} silent regions detected` : "Analyzing audio..."}
              </div>
            </div>

            <button
              onClick={processAudio}
              disabled={!canProcess || isProcessing}
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 relative overflow-hidden active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{processingStatus || "Processing..."}</span>
                </>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  Apply Silence Reduction
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/80">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
              <Zap className="w-4 h-4 text-green-500 dark:text-green-400" />
              Quick Tools
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={normalizeAudio}
                disabled={!canProcess || isProcessing}
                className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                Normalize
              </button>
              <button
                onClick={reverseAudio}
                disabled={!canProcess || isProcessing}
                className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                Reverse
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert AudioBuffer to WAV Blob
function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this export)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      // interleave channels
      let s = channels[i][offset];
      // Clamp and scale with rounding for better precision
      let sampleInt = Math.max(-32768, Math.min(32767, Math.round(s < 0 ? s * 32768 : s * 32767)));
      view.setInt16(pos, sampleInt, true); // write 16-bit sample
      pos += 2;
    }
    offset++; // next source sample
  }

  return new Blob([bufferArray], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Helper function to convert AudioBuffer to MP3 Blob
async function bufferToMp3(buffer: AudioBuffer): Promise<Blob> {
  // Ensure lamejs is loaded in the global scope
  if (!(window as any).lamejs) {
    try {
      const script = document.createElement('script');
      script.text = lamejsRaw;
      document.head.appendChild(script);
      console.log("LameJS injected successfully.");
    } catch (e) {
      console.error("Failed to inject LameJS:", e);
    }
  }

  const Mp3Encoder = (window as any).lamejs?.Mp3Encoder;
  
  if (!Mp3Encoder) {
    console.error("LameJS Mp3Encoder not found in global scope after injection.");
    throw new Error("MP3 Encoder (LameJS) failed to load. Please try WAV format or refresh the page.");
  }
  
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  // High quality 320kbps encoding
  const mp3encoder = new Mp3Encoder(channels, sampleRate, 320); 
  const mp3Data = [];

  const sampleBlockSize = 1152 * 10; // Process in larger chunks for better psychoacoustic modeling

  if (channels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    
    // Convert float to 16-bit PCM
    const leftInt = new Int16Array(left.length);
    const rightInt = new Int16Array(right.length);
    for (let i = 0; i < left.length; i++) {
      // High-quality float to 16-bit PCM conversion with rounding
      let l = left[i];
      let r = right[i];
      
      // Clamp and scale with rounding for better precision
      leftInt[i] = Math.max(-32768, Math.min(32767, Math.round(l < 0 ? l * 32768 : l * 32767)));
      rightInt[i] = Math.max(-32768, Math.min(32767, Math.round(r < 0 ? r * 32768 : r * 32767)));
    }

    for (let i = 0; i < leftInt.length; i += sampleBlockSize) {
      const leftChunk = leftInt.subarray(i, i + sampleBlockSize);
      const rightChunk = rightInt.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
  } else {
    const mono = buffer.getChannelData(0);
    const monoInt = new Int16Array(mono.length);
    for (let i = 0; i < mono.length; i++) {
      let m = mono[i];
      monoInt[i] = Math.max(-32768, Math.min(32767, Math.round(m < 0 ? m * 32768 : m * 32767)));
    }

    for (let i = 0; i < monoInt.length; i += sampleBlockSize) {
      const chunk = monoInt.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
