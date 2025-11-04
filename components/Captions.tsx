"use client";
import React from 'react';

export function Captions({ text, uncertain }: { text: string; uncertain: boolean }) {
  return (
    <div className={`caption ${uncertain ? 'uncertain' : ''}`}>{text || '?'}</div>
  );
}
