import { useEffect } from 'react';

export default function Homepage() {
  useEffect(() => {
    window.location.replace('https://small-pos-nine.vercel.app/login');
  }, []);

  return null;
}
