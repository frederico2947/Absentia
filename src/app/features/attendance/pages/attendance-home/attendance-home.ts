import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FaceRecognitionService, FaceMatchResult } from '../../../../core/services/face-recognition.service';
import { AttendanceService, TodayAttendance } from '../../../../core/services/attendance.service';
import { AuthService } from '../../../../core/services/auth.service';
import type * as faceapi from '@vladmandic/face-api';

type PageStatus = 'loading' | 'no-face-registered' | 'ready' | 'verifying' | 'recording' | 'error';

@Component({
  selector: 'app-attendance-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './attendance-home.html',
  styleUrl: './attendance-home.scss',
})
export class AttendanceHome implements OnInit, OnDestroy {
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly faceService = inject(FaceRecognitionService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);

  private stream: MediaStream | null = null;
  private detectionLoop: ReturnType<typeof requestAnimationFrame> | null = null;
  private faceMatcher: faceapi.FaceMatcher | null = null;
  private allUsers: { id: string; name: string }[] = [];

  readonly status = signal<PageStatus>('loading');
  readonly statusMessage = signal('');
  readonly currentUser = this.authService.currentUser;
  readonly modelsLoaded = this.faceService.modelsLoaded;
  readonly cameraReady = signal(false);
  readonly faceMatch = signal<FaceMatchResult>(null);
  readonly todayAttendance = signal<TodayAttendance | null>(null);
  readonly today = new Date();

  async ngOnInit(): Promise<void> {
    await this.faceService.loadModels();
    this.loadTodayAttendance();
    await this.initFaceMatcher();
    await this.startCamera();
    if (this.status() !== 'error' && this.status() !== 'no-face-registered') {
      this.startDetectionLoop();
    }
  }

  ngOnDestroy(): void {
    this.stopDetectionLoop();
    this.stopCamera();
  }

  private loadTodayAttendance(): void {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => this.todayAttendance.set(data),
    });
  }

  private async initFaceMatcher(): Promise<void> {
    return new Promise((resolve) => {
      this.attendanceService.getAllFaceDescriptors().subscribe({
        next: (entries) => {
          if (!entries.length) {
            this.status.set('no-face-registered');
            this.statusMessage.set('No face data found. Please register your face first.');
            resolve();
            return;
          }
          this.allUsers = entries.map(({ id, name }) => ({ id, name }));
          this.faceMatcher = this.faceService.buildMatcher(entries);
          this.status.set('ready');
          resolve();
        },
        error: () => {
          this.status.set('error');
          this.statusMessage.set('Failed to load face data. Please try again.');
          resolve();
        },
      });
    });
  }

  private async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      setTimeout(() => {
        if (this.videoRef?.nativeElement) {
          this.videoRef.nativeElement.srcObject = this.stream;
          this.cameraReady.set(true);
        }
      }, 200);
    } catch {
      this.status.set('error');
      this.statusMessage.set('Camera access denied. Please allow camera access.');
    }
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private startDetectionLoop(): void {
    const loop = async () => {
      if (this.status() === 'verifying' || this.status() === 'recording') {
        this.detectionLoop = requestAnimationFrame(loop);
        return;
      }

      const video = this.videoRef?.nativeElement;
      const canvas = this.canvasRef?.nativeElement;
      if (!video || !canvas || !this.cameraReady()) {
        this.detectionLoop = requestAnimationFrame(loop);
        return;
      }

      const detection = await this.faceService.detectSingleFace(video);
      let match: FaceMatchResult = null;

      if (detection && this.faceMatcher) {
        match = this.faceService.matchDescriptor(
          detection.descriptor,
          this.faceMatcher,
          this.allUsers,
        );
      }

      this.faceMatch.set(match);
      this.faceService.drawDetection(canvas, video, detection ?? null, match);

      this.detectionLoop = requestAnimationFrame(loop);
    };

    this.detectionLoop = requestAnimationFrame(loop);
  }

  private stopDetectionLoop(): void {
    if (this.detectionLoop !== null) {
      cancelAnimationFrame(this.detectionLoop);
      this.detectionLoop = null;
    }
  }

  async recordAttendance(type: 'check-in' | 'check-out'): Promise<void> {
    const match = this.faceMatch();
    if (!match) return;

    const currentUserId = this.currentUser()?.id;
    if (match.userId !== currentUserId) {
      this.statusMessage.set('Face does not match your account. Please ensure you are facing the camera.');
      return;
    }

    this.status.set('recording');
    this.statusMessage.set('');

    this.attendanceService.record(type, match.confidence).subscribe({
      next: () => {
        this.loadTodayAttendance();
        this.status.set('ready');
        this.statusMessage.set(`${type === 'check-in' ? 'Check-in' : 'Check-out'} recorded successfully!`);
        setTimeout(() => this.statusMessage.set(''), 4000);
      },
      error: (err) => {
        const message = err?.error?.message ?? `Failed to record ${type}.`;
        this.statusMessage.set(message);
        this.status.set('ready');
      },
    });
  }

  get canCheckIn(): boolean {
    return !!this.faceMatch() &&
      this.faceMatch()!.userId === this.currentUser()?.id &&
      !this.todayAttendance()?.checkIn &&
      this.status() === 'ready';
  }

  get canCheckOut(): boolean {
    return !!this.faceMatch() &&
      this.faceMatch()!.userId === this.currentUser()?.id &&
      !!this.todayAttendance()?.checkIn &&
      !this.todayAttendance()?.checkOut &&
      this.status() === 'ready';
  }
}
