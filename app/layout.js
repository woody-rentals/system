import "./globals.scss";


export const metadata = {
  title: "Woody システム",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body >
        {children}
      </body>
    </html>
  );
}
