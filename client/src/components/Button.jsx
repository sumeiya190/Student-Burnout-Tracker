import React from 'react';
import '../styles/components/Button.css';

const Button = ({ type = 'button', onClick, children, className = '', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`custom-button ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
