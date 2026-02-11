// app/layout.js
import "./globals.css";
import { LayerStackProvider } from "@/components/LayerStackProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Sysbyte WebApp",
  description: "Customer + Calander Containers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="theme-dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LayerStackProvider>{children}</LayerStackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
