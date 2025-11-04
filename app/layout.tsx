export const metadata = {
  title: 'Live Speech to Sign Avatar',
  description: 'Speech ? Clean Text ? Sign Semantics ? Gloss+NMM ? Anime Avatar + Captions',
};

import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
