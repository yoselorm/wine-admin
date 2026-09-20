import React, { useEffect, useState } from 'react';

// Every image-upload spot in the app needs the same thing: show what the admin just picked,
// before it's saved anywhere. `file` can be a freshly-picked File (preview via a local object
// URL) or an existing string URL (already-saved image) — the object URL's lifecycle is managed
// here so callers never have to remember to revoke it.
const ImagePreview = ({ file, className = '', alt = '' }) => {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [file]);

  const src = objectUrl || (typeof file === 'string' && file ? file : null);
  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
};

export default ImagePreview;
