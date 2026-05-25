import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FaceRecognitionService } from '../../../../core/services/face-recognition.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { AuthService } from '../../../../core/services/auth.service';

type Status = 'idle' | 'capturing' | 'saving' | 'done' | 'error';

const REQUIRED_SAMPLES = 5;

@Component({
  selector: 'app-face-register',
  imports: [RouterLink],
  templateUrl: './face-register.html',
  styleUrl: './face-register.scss',
})
export class FaceRegister implements OnInit, OnDestroy {
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly faceService = inject(FaceRecognitionService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private stream: MediaStream | null = null;
  private captureInterval: ReturnType<typeof setInterval> | null = null;
  private collectedDescriptors: Float32Array[] = [];

  readonly status = signal<Status>('idle');
  readonly statusMessage = signal('');
  readonly sampleCount = signal(0);
  readonly modelsLoaded = this.faceService.modelsLoaded;
  readonly loadingModels = this.faceService.loadingModels;
  readonly currentUser = this.authService.currentUser;
  readonly requiredSamples = REQUIRED_SAMPLES;
  readonly cameraReady = signal(false);

  async ngOnInit(): Promise<void> {
    await this.faceService.loadModels();
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCapture();
    this.stopCamera();
  }

  private async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      // Wait for viewChild to be rendered
      setTimeout(() => {
        if (this.videoRef?.nativeElement) {
          this.videoRef.nativeElement.srcObject = this.stream;
          this.cameraReady.set(true);
        }
      }, 100);
    } catch {
      this.status.set('error');
      this.statusMessage.set('Camera access denied. Please allow camera access to register your face.');
    }
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  startCapture(): void {
    this.collectedDescriptors = [];
    this.sampleCount.set(0);
    this.status.set('capturing');
    this.statusMessage.set('Look directly at the camera...');

    this.captureInterval = setInterval(() => void this.captureSample(), 800);
  }

  private async captureSample(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    if (!video) return;

    const descriptor = await this.faceService.computeDescriptor(video);
    if (!descriptor) {
      this.statusMessage.set('No face detected. Please center your face in the frame.');
      return;
    }

    this.collectedDescriptors.push(descriptor);
    const count = this.collectedDescriptors.length;
    this.sampleCount.set(count);
    this.statusMessage.set(`Captured ${count} of ${REQUIRED_SAMPLES} samples...`);

    if (count >= REQUIRED_SAMPLES) {
      this.stopCapture();
      await this.saveDescriptors();
    }
  }

  private stopCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  private async saveDescriptors(): Promise<void> {
    this.status.set('saving');
    this.statusMessage.set('Saving your face data...');

    const descriptorsAsArrays = this.collectedDescriptors.map((d) => Array.from(d));

    this.attendanceService.saveFaceDescriptors(descriptorsAsArrays).subscribe({
      next: () => {
        this.status.set('done');
        this.statusMessage.set('Face registered successfully! You can now use face recognition for attendance.');
      },
      error: () => {
        this.status.set('error');
        this.statusMessage.set('Failed to save face data. Please try again.');
      },
    });
  }

  retryCapture(): void {
    this.status.set('idle');
    this.statusMessage.set('');
    this.sampleCount.set(0);
    this.collectedDescriptors = [];
  }

  goToAttendance(): void {
    void this.router.navigateByUrl('/attendance');
  }

  get progressPercent(): number {
    return Math.round((this.sampleCount() / REQUIRED_SAMPLES) * 100);
  }
}
