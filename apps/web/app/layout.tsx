export const metadata = {
  title: "Family Meal Planner",
  description: "Private family meal planning MVP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
