import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download, RotateCcw, Settings2, Scissors, Activity, FileAudio, Info, ZoomIn, ZoomOut, Repeat, FastForward, Volume2, Zap, Plus, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import * as lamejs from 'lamejs';

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

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => {
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
  const [processedBuffer, setProcessedBuffer] = useState<AudioBuffer | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'processed'>('original');
  const [exportFormat, setExportFormat] = useState<'wav' | 'mp3'>('mp3');
  const [processedDuration, setProcessedDuration] = useState(0);
  const [stats, setStats] = useState<{ detected: number, removed: number } | null>(null);
  const [estimatedStats, setEstimatedStats] = useState<{ detected: number, removed: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#cbd5e1',
      progressColor: '#4f46e5',
      cursorColor: '#312e81',
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
      if (isLooping) {
        ws.play();
      } else {
        setIsPlaying(false);
      }
    });

    return () => {
      ws.destroy();
    };
  }, [originalUrl, isLooping]);

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
      if (isReady && wavesurferRef.current) {
        analyzeAudio();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [threshold, silenceDuration, reduction, maximum, isReady]);

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
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const detectSilences = () => {
    const decodedData = wavesurferRef.current?.getDecodedData();
    if (!decodedData) return null;

    const sampleRate = decodedData.sampleRate;
    const length = decodedData.length;
    const thresholdLinear = Math.pow(10, threshold / 20);
    const minSilenceSamples = silenceDuration * sampleRate;
    const channelData = decodedData.getChannelData(0);
    
    let isSilent = false;
    let silenceStart = 0;
    const silenceRegions: {start: number, end: number, originalLength: number, newLength: number}[] = [];

    const blockSize = Math.floor(sampleRate * 0.01); 
    
    for (let i = 0; i < length; i += blockSize) {
      let maxAmplitude = 0;
      const end = Math.min(i + blockSize, length);
      for (let j = i; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > maxAmplitude) maxAmplitude = abs;
      }

      const currentBlockSilent = maxAmplitude < thresholdLinear;

      if (currentBlockSilent && !isSilent) {
        isSilent = true;
        silenceStart = i;
      } else if (!currentBlockSilent && isSilent) {
        isSilent = false;
        const silenceLen = i - silenceStart;
        if (silenceLen >= minSilenceSamples) {
          silenceRegions.push({ 
            start: silenceStart, 
            end: i,
            originalLength: silenceLen,
            newLength: 0
          });
        }
      }
    }

    if (isSilent) {
      const silenceLen = length - silenceStart;
      if (silenceLen >= minSilenceSamples) {
        silenceRegions.push({ 
          start: silenceStart, 
          end: length,
          originalLength: silenceLen,
          newLength: 0
        });
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
    if (!wavesurferRef.current || !isReady) return;
    setIsProcessing(true);
    setStats(null);
    
    try {
      const result = detectSilences();
      if (!result) throw new Error("Audio not decoded yet");

      const { regions: silenceRegions, detected: detectedSilenceCount, removed: totalSilenceRemovedSeconds, sampleRate, length, numberOfChannels, decodedData } = result;
      
      // Crossfade duration in samples (e.g., 5ms)
      const crossfadeSamples = fullCrossfade ? Math.floor(sampleRate * 0.005) : 0;
      
      const totalSilenceRemoved = totalSilenceRemovedSeconds * sampleRate;
      const newLength = Math.max(1, length - totalSilenceRemoved);
      
      if (newLength === length || detectedSilenceCount === 0) {
        alert("No silence detected with current settings. Try increasing the Threshold (e.g., to -30dB or -20dB) or decreasing Duration.");
        setIsProcessing(false);
        return;
      }

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
              const chunk = oldData.subarray(keepStart, keepStart + region.newLength);
              
              // Apply simple fade in/out to the kept silence chunk to avoid clicks
              if (crossfadeSamples > 0 && region.newLength > crossfadeSamples * 2) {
                for (let i = 0; i < crossfadeSamples; i++) {
                  chunk[i] *= (i / crossfadeSamples);
                  chunk[region.newLength - 1 - i] *= (i / crossfadeSamples);
                }
              }
              
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
            const chunk = oldData.subarray(oldIndex, copyEnd);
            
            newData.set(chunk, Math.min(newIndex, newLength - chunk.length));
            
            newIndex += copyLength;
            oldIndex = copyEnd;
          }
        }
      }

      let blob: Blob;
      if (exportFormat === 'mp3') {
        blob = await bufferToMp3(newBuffer);
      } else {
        blob = bufferToWav(newBuffer);
      }
      
      const url = URL.createObjectURL(blob);
      
      setProcessedAudioUrl(url);
      setProcessedBuffer(newBuffer);
      setProcessedDuration(newBuffer.duration);
      setViewMode('processed');
      setStats({
        detected: detectedSilenceCount,
        removed: totalSilenceRemovedSeconds
      });
      
    } catch (error) {
      console.error("Error processing audio:", error);
      alert("An error occurred while processing the audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const normalizeAudio = async () => {
    if (!wavesurferRef.current || !isReady) return;
    setIsProcessing(true);
    try {
      const decodedData = wavesurferRef.current.getDecodedData();
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
      const url = URL.createObjectURL(wavBlob);
      setProcessedAudioUrl(url);
      setProcessedDuration(newBuffer.duration);
    } catch (error) {
      console.error("Error normalizing audio:", error);
      alert("An error occurred while normalizing the audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reverseAudio = async () => {
    if (!wavesurferRef.current || !isReady) return;
    setIsProcessing(true);
    try {
      const decodedData = wavesurferRef.current.getDecodedData();
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
      const url = URL.createObjectURL(wavBlob);
      setProcessedAudioUrl(url);
      setProcessedDuration(newBuffer.duration);
    } catch (error) {
      console.error("Error reversing audio:", error);
      alert("An error occurred while reversing the audio.");
    } finally {
      setIsProcessing(false);
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
    <div className="flex items-center justify-between gap-4 py-2">
      <label className="text-sm font-medium text-slate-300 w-32 shrink-0">{label}</label>
      <div className="flex items-center gap-3 flex-1">
        <button 
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 hover:bg-slate-700 transition-colors"
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
          className="flex-1 accent-indigo-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
        <button 
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <input 
        type="number" 
        value={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-right text-white focus:outline-none focus:border-indigo-500 font-mono"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">{file.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {isReady ? formatTime(duration) : 'Loading...'}
            </p>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Upload Different File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Editor Area */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Waveform Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  {viewMode === 'original' ? 'Original Audio' : 'Processed Audio'}
                </h3>
                {processedAudioUrl && (
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setViewMode('original')}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                        viewMode === 'original' 
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
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
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      )}
                    >
                      Processed
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                {formatTime(currentTime)} / {formatTime(viewMode === 'original' ? duration : processedDuration)}
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
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono text-slate-400 w-8 text-center">{zoom}x</span>
                <button
                  onClick={() => setZoom(Math.min(5, zoom + 0.5))}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={cn("p-2 rounded-lg transition-colors", isLooping ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50")}
                  title="Loop Playback"
                >
                  <Repeat className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlayPause}
                  disabled={!isReady}
                  className="w-14 h-14 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <button
                  onClick={() => setPlaybackRate(playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)}
                  className={cn("p-2 rounded-lg transition-colors flex items-center gap-1", playbackRate !== 1 ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50")}
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
                  className="w-24 accent-indigo-600"
                  title="Volume"
                />
              </div>
            </div>
          </div>

          {/* Results Card */}
          {processedAudioUrl && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Processed Result
                </h3>
                <div className="flex gap-2">
                  {stats && (
                    <span className="hidden sm:inline-block text-sm font-medium text-emerald-700 dark:text-emerald-500 bg-emerald-100/50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {stats.detected} silences found
                    </span>
                  )}
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Saved {formatTime(duration - processedDuration)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Export Format</p>
                    <div className="flex gap-2">
                      {['mp3', 'wav'].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(fmt as any)}
                          className={cn(
                            "px-3 py-1 text-xs font-bold rounded-md uppercase transition-all",
                            exportFormat === fmt 
                              ? "bg-indigo-600 text-white" 
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
                          )}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Quality</p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Original (High)</p>
                  </div>
                </div>
                <a 
                  href={processedAudioUrl} 
                  download={`processed_${file.name.split('.')[0]}.${exportFormat}`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Download className="w-5 h-5" />
                  Download {exportFormat.toUpperCase()}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel (Dark Theme like screenshot) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-slate-800 text-slate-200 p-5 rounded-2xl shadow-xl border border-slate-700 h-fit">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2 text-lg">
              <Scissors className="w-5 h-5 text-indigo-400" />
              Silence Reduction
            </h3>
            <button className="text-slate-400 hover:text-white transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm font-medium text-slate-300 w-20">Presets:</label>
              <select 
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Default">Default</option>
                <option value="Eliminate all silences">Eliminate all silences</option>
                <option value="Reduce silences 50%">Reduce silences 50%</option>
                <option value="Reduce silences to half a second">Reduce silences to half a second</option>
                <option value="Shorten silences longer than 5 seconds">Shorten silences longer than 5 seconds</option>
              </select>
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

            <div className="flex items-center justify-between py-3 border-t border-slate-700 mt-4">
              <label className="text-sm font-medium text-slate-300">Full crossfade:</label>
              <button 
                onClick={() => setFullCrossfade(!fullCrossfade)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  fullCrossfade ? "bg-indigo-500" : "bg-slate-600"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                  fullCrossfade ? "translate-x-7" : "translate-x-1"
                )} />
              </button>
            </div>

            {/* Estimated Stats Display */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Estimated Reduction</span>
                {isAnalyzing && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">
                  {estimatedStats ? formatTime(estimatedStats.removed) : "0:00.00"}
                </span>
                <span className="text-sm text-slate-400 mb-1">saved</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {estimatedStats ? `${estimatedStats.detected} silent regions detected` : "Analyzing audio..."}
              </div>
            </div>

            <button
              onClick={processAudio}
              disabled={!isReady || isProcessing}
              className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-600 disabled:text-slate-400 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  Apply Silence Reduction
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700">
            <h3 className="font-semibold text-slate-300 flex items-center gap-2 mb-4 text-sm">
              <Zap className="w-4 h-4 text-indigo-400" />
              Quick Tools
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={normalizeAudio}
                disabled={!isReady || isProcessing}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium py-2 px-3 rounded-lg border border-slate-600 transition-colors text-sm flex items-center justify-center gap-2"
              >
                Normalize
              </button>
              <button
                onClick={reverseAudio}
                disabled={!isReady || isProcessing}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium py-2 px-3 rounded-lg border border-slate-600 transition-colors text-sm flex items-center justify-center gap-2"
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
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
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
  // lamejs is now imported at the top level as * as lamejs
  // Some versions of lamejs export as default, some as the module itself
  const lame: any = (lamejs as any).default || lamejs;
  
  // Ensure we have the right object and constructor
  const Mp3Encoder = lame.Mp3Encoder || (lamejs as any).Mp3Encoder;
  
  if (!Mp3Encoder) {
    throw new Error("LameJS Mp3Encoder not found. Please check if the library is correctly installed.");
  }
  
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const mp3encoder = new Mp3Encoder(channels, sampleRate, 192); // 192kbps for high quality
  const mp3Data = [];

  const sampleBlockSize = 1152; // can be anything in multiples of 1152

  if (channels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    
    // Convert float to 16-bit PCM
    const leftInt = new Int16Array(left.length);
    const rightInt = new Int16Array(right.length);
    for (let i = 0; i < left.length; i++) {
      leftInt[i] = left[i] < 0 ? left[i] * 0x8000 : left[i] * 0x7FFF;
      rightInt[i] = right[i] < 0 ? right[i] * 0x8000 : right[i] * 0x7FFF;
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
      monoInt[i] = mono[i] < 0 ? mono[i] * 0x8000 : mono[i] * 0x7FFF;
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
