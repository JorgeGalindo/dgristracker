import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./Nav";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata = {
  title: "DGRIS Tracker · Antoni Plasència",
  description:
    "Informe y río de alertas sobre Antoni Plasència (DGRIS) y su entorno institucional en el Departament de Salut de Catalunya.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={robotoMono.variable}>
      <body>
        <Nav />
        <main>{children}</main>
        <footer>
          <span>DGRIS TRACKER</span>
          <span>
            seguimiento automatizado · barrido semanal de presencia en medios
          </span>
        </footer>
      </body>
    </html>
  );
}
