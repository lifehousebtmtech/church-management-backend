import React from 'react';

const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName[0].toUpperCase() : '';
  const last = lastName ? lastName[0].toUpperCase() : '';
  return `${first}${last}`;
};

const Avatar = ({ src, firstName, lastName, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  // Generate background color based on initials
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 40%)`; // Using HSL for consistent brightness
  };

  const initials = getInitials(firstName, lastName);
  const backgroundColor = stringToColor(initials);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium`}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  );
};

export default Avatar;