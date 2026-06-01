import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'intro',
    title: '1. Introducción',
    content: `Kronos ("nosotros", "nuestro" o "la Plataforma") opera el sitio web kronos.app y la aplicación móvil Kronos. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos tu información personal cuando utilizas nuestros servicios.

Al crear una cuenta o usar Kronos, aceptas las prácticas descritas en esta política. Si no estás de acuerdo, no uses la Plataforma.

Fecha de vigencia: 1 de junio de 2026.`
  },
  {
    id: 'datos',
    title: '2. Datos que recopilamos',
    content: `Recopilamos la siguiente información:

Datos que tú proporcionas directamente:
• Nombre, apellido, nombre de usuario y correo electrónico al registrarte.
• Foto de perfil, biografía y demás información de perfil que agregues.
• Contenido que publicas: texto, imágenes, videos, historias y comentarios.
• Mensajes directos y comunicaciones en la plataforma.
• Información de pago procesada por Stripe (tarjeta, dirección de facturación). Kronos no almacena números de tarjeta — Stripe gestiona los datos de pago de forma segura.
• Respuestas a formularios, encuestas o comunicaciones con soporte.

Datos recopilados automáticamente:
• Dirección IP, tipo de dispositivo, sistema operativo y navegador.
• Páginas visitadas, funciones usadas y tiempo de sesión.
• Identificadores de dispositivo y cookies de sesión.
• Datos de geolocalización aproximada (a nivel de ciudad, no GPS preciso).
• Registros de actividad: publicaciones, likes, comentarios, seguimientos.

Datos de terceros:
• Si te registras con Google o Facebook, recibimos nombre, correo y foto de perfil de esa cuenta, con tu consentimiento.
• Socios de análisis (agregados, no identificables a nivel individual).`
  },
  {
    id: 'uso',
    title: '3. Cómo usamos tus datos',
    content: `Usamos tu información para:

Operar la Plataforma:
• Crear y gestionar tu cuenta.
• Mostrar tu perfil, posts y contenido a otros usuarios.
• Procesar pagos de suscripciones y compras en la tienda.
• Enviarte notificaciones sobre actividad relevante (nuevos seguidores, comentarios, mensajes).

Mejorar la experiencia:
• Personalizar tu feed y recomendaciones de contenido.
• Detectar y filtrar contenido inapropiado mediante análisis automatizado.
• Analizar patrones de uso para desarrollar nuevas funciones.

Seguridad y cumplimiento:
• Detectar fraudes, spam, abusos y actividad sospechosa.
• Cumplir con obligaciones legales y responder a requerimientos de autoridades.
• Aplicar nuestros Términos de Servicio.

Comunicaciones:
• Enviarte correos transaccionales (confirmación de cuenta, restablecimiento de contraseña, recibos de pago).
• Enviarte comunicaciones sobre cambios en la Plataforma o en esta política.
• Si optaste por recibirlos: correos de marketing (puedes darte de baja en cualquier momento).`
  },
  {
    id: 'terceros',
    title: '4. Compartir información con terceros',
    content: `No vendemos tu información personal. La compartimos únicamente en estos casos:

Proveedores de servicios (solo lo necesario para operar):
• Stripe — procesamiento de pagos y suscripciones.
• Cloudinary — almacenamiento y entrega de imágenes y videos.
• OpenAI — análisis de contenido y funciones de IA generativa (texto analizado, no datos personales identificables).
• Resend / Nodemailer — envío de correos transaccionales.
• MongoDB Atlas — almacenamiento de datos de la Plataforma.

Otros casos:
• Con tu consentimiento explícito.
• Para cumplir una obligación legal o requerimiento judicial.
• En caso de fusión, adquisición o venta de activos (se te notificará previamente).
• Para proteger los derechos, propiedad o seguridad de Kronos, sus usuarios o el público.

Todos nuestros proveedores están sujetos a acuerdos de confidencialidad y solo pueden usar tus datos para prestar el servicio contratado.`
  },
  {
    id: 'cookies',
    title: '5. Cookies y tecnologías similares',
    content: `Usamos cookies y almacenamiento local para:

• Mantener tu sesión activa (token JWT en localStorage).
• Recordar tus preferencias de idioma y tema.
• Medir el tráfico y analizar el uso de la Plataforma (datos agregados).
• Seguridad: detectar intentos de acceso no autorizados.

No utilizamos cookies de rastreo de terceros para publicidad comportamental.

Puedes desactivar las cookies en la configuración de tu navegador, aunque algunas funciones de la Plataforma podrían verse afectadas.`
  },
  {
    id: 'seguridad',
    title: '6. Seguridad de los datos',
    content: `Implementamos medidas técnicas y organizativas para proteger tu información:

• Transmisión cifrada mediante HTTPS/TLS en todas las comunicaciones.
• Contraseñas almacenadas con hash bcrypt (nunca en texto plano).
• Autenticación de dos factores (2FA) disponible para tu cuenta.
• Control de acceso basado en roles para el personal interno.
• Monitoreo continuo de actividad sospechosa y rate limiting en endpoints críticos.
• Seguridad HTTP headers mediante Helmet.js.
• Sanitización de entradas para prevenir inyección de código y XSS.

Ningún sistema es 100% seguro. En caso de una brecha de seguridad que afecte tus datos, te notificaremos en el plazo legalmente requerido.`
  },
  {
    id: 'retencion',
    title: '7. Retención de datos',
    content: `Conservamos tu información mientras tu cuenta esté activa.

• Si eliminas tu cuenta, tus datos personales se borran en un plazo de 30 días, salvo que debamos conservarlos por obligaciones legales (por ejemplo, registros de transacciones fiscales por 5 años).
• El contenido publicado públicamente puede permanecer en caché de terceros fuera de nuestro control.
• Los datos de facturación se conservan el tiempo que exija la ley fiscal aplicable.
• Los logs de seguridad se conservan por 12 meses.`
  },
  {
    id: 'derechos',
    title: '8. Tus derechos',
    content: `Tienes los siguientes derechos sobre tus datos personales:

• Acceso: solicitar una copia de los datos que tenemos sobre ti.
• Rectificación: corregir datos inexactos o incompletos.
• Eliminación ("derecho al olvido"): solicitar que borremos tus datos.
• Portabilidad: recibir tus datos en formato estructurado y legible por máquina.
• Oposición: oponerte al procesamiento de tus datos para fines de marketing.
• Restricción: limitar el procesamiento en ciertas circunstancias.
• Retirar el consentimiento en cualquier momento (sin afectar el procesamiento previo).

Para ejercer cualquiera de estos derechos, escríbenos a privacy@kronos.app. Responderemos en un plazo máximo de 30 días.

Si consideras que tus derechos no han sido respetados, puedes presentar una queja ante la autoridad de protección de datos de tu país.`
  },
  {
    id: 'menores',
    title: '9. Menores de edad',
    content: `Kronos no está dirigido a personas menores de 13 años. No recopilamos intencionalmente datos de menores de 13 años.

Si eres padre o tutor y crees que tu hijo menor de 13 años ha creado una cuenta, contáctanos a privacy@kronos.app y eliminaremos la cuenta y sus datos.

En jurisdicciones donde la edad mínima de consentimiento digital es superior (por ejemplo, 16 años en la UE bajo el GDPR), aplicamos el límite local correspondiente.`
  },
  {
    id: 'cambios',
    title: '10. Cambios a esta política',
    content: `Podemos actualizar esta Política de Privacidad periódicamente. Cuando hagamos cambios materiales:

• Actualizaremos la "Fecha de vigencia" al inicio de este documento.
• Te notificaremos por correo electrónico o mediante un aviso prominente en la Plataforma al menos 15 días antes de que los cambios entren en vigor.
• Para cambios no materiales (correcciones ortográficas, aclaraciones menores), la actualización es inmediata.

El uso continuado de la Plataforma después de la fecha de vigencia constituye aceptación de los cambios.`
  },
  {
    id: 'contacto',
    title: '11. Contacto',
    content: `Para preguntas, solicitudes o inquietudes sobre esta política o el tratamiento de tus datos:

Correo: privacy@kronos.app
Soporte general: support@kronos.app
Sitio web: kronos.app

Responsable del tratamiento de datos: Kronos Technologies S.A.S.
Fecha de última actualización: 1 de junio de 2026.`
  }
];

export default function Privacy() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0528 50%, #0d1117 100%)',
        padding: '64px 24px 80px',
        color: '#fff'
      }}
    >
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
              padding: '8px 16px',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 13,
              marginBottom: 28
            }}
          >
            ← Volver
          </button>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 8,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 16
            }}
          >
            Documento legal
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Política de Privacidad
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
            Última actualización: 1 de junio de 2026 · Kronos Technologies S.A.S.
          </p>
        </div>

        {/* Resumen rápido */}
        <div
          style={{
            background: 'rgba(6,182,212,0.06)',
            border: '1px solid rgba(6,182,212,0.2)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 32
          }}
        >
          <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Resumen simple
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.9 }}>
            <li>No vendemos tu información personal a terceros.</li>
            <li>Usamos Stripe para pagos — nunca almacenamos tus datos de tarjeta.</li>
            <li>Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento.</li>
            <li>El contenido que publicas puede ser analizado por IA para detectar toxicidad.</li>
            <li>Puedes escribirnos a privacy@kronos.app para cualquier consulta.</li>
          </ul>
        </div>

        {/* Secciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SECTIONS.map((sec) => {
            const isOpen = activeSection === sec.id;
            return (
              <div
                key={sec.id}
                style={{
                  background: isOpen
                    ? 'rgba(124,58,237,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isOpen ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}
              >
                <button
                  onClick={() => setActiveSection(isOpen ? null : sec.id)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '18px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    textAlign: 'left'
                  }}
                >
                  {sec.title}
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 18,
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                      marginLeft: 12
                    }}
                  >
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: '0 22px 22px',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 14,
                      lineHeight: 1.85,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {sec.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            © 2026 Kronos Technologies S.A.S. Todos los derechos reservados.
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            <button
              onClick={() => navigate('/terms')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a78bfa',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Términos de Servicio
            </button>
            <a
              href="mailto:privacy@kronos.app"
              style={{ color: '#a78bfa', fontSize: 13, textDecoration: 'underline' }}
            >
              privacy@kronos.app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
