import './globals.css';

export const metadata = {
  title: 'DD Ai 에이전트',
  description: 'AI 에이전트 팀이 당신의 의사결정을 돕습니다',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
