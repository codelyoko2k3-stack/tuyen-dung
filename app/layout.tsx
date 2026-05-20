import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vitech Tuyen Dung',
  description: 'Vitech Tuyen Dung',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
