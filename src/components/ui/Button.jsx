import React from 'react';

// Palette de couleurs du site - Style beige/doré élégant du dashboard original
const PALETTE = {
  premium: {
    primary: '#d4af37',      // Doré élégant principal
    light: '#f4e4c1',        // Beige très clair
    hover: '#c9a02d',       // Doré hover (légèrement plus foncé)
    active: '#b8941f',      // Doré active (pression subtile)
    disabled: '#e8dcc0'      // Beige disabled (plus pâle mais même identité)
  },
  secondary: {
    primary: '#c19a6b',      // Beige secondaire
    light: '#f5f5dc',        // Beige très clair secondaire
    hover: '#b8941f',       // Beige hover
    active: '#a67c52',      // Beige active
    disabled: '#d4c4a0'      // Beige disabled secondaire
  }
};

const Button = ({ 
  children, 
  variant = 'premium', 
  size = 'medium',
  disabled = false,
  onClick,
  type = 'button',
  style,
  className,
  ...props 
}) => {
  const colors = PALETTE[variant] || PALETTE.premium;
  
  const sizes = {
    small: {
      padding: '6px 12px',
      fontSize: '12px',
      borderRadius: '4px'
    },
    medium: {
      padding: '8px 16px',
      fontSize: '14px',
      borderRadius: '6px'
    },
    large: {
      padding: '12px 24px',
      fontSize: '16px',
      borderRadius: '8px'
    }
  };

  const baseStyle = {
    ...sizes[size],
    backgroundColor: disabled ? colors.disabled : colors.primary,
    color: disabled ? 'rgba(255, 255, 255, 0.7)' : 'white',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.3s ease',
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    textDecoration: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    ...style
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.target.style.backgroundColor = colors.hover;
      e.target.style.transform = 'scale(1.02)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled) {
      e.target.style.backgroundColor = colors.primary;
      e.target.style.transform = 'scale(1)';
    }
  };

  const handleMouseDown = (e) => {
    if (!disabled) {
      e.target.style.backgroundColor = colors.active;
    }
  };

  const handleMouseUp = (e) => {
    if (!disabled) {
      e.target.style.backgroundColor = colors.hover;
    }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={baseStyle}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
