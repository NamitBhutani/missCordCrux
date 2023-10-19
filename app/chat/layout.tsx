interface ChatData {
  chats: {
    with: string;
  };
  images: {
    publicUrl: string;
  };
}
export default async function ChatRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const res = await fetch("http://localhost:3000/chats/get/", {
    cache: "no-store",
  });
  const data = await res.json();
  return (
    <html lang="en">
      <body>
        {JSON.stringify(data)}
        {children}
      </body>
    </html>
  );
}
