import "./globals.css";

export const metadata = {
  title: "Client & Booking Manager",
  description: "Manage clients, appointments, and invoices in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
