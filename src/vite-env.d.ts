/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    "lottie-player": {
      src?: string;
      background?: string;
      speed?: string | number;
      loop?: boolean | number;
      autoplay?: boolean;
      style?: React.CSSProperties;
      [key: string]: any;
    };
  }
}
