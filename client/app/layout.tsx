import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
const inter = Inter({ subsets: ["latin"] });
import { Toaster } from "react-hot-toast";
import { ModeToggle } from "@/customComponents/ModeToggle";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/codelib/database.types";
import LogoutButton from "@/customComponents/LogoutButton";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
export const metadata: Metadata = {
  title: "MissCord",
  description: "Generated by a twat",
};
let isLoggedIn = false;
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const { data, error } = await supabase.auth.getSession();
  if (data.session) {
    isLoggedIn = true;
  } else {
    isLoggedIn = false;
  }
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <div className="flex justify-between p-4">
              <ModeToggle />
              <Link href="/" className={buttonVariants()}>
                Home
              </Link>
              {isLoggedIn ? (
                <div>
                  <LogoutButton />
                </div>
              ) : null}
            </div>

            <Toaster
              toastOptions={{
                className: "",
                style: {
                  borderRadius: "10px",
                  background: "#222",
                  color: "#fff",
                },
              }}
            ></Toaster>
            <div className="flex-1">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
