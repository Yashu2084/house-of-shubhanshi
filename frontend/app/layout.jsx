import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LightboxProvider } from '../components/ImageLightbox';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AddToCartModal from '../components/AddToCartModal';
import Toast from '../components/Toast';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://houseofshubhanshi.com'),
  title: 'House of Shubhanshi — Wear the Dream | Indian Luxury Fashion',
  description: 'House of Shubhanshi is a premium Indian luxury fashion atelier celebrating heritage karigari, handcrafted zardozi, and timeless couture silhouettes.',
  icons: {
    icon: '/assets/logo/house-of-shubhanshi-logo.svg',
    shortcut: '/assets/logo/house-of-shubhanshi-logo.png'
  },
  openGraph: {
    title: 'House of Shubhanshi — Wear the Dream',
    description: 'Bespoke bridal heirlooms, handcrafted zardozi kurtas, and fine luxury dress rentals.',
    images: ['/assets/images/hero/final-cta-bg.jpg']
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <LightboxProvider>
              <Navbar />
              {children}
              <Footer />
              <AddToCartModal />
              <Toast />
            </LightboxProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
