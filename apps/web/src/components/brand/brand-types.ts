export type AnimationMode = 'intro' | 'idle' | 'static';
export type BackgroundMode = 'dark' | 'transparent' | 'light';
export interface VirtualInkAnimatedLogoProps {
  size?:number; autoRotate?:boolean; rotationSpeed?:number; showWordmark?:boolean;
  showTagline?:boolean; animationMode?:AnimationMode; backgroundMode?:BackgroundMode;
  interactive?:boolean; paused?:boolean; replayToken?:number; onIntroComplete?:()=>void;
  className?:string;
}
