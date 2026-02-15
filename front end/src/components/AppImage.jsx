import React from 'react';

function Image({
  src,
  alt = "Image Name",
  className = "",
  ...props
}) {

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.target.src = `${import.meta.env.BASE_URL}assets/images/no_image.png`
      }}
      {...props}
    />
  );
}

export default Image;
