'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseQrScannerOptions {
  onScanSuccess: (result: string) => void;
  onScanError?: (error: Error) => void;
}

export interface UseQrScannerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  isLoading: boolean;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
}

// 스캔 쿨다운 (중복 스캔 방지)
const SCAN_COOLDOWN_MS = 1000;

/**
 * BarcodeDetector 지원 여부 확인
 */
async function checkBarcodeDetectorSupport(): Promise<boolean> {
  if (!('BarcodeDetector' in window)) {
    return false;
  }
  try {
    // @ts-expect-error BarcodeDetector 타입 미정의
    const formats = await BarcodeDetector.getSupportedFormats();
    return formats.includes('qr_code');
  } catch {
    return false;
  }
}

/**
 * 네이티브 BarcodeDetector로 스캔
 */
async function startNativeScan(video: HTMLVideoElement, onResult: (text: string) => void): Promise<() => void> {
  // @ts-expect-error BarcodeDetector 타입 미정의
  const detector = new BarcodeDetector({ formats: ['qr_code'] });

  let stopped = false;
  let lastScanTime = 0;

  const scan = async (): Promise<void> => {
    if (stopped) return;

    try {
      const barcodes = await detector.detect(video);
      if (barcodes?.length) {
        const value = barcodes[0].rawValue;
        const now = Date.now();

        if (value && now - lastScanTime >= SCAN_COOLDOWN_MS) {
          lastScanTime = now;
          onResult(value);
        }
      }
    } catch {
      // detect 중 오류는 무시하고 계속 시도
    }

    if (!stopped) {
      requestAnimationFrame(scan);
    }
  };

  scan();

  return (): void => {
    stopped = true;
  };
}

/**
 * @zxing/browser로 스캔 (폴백)
 */
async function startZxingScan(video: HTMLVideoElement, onResult: (text: string) => void): Promise<() => void> {
  const { BrowserQRCodeReader } = await import('@zxing/browser');
  const codeReader = new BrowserQRCodeReader();

  let lastScanTime = 0;

  const controls = await codeReader.decodeFromVideoElement(video, result => {
    if (result) {
      const now = Date.now();
      if (now - lastScanTime >= SCAN_COOLDOWN_MS) {
        lastScanTime = now;
        onResult(result.getText());
      }
    }
  });

  return (): void => {
    controls.stop();
  };
}

/**
 * QR 코드 스캐너 훅
 */
export function useQrScanner(options: UseQrScannerOptions): UseQrScannerReturn {
  const { onScanSuccess, onScanError } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopScanRef = useRef<(() => void) | null>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback((): void => {
    // 스캔 루프 중지
    if (stopScanRef.current) {
      stopScanRef.current();
      stopScanRef.current = null;
    }

    // 카메라 스트림 해제
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 비디오 소스 해제
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async (): Promise<void> => {
    if (isScanning || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // 카메라 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;

      // 비디오 엘리먼트에 스트림 연결
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);

      // BarcodeDetector 지원 여부 확인 후 스캔 시작
      const supportsBarcodeDetector = await checkBarcodeDetectorSupport();

      if (supportsBarcodeDetector && videoRef.current) {
        // 네이티브 API 사용
        stopScanRef.current = await startNativeScan(videoRef.current, onScanSuccess);
      } else if (videoRef.current) {
        // @zxing/browser 폴백
        stopScanRef.current = await startZxingScan(videoRef.current, onScanSuccess);
      }
    } catch (err) {
      const error = err as Error;

      // 에러 메시지 한국어 처리
      let errorMessage = '카메라를 시작할 수 없습니다.';

      if (error.name === 'NotAllowedError') {
        errorMessage = '카메라 권한이 거부되었습니다.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '카메라를 찾을 수 없습니다.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '카메라가 다른 앱에서 사용 중입니다.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = '요청한 카메라 설정을 지원하지 않습니다.';
      }

      setError(errorMessage);
      onScanError?.(error);
      stopScanning();
    } finally {
      setIsLoading(false);
    }
  }, [isScanning, isLoading, onScanSuccess, onScanError, stopScanning]);

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    videoRef,
    isScanning,
    isLoading,
    error,
    startScanning,
    stopScanning
  };
}
