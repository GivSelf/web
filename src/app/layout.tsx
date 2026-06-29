import type { Metadata } from "next";
import {
  Hanken_Grotesk,
  Space_Grotesk,
  Bricolage_Grotesque,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

// One display/UI face per theme + JetBrains Mono for numeric/metadata labels.
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

const fontVars = `${hanken.variable} ${space.variable} ${bricolage.variable} ${jetbrains.variable}`;

export const metadata: Metadata = {
  title: "GivSelf — Home Energy",
  description: "Self-hosted home energy management system",
};

// Apply the persisted theme before paint to avoid a flash of the wrong theme.
// Aurora is the dark theme, so keep Tailwind's `.dark` class in sync for the
// other (sidebar) pages that still style with `dark:` variants.
const themeInit = `
try {
  var t = localStorage.getItem('givself-theme') || 'hearth';
  document.documentElement.dataset.theme = t;
  document.documentElement.classList.toggle('dark', t === 'aurora');
} catch (e) {
  document.documentElement.dataset.theme = 'hearth';
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="hearth"
      className={`${fontVars} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
