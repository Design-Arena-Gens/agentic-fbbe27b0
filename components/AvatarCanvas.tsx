"use client";
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { SignFrame } from '@/lib/pipeline';

type AvatarStyle = 'anime';

export type AvatarCanvasHandle = {
  play: (frames: SignFrame[], options?: { uncertain?: boolean }) => void;
  clear: () => void;
};

export const AvatarCanvas = forwardRef<AvatarCanvasHandle, { style: AvatarStyle }>(
  function AvatarCanvas(props, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const stateRef = useRef<{ frames: SignFrame[]; t0: number; uncertain: boolean }>({
      frames: [],
      t0: 0,
      uncertain: false,
    });

    useImperativeHandle(ref, () => ({
      play(frames, options) {
        stateRef.current.frames = frames;
        stateRef.current.t0 = performance.now();
        stateRef.current.uncertain = Boolean(options?.uncertain);
        loop();
      },
      clear() {
        stateRef.current.frames = [];
        drawEmpty();
      },
    }));

    useEffect(() => {
      drawEmpty();
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, []);

    function loop() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(renderFrame);
    }

    function renderFrame() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { frames, t0, uncertain } = stateRef.current;
      const now = performance.now();
      const t = now - t0;

      // Find active frame by time
      let active: SignFrame | null = null;
      for (const f of frames) {
        if (t >= f.startMs && t < f.endMs) {
          active = f;
          break;
        }
      }

      // If finished, freeze on last state
      if (!active && frames.length > 0 && t >= frames[frames.length - 1].endMs) {
        active = frames[frames.length - 1];
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Anime face bg
      drawGradient(ctx, canvas);
      drawFace(ctx, { uncertain });

      if (active) {
        drawNMM(ctx, active);
        drawHands(ctx, active);
        drawGloss(ctx, active);
      }

      if (frames.length > 0 && (!active || (active && t < frames[frames.length - 1].endMs))) {
        loop();
      }
    }

    function drawEmpty() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGradient(ctx, canvas);
      drawFace(ctx, { uncertain: false });
    }

    function drawGradient(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, '#fdfbff');
      g.addColorStop(1, '#f3f6ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawFace(ctx: CanvasRenderingContext2D, opts: { uncertain: boolean }) {
      const centerX = 200;
      const centerY = 140;
      // head
      ctx.fillStyle = '#ffe9f0';
      ctx.strokeStyle = opts.uncertain ? '#f59e0b' : '#222';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 80, 90, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // eyes
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(centerX - 30, centerY - 10, 8, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(centerX + 30, centerY - 10, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // simple mouth
      ctx.strokeStyle = '#ff4d6d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 20, centerY + 30);
      ctx.quadraticCurveTo(centerX, centerY + 45, centerX + 20, centerY + 30);
      ctx.stroke();
    }

    function drawNMM(ctx: CanvasRenderingContext2D, f: SignFrame) {
      const centerX = 200;
      const centerY = 140;
      ctx.save();
      // eyebrows
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const browOffset = f.nmm.brows === 'raised' ? -15 : f.nmm.brows === 'furrowed' ? -3 : -8;
      ctx.moveTo(centerX - 45, centerY - 35 + browOffset);
      ctx.lineTo(centerX - 15, centerY - 40 + browOffset);
      ctx.moveTo(centerX + 45, centerY - 35 + browOffset);
      ctx.lineTo(centerX + 15, centerY - 40 + browOffset);
      ctx.stroke();

      // head tilt
      if (f.nmm.head === 'shake' || f.nmm.head === 'nod' || f.nmm.head === 'tilt') {
        ctx.strokeStyle = '#8b5cf6';
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(200, 140, 110, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
      }

      // mouth morpheme label
      if (f.nmm.mouth) {
        ctx.fillStyle = '#111827';
        ctx.font = '12px system-ui';
        ctx.fillText(`mouth: ${f.nmm.mouth}`, 12, 24);
      }

      ctx.restore();
    }

    function drawHands(ctx: CanvasRenderingContext2D, f: SignFrame) {
      const baseY = 260;
      const leftX = 150;
      const rightX = 250;

      const hand = (x: number, label: string) => {
        ctx.save();
        ctx.fillStyle = '#ffe1c6';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 25, baseY - 20, 50, 40, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, baseY + 24);
        ctx.restore();
      };

      const gloss = f.gloss;
      const left = f.handshape.left ?? '5';
      const right = f.handshape.right ?? '5';
      hand(leftX, left);
      hand(rightX, right);

      // location arcs
      if (f.location) {
        ctx.strokeStyle = '#60a5fa';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftX, baseY - 20);
        ctx.lineTo(200, 200);
        ctx.lineTo(rightX, baseY - 20);
        ctx.stroke();
      }

      // main gloss title
      ctx.fillStyle = '#111827';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(gloss, 200, 40);

      // classifier/role shift
      if (f.roleShift) {
        ctx.fillStyle = '#10b981';
        ctx.font = '12px system-ui';
        ctx.fillText(`role: ${f.roleShift}`, 200, 60);
      }

      // fingerspelling overlay
      if (f.fingerspell) {
        ctx.fillStyle = '#1f2937';
        ctx.font = '14px monospace';
        ctx.fillText(f.fingerspell, 200, 80);
      }
    }

    function drawGloss(ctx: CanvasRenderingContext2D, f: SignFrame) {
      ctx.fillStyle = '#374151';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`[${f.semantic}]`, 200, 100);
    }

    return (
      <canvas ref={canvasRef} width={400} height={320} />
    );
  }
);
