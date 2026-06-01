import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'aceptacion',
    title: '1. Aceptación de los términos',
    content: `Al acceder o usar Kronos ("la Plataforma", "el Servicio"), ya sea a través del sitio web kronos.app o la aplicación móvil, aceptas estos Términos de Servicio ("Términos") y nuestra Política de Privacidad.

Si no estás de acuerdo con estos Términos, no uses el Servicio.

Kronos se reserva el derecho de actualizar estos Términos en cualquier momento. Los cambios materiales se notificarán con al menos 15 días de anticipación. El uso continuado del Servicio después de la fecha de vigencia de los cambios constituye aceptación.

Fecha de vigencia: 1 de junio de 2026.`
  },
  {
    id: 'elegibilidad',
    title: '2. Elegibilidad y registro',
    content: `Para usar Kronos debes:

• Tener al menos 13 años de edad (o la edad mínima de consentimiento digital en tu país).
• Proporcionar información precisa y veraz al registrarte.
• Mantener la confidencialidad de tu contraseña y ser responsable de toda actividad bajo tu cuenta.
• Notificarnos inmediatamente de cualquier uso no autorizado de tu cuenta.

Está prohibido:
• Crear cuentas falsas o hacerse pasar por otra persona.
• Usar la Plataforma si tienes prohibido recibir servicios según las leyes de tu país.
• Crear más de una cuenta personal (las cuentas de negocio son independientes).

Kronos se reserva el derecho de suspender o eliminar cuentas que violen estos Términos.`
  },
  {
    id: 'uso',
    title: '3. Uso permitido de la Plataforma',
    content: `Puedes usar Kronos para:

• Publicar contenido original (texto, imágenes, videos, historias).
• Interactuar con otros usuarios mediante likes, comentarios, mensajes directos y chats grupales.
• Comprar productos en la tienda integrada.
• Participar en comunidades y eventos.
• Usar las herramientas de IA para crear contenido (sujeto a tu tier de suscripción).
• Vender productos y servicios a través del Marketplace (sujeto a verificación).
• Realizar y recibir pagos de propinas y transferencias de Kronos Tokens.

El uso de la Plataforma es personal y no exclusivo. No puedes sublicenciar ni transferir tu derecho de uso a terceros.`
  },
  {
    id: 'prohibiciones',
    title: '4. Conductas prohibidas',
    content: `Está estrictamente prohibido:

Contenido inapropiado:
• Publicar contenido pornográfico, obsceno o sexualmente explícito.
• Difundir discurso de odio, discriminación o incitación a la violencia.
• Publicar contenido que promueva el terrorismo o actos delictivos.
• Acosar, intimidar, amenazar o doxear a otros usuarios.
• Compartir contenido que infrinja derechos de autor o marcas registradas sin autorización.

Actividades fraudulentas:
• Usar la Plataforma para estafas, phishing o fraudes financieros.
• Manipular sistemas de recompensas, rankings o métricas de forma artificial.
• Hacer spam masivo de mensajes o notificaciones.

Interferencia técnica:
• Intentar acceder sin autorización a sistemas, cuentas o datos de otros usuarios.
• Usar bots, scrapers o herramientas automatizadas sin permiso escrito de Kronos.
• Distribuir malware, virus o código dañino.
• Realizar ataques de denegación de servicio o intentar sobrecargar la infraestructura.

El incumplimiento puede resultar en suspensión inmediata de la cuenta, sin derecho a reembolso de suscripciones activas en los casos más graves.`
  },
  {
    id: 'contenido',
    title: '5. Contenido del usuario',
    content: `Tú eres responsable del contenido que publicas.

Licencia que nos otorgas:
Al publicar contenido en Kronos, nos otorgas una licencia mundial, no exclusiva, libre de regalías para usar, reproducir, modificar, adaptar, publicar, traducir y distribuir ese contenido dentro de la Plataforma, incluyendo para fines de moderación y mejora del servicio. Esta licencia termina cuando eliminas el contenido o tu cuenta.

Lo que no cedemos:
• No reclamamos propiedad sobre tu contenido.
• No vendemos tu contenido a terceros.
• Puedes eliminar tu contenido en cualquier momento.

Moderación:
Kronos puede (pero no está obligado a) revisar, filtrar o eliminar contenido que viole estos Términos. Usamos sistemas automatizados de análisis (incluida IA) para detectar contenido inapropiado antes de su publicación. Esto no nos convierte en responsables del contenido publicado por usuarios.

Si tu contenido es eliminado, puedes apelar la decisión enviando un correo a moderation@kronos.app.`
  },
  {
    id: 'suscripciones',
    title: '6. Suscripciones y pagos',
    content: `Planes disponibles:
• Free — gratuito, con funciones básicas.
• Plus — $4.99 USD/mes, funciones intermedias.
• Pro — $9.99 USD/mes, funciones avanzadas.
• Business — $29.99 USD/mes, para creadores y negocios.

Facturación:
• Las suscripciones se cobran mensualmente de forma automática mediante Stripe.
• Los precios se muestran en USD e incluyen los impuestos aplicables según tu ubicación.
• El cobro se realiza en la fecha de inicio de tu suscripción y cada mes en la misma fecha.

Cancelaciones:
• Puedes cancelar tu suscripción en cualquier momento desde Configuración > Cuenta.
• Al cancelar, el acceso a funciones de pago se mantiene hasta el final del período ya pagado.
• No se emiten reembolsos proporcionales por cancelaciones en medio del período, salvo que la ley lo exija.

Reembolsos:
• Los reembolsos se evalúan caso a caso. Contáctanos a support@kronos.app dentro de los 7 días posteriores al cargo.
• Las compras de la tienda tienen su propia política de devoluciones disponible en cada producto.

Kronos se reserva el derecho de modificar los precios con al menos 30 días de aviso previo.`
  },
  {
    id: 'pi',
    title: '7. Propiedad intelectual',
    content: `Propiedad de Kronos:
El nombre, logo, diseño, código fuente, base de datos, algoritmos y funciones de la Plataforma son propiedad exclusiva de Kronos Technologies S.A.S. y están protegidos por leyes de propiedad intelectual.

No puedes:
• Copiar, modificar, descompilar o realizar ingeniería inversa de la Plataforma.
• Usar nuestras marcas, logos o nombre sin autorización escrita.
• Crear obras derivadas de nuestro software.

Propiedad del usuario:
• Rettienes todos los derechos sobre el contenido que creas y publicas.
• Kronos no reclama propiedad sobre tus creaciones.

Denuncias de infracción (DMCA):
Si crees que tu contenido ha sido usado sin autorización, envía una notificación a legal@kronos.app con: descripción del contenido, URL donde aparece, tu información de contacto y declaración bajo protesta de decir verdad.`
  },
  {
    id: 'marketplace',
    title: '8. Marketplace y transacciones',
    content: `Kronos opera un marketplace donde usuarios pueden comprar y vender productos.

Vendedores:
• Eres responsable de la veracidad de la descripción de tus productos.
• Debes cumplir con las leyes de comercio electrónico de tu jurisdicción.
• Las comisiones del Marketplace se aplican según las tarifas vigentes publicadas en la Plataforma.
• Las ventas usan un sistema de escrow — los fondos se liberan al comprador confirmar recepción.

Compradores:
• Verifica la descripción del producto antes de comprar.
• Los pagos se procesan por Stripe; Kronos no almacena datos de tarjeta.
• Para disputas, contacta primero al vendedor. Si no hay resolución, abre un caso en support@kronos.app.

Kronos actúa como intermediario, no como vendedor directo. No somos responsables por la calidad, seguridad legal o entrega de productos vendidos por terceros en el Marketplace.`
  },
  {
    id: 'limitacion',
    title: '9. Limitación de responsabilidad',
    content: `En la máxima medida permitida por la ley aplicable:

• Kronos provee el Servicio "tal cual" y "según disponibilidad", sin garantías de ningún tipo.
• No garantizamos que el Servicio sea ininterrumpido, libre de errores o completamente seguro.
• No somos responsables por daños indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso del Servicio.
• Nuestra responsabilidad total no excederá el monto que hayas pagado a Kronos en los 12 meses anteriores al evento que generó la reclamación, o $100 USD si no realizaste pagos.

Esta limitación aplica incluso si Kronos fue advertido de la posibilidad de tales daños. Algunas jurisdicciones no permiten excluir ciertas garantías o limitar la responsabilidad, por lo que estas exclusiones pueden no aplicar en tu caso.`
  },
  {
    id: 'terminacion',
    title: '10. Terminación',
    content: `Puedes terminar tu uso de Kronos en cualquier momento eliminando tu cuenta desde Configuración > Cuenta > Eliminar cuenta.

Kronos puede suspender o terminar tu acceso:
• Si violas estos Términos.
• Si tu cuenta muestra actividad fraudulenta o dañina.
• Si lo requiere una orden judicial o autoridad competente.
• Si decide descontinuar el Servicio (con al menos 30 días de aviso).

Efectos de la terminación:
• Perderás acceso a tu cuenta y contenido.
• Las suscripciones activas se cancelarán; no se emiten reembolsos por tiempo no usado salvo que la ley lo exija.
• Las obligaciones que por su naturaleza deben sobrevivir (propiedad intelectual, limitaciones de responsabilidad) permanecen vigentes.`
  },
  {
    id: 'ley',
    title: '11. Ley aplicable y resolución de disputas',
    content: `Estos Términos se rigen por las leyes de la República de Colombia, sin perjuicio de los derechos de protección al consumidor que puedas tener en tu país de residencia.

Para cualquier disputa, primero contáctanos a legal@kronos.app para buscar una resolución amistosa. Si no se alcanza un acuerdo en 30 días, las disputas se someterán a los tribunales competentes de la ciudad de Bogotá, Colombia.

Si eres residente de la Unión Europea, también puedes recurrir a la plataforma de resolución de disputas en línea de la Comisión Europea: ec.europa.eu/consumers/odr.`
  },
  {
    id: 'general',
    title: '12. Disposiciones generales',
    content: `Integralidad: Estos Términos, junto con la Política de Privacidad y demás políticas específicas, constituyen el acuerdo completo entre tú y Kronos.

Divisibilidad: Si alguna cláusula es declarada inválida, el resto del acuerdo permanece vigente.

Renuncia: El hecho de que Kronos no ejerza un derecho no constituye renuncia a ese derecho.

Cesión: No puedes ceder tus derechos u obligaciones bajo estos Términos sin nuestro consentimiento escrito. Kronos puede ceder sus derechos en caso de fusión o adquisición.

Idioma: En caso de discrepancia entre versiones en distintos idiomas, prevalece la versión en español.

Contacto: Para preguntas sobre estos Términos, escríbenos a legal@kronos.app.

Kronos Technologies S.A.S. — Bogotá, Colombia — 2026.`
  }
];

export default function Terms() {
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
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa',
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
              background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Términos de Servicio
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
            Última actualización: 1 de junio de 2026 · Kronos Technologies S.A.S.
          </p>
        </div>

        {/* Resumen rápido */}
        <div
          style={{
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 32
          }}
        >
          <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Puntos clave
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.9 }}>
            <li>Debes tener al menos 13 años para usar Kronos.</li>
            <li>Eres responsable del contenido que publicas.</li>
            <li>Prohibido contenido de odio, spam, fraude o acoso.</li>
            <li>Las suscripciones se cobran mensualmente y puedes cancelar cuando quieras.</li>
            <li>Kronos puede eliminar contenido o cuentas que violen estos términos.</li>
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
                    ? 'rgba(59,130,246,0.06)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isOpen ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
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
              onClick={() => navigate('/privacy')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Política de Privacidad
            </button>
            <a
              href="mailto:legal@kronos.app"
              style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'underline' }}
            >
              legal@kronos.app
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
