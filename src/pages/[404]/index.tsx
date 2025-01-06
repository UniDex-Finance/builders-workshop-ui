import { useEffect } from 'react';

import { useRouter } from 'next/router';

const NotFound = () => {

    const router = useRouter();

  // Using useEffect for client-side redirect
  useEffect(() => {
    window.location.href = '/';
    router.push('/');
  }, []);

  return null; // or you could return a loading state if desired
}

export default NotFound;