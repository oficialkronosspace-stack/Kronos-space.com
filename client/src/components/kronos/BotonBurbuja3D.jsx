import React from 'react';
import './BotonBurbuja3D.css';

/**
 * Botón Burbuja Flotante 3D Tornasol — Plan Maestro Kronos
 *
 * Props:
 *   size     — 'sm' | 'md' | 'lg'             (default: 'md')
 *   variant  — 'primary' | 'outline' | 'icon-only'  (default: 'primary')
 *   disabled — boolean
 *   onClick  — function
 *   as       — 'button' | 'a' | any tag       (default: 'button')
 */
function BotonBurbuja3D({
  children,
  size = 'md',
  variant = 'primary',
  disabled = false,
  onClick,
  as: Tag = 'button',
  className = '',
  style = {},
  ...props
}) {
  const classes = [
    'btn-burbuja-3d',
    `size-${size}`,
    variant !== 'primary' ? variant : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag
      className={classes}
      onClick={disabled ? undefined : onClick}
      disabled={Tag === 'button' ? disabled : undefined}
      aria-disabled={disabled}
      style={style}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default BotonBurbuja3D;
