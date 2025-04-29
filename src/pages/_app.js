import React from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/globals.css'; // Your global styles (if any)
import { Toaster } from 'sonner';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </>
  );
}