import { Frank_Ruhl_Libre, Heebo } from "next/font/google";

export const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-frank-ruhl",
  display: "swap",
});

export const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heebo",
  display: "swap",
});

export const fontVariables = `${frankRuhl.variable} ${heebo.variable}`;
