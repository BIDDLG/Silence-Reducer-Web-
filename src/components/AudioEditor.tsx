import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download, RotateCcw, Settings2, Scissors, Activity, FileAudio, Info, ZoomIn, ZoomOut, Repeat, FastForward, Volume2, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

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
  
  // Playback Controls
  const [zoom, setZoom] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);

  // Settings
  const [threshold, setThreshold] = useState(-40); // dB
  const [minSilenceDuration, setMinSilenceDuration] = useState(0.5); // seconds
  const [padding, setPadding] = useState(0.1); // seconds
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const [processedDuration, setProcessedDuration] = useState(0);

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

    const objectUrl = URL.createObjectURL(file);
    ws.load(objectUrl);

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
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, isLooping]);

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

  const processAudio = async () => {
    if (!wavesurferRef.current || !isReady) return;
    setIsProcessing(true);
    
    try {
      // Get the decoded audio buffer from wavesurfer
      const decodedData = wavesurferRef.current.getDecodedData();
      if (!decodedData) throw new Error("Audio not decoded yet");

      const sampleRate = decodedData.sampleRate;
      const numberOfChannels = decodedData.numberOfChannels;
      const length = decodedData.length;

      // Convert threshold dB to linear amplitude
      const thresholdLinear = Math.pow(10, threshold / 20);
      const minSilenceSamples = minSilenceDuration * sampleRate;
      const paddingSamples = padding * sampleRate;

      // Simple silence detection (using channel 0 for simplicity, ideally mix down to mono for detection)
      const channelData = decodedData.getChannelData(0);
      
      let isSilent = false;
      let silenceStart = 0;
      const silenceRegions: {start: number, end: number}[] = [];

      // Block-based analysis for performance
      const blockSize = Math.floor(sampleRate * 0.05); // 50ms blocks
      
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
          const silenceLength = i - silenceStart;
          if (silenceLength >= minSilenceSamples) {
            // Apply padding
            const startWithPadding = silenceStart + paddingSamples;
            const endWithPadding = i - paddingSamples;
            if (endWithPadding > startWithPadding) {
              silenceRegions.push({ start: startWithPadding, end: endWithPadding });
            }
          }
        }
      }

      // Handle silence at the end of the file
      if (isSilent) {
        const silenceLength = length - silenceStart;
        if (silenceLength >= minSilenceSamples) {
          const startWithPadding = silenceStart + paddingSamples;
          if (length > startWithPadding) {
            silenceRegions.push({ start: startWithPadding, end: length });
          }
        }
      }

      // Calculate total length of new buffer
      let totalSilenceRemoved = 0;
      for (const region of silenceRegions) {
        totalSilenceRemoved += (region.end - region.start);
      }
      
      const newLength = length - totalSilenceRemoved;
      
      if (newLength === length) {
        alert("No silence detected with current settings.");
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
            // Skip this silent part
            oldIndex = silenceRegions[regionIndex].end;
            regionIndex++;
          } else {
            // Copy non-silent part
            let copyEnd = length;
            if (regionIndex < silenceRegions.length) {
              copyEnd = silenceRegions[regionIndex].start;
            }
            
            const copyLength = copyEnd - oldIndex;
            newData.set(oldData.subarray(oldIndex, copyEnd), newIndex);
            
            newIndex += copyLength;
            oldIndex = copyEnd;
          }
        }
      }

      // Encode to WAV
      const wavBlob = bufferToWav(newBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      setProcessedAudioUrl(url);
      setProcessedDuration(newBuffer.duration);
      
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">{file.name}</h2>
            <p className="text-xs text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {isReady ? formatTime(duration) : 'Loading...'}
            </p>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Upload Different File
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Waveform Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Original Audio
              </h3>
              <div className="text-sm font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div 
              ref={containerRef} 
              className={cn("w-full bg-slate-50 rounded-xl border border-slate-100 overflow-hidden", !isReady && "opacity-50")}
            />

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono text-slate-400 w-8 text-center">{zoom}x</span>
                <button
                  onClick={() => setZoom(Math.min(5, zoom + 0.5))}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={cn("p-2 rounded-lg transition-colors", isLooping ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50")}
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
                  className={cn("p-2 rounded-lg transition-colors flex items-center gap-1", playbackRate !== 1 ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50")}
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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 bg-emerald-50/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Processed Result
                </h3>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                  Saved {formatTime(duration - processedDuration)}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <audio src={processedAudioUrl} controls className="w-full" />
                <a 
                  href={processedAudioUrl} 
                  download={`processed_${file.name}.wav`}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Export WAV
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            Silence Reducer Settings
          </h3>

          <div className="space-y-6">
            {/* Threshold */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Silence Threshold</label>
                <span className="text-sm text-slate-500 font-mono">{threshold} dB</span>
              </div>
              <input 
                type="range" 
                min="-80" 
                max="-10" 
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-xs text-slate-500 mt-1">Volume level below which audio is considered silent.</p>
            </div>

            {/* Min Duration */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Minimum Silence Duration</label>
                <span className="text-sm text-slate-500 font-mono">{minSilenceDuration}s</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1"
                value={minSilenceDuration}
                onChange={(e) => setMinSilenceDuration(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-xs text-slate-500 mt-1">Only remove silences longer than this duration.</p>
            </div>

            {/* Padding */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Keep Short Pauses (Padding)</label>
                <span className="text-sm text-slate-500 font-mono">{padding}s</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-xs text-slate-500 mt-1">Leave a small gap around speech to sound natural.</p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={processAudio}
                disabled={!isReady || isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="w-5 h-5" />
                    Remove Silence
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2 items-start">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Processing happens entirely in your browser. Large files may take a few moments depending on your device's performance.</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-indigo-500" />
              Quick Tools
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={normalizeAudio}
                disabled={!isReady || isProcessing}
                className="bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-medium py-2 px-3 rounded-lg border border-slate-200 transition-colors text-sm flex items-center justify-center gap-2"
              >
                Normalize
              </button>
              <button
                onClick={reverseAudio}
                disabled={!isReady || isProcessing}
                className="bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-medium py-2 px-3 rounded-lg border border-slate-200 transition-colors text-sm flex items-center justify-center gap-2"
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
