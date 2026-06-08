import React from 'react';
import BotonBurbuja3D from './BotonBurbuja3D';
import { useToast } from '../../hooks/useToast';

/**
 * Botón para guardar/compartir órdenes en Google Keep u otras apps.
 * @param {Object} order - El objeto de la orden con items, total y id.
 */
const KeepShareButton = ({ order }) => {
  const { showToast } = useToast();

  const formatOrderText = () => {
    const itemsList = order.items
      .map(item => `- ${item.name} (x${item.quantity})`)
      .join('\n');
    
    return `🛒 *Orden Kronos #${order._id.slice(-6)}*\n\n` +
           `Detalles:\n${itemsList}\n\n` +
           `💰 Total: $${order.totalAmount}\n` +
           `📅 Fecha: ${new Date(order.createdAt).toLocaleDateString()}\n\n` +
           `Enviado desde Kronos Super-App`;
  };

  const handleShare = async () => {
    const text = formatOrderText();
    const shareData = {
      title: `Orden Kronos #${order._id.slice(-6)}`,
      text: text,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error al compartir:', err);
      }
    } else {
      // Fallback para Desktop: Copiar al portapapeles
      try {
        await navigator.clipboard.writeText(text);
        showToast('📋 Detalles copiados. ¡Pégalos en Google Keep!', 'success');
      } catch (err) {
        showToast('❌ No se pudo copiar la orden', 'error');
      }
    }
  };

  return (
    <BotonBurbuja3D 
      variant="outline" 
      size="sm" 
      onClick={handleShare}
      style={{ gap: '8px', display: 'flex', alignItems: 'center' }}
    >
      <span>💡</span> Guardar en Keep
    </BotonBurbuja3D>
  );
};

export default KeepShareButton;
