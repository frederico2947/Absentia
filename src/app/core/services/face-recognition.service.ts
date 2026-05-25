import { Injectable, signal } from '@angular/core';
import * as faceapi from '@vladmandic/face-api';

export type FaceMatchResult = {
  userId: string;
  name: string;
  distance: number;
  confidence: number;
} | null;

@Injectable({ providedIn: 'root' })
export class FaceRecognitionService {
  private readonly MODEL_URL = '/models';
  readonly modelsLoaded = signal(false);
  readonly loadingModels = signal(false);

  async loadModels(): Promise<void> {
    if (this.modelsLoaded()) return;
    this.loadingModels.set(true);
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(this.MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.MODEL_URL),
      ]);
      this.modelsLoaded.set(true);
    } finally {
      this.loadingModels.set(false);
    }
  }

  async detectSingleFace(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
    if (!this.modelsLoaded()) return null;
    return faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();
  }

  async computeDescriptor(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  ): Promise<Float32Array | null> {
    const result = await this.detectSingleFace(input);
    return result?.descriptor ?? null;
  }

  buildMatcher(
    labeledDescriptors: { id: string; name: string; descriptors: number[][] }[],
  ): faceapi.FaceMatcher | null {
    if (!labeledDescriptors.length) return null;
    const labeled = labeledDescriptors.map(
      ({ id, descriptors }) =>
        new faceapi.LabeledFaceDescriptors(
          id,
          descriptors.map((d) => new Float32Array(d)),
        ),
    );
    return new faceapi.FaceMatcher(labeled, 0.5);
  }

  matchDescriptor(
    descriptor: Float32Array,
    matcher: faceapi.FaceMatcher,
    users: { id: string; name: string }[],
  ): FaceMatchResult {
    const best = matcher.findBestMatch(descriptor);
    if (best.label === 'unknown') return null;

    const user = users.find((u) => u.id === best.label);
    if (!user) return null;

    return {
      userId: user.id,
      name: user.name,
      distance: best.distance,
      confidence: Math.max(0, 1 - best.distance),
    };
  }

  drawDetection(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    detection: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>> | null,
    match: FaceMatchResult,
  ): void {
    const dims = faceapi.matchDimensions(canvas, video, true);
    faceapi.resizeResults(detection, dims);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detection) return;

    const box = detection.detection.box;
    const resizedBox = faceapi.resizeResults(detection, dims).detection.box;

    const color = match ? '#22c55e' : '#ef4444';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(resizedBox.x, resizedBox.y, resizedBox.width, resizedBox.height);

    if (match) {
      ctx.fillStyle = color;
      ctx.font = '14px sans-serif';
      ctx.fillText(
        `${match.name} (${Math.round(match.confidence * 100)}%)`,
        resizedBox.x,
        resizedBox.y > 20 ? resizedBox.y - 6 : resizedBox.y + resizedBox.height + 16,
      );
    }
  }
}
