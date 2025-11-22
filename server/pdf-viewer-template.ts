// server/pdf-viewer-template.ts

export function renderSecurePDFViewer(diagramId: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TecniFlux - Visor Seguro</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #05060a;
      color: #fff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }
    #header {
      padding: 8px 12px;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(90deg, #0f172a, #020617);
      border-bottom: 1px solid #1f2933;
    }
    #header span.app-name {
      font-weight: 600;
      letter-spacing: 0.03em;
      color: #38bdf8;
    }
    #header span.note {
      opacity: 0.8;
      font-size: 12px;
    }
    #viewer-wrapper {
      flex: 1;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #05060a;
      position: relative;
    }
    #pdf-frame {
      position: absolute;
      top: -40px;
      left: 0;
      width: 100%;
      height: calc(100% + 40px);
      border: none;
      background: #05060a;
    }
    /* TecniFlux Loader Styles */
    .tf-loader-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5, 6, 10, 0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.4s ease, visibility 0.4s ease;
    }
    .tf-loader-overlay.tf-loader-hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .tf-loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .tf-loader-ring {
      width: 80px;
      height: 80px;
      border-radius: 999px;
      border: 3px solid rgba(24, 224, 255, 0.2);
      border-top-color: #18E0FF;
      border-right-color: #2E8BFF;
      border-bottom-color: #18E0FF;
      border-left-color: #2E8BFF;
      box-shadow:
        0 0 12px rgba(24, 224, 255, 0.6),
        0 0 24px rgba(46, 139, 255, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: tf-spin 1.2s linear infinite;
    }
    .tf-loader-core {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 30%, #18E0FF, #2E8BFF 70%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 0 10px rgba(24, 224, 255, 0.9),
        0 0 22px rgba(46, 139, 255, 0.7);
    }
    .tf-loader-ray {
      font-size: 22px;
      color: #ffffff;
      text-shadow:
        0 0 6px rgba(255, 255, 255, 0.9),
        0 0 14px rgba(24, 224, 255, 0.9);
      animation: tf-pulse 0.9s ease-in-out infinite;
    }
    .tf-loader-text {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 15px;
      color: #ffffff;
      text-align: center;
      letter-spacing: 0.02em;
    }
    .tf-loader-subtext {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
    }
    /* Animaciones */
    @keyframes tf-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes tf-pulse {
      0% {
        transform: scale(1);
        opacity: 0.9;
      }
      50% {
        transform: scale(1.14);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 0.9;
      }
    }
    /* Animación de entrada del visor TecniFlux */
    .tf-viewer-root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      opacity: 0;
      transform: translateY(8px);
      filter: blur(2px);
      transition:
        opacity 0.45s ease-out,
        transform 0.45s ease-out,
        filter 0.45s ease-out;
    }
    /* Estado cuando el visor está montado pero aún puede estar cargando */
    .tf-viewer-root.tf-viewer-mounted {
      opacity: 0.6;
      transform: translateY(4px);
      filter: blur(1px);
    }
    /* Estado final cuando el PDF ya cargó y el loader se ocultó */
    .tf-viewer-root.tf-viewer-ready {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
  </style>
</head>

<body>
  <div id="tf-viewer-root" class="tf-viewer-root">
    <div id="wrapper">
      <div id="header">
        <span class="app-name">TecniFlux • Visor seguro</span>
        <span class="note">Sólo visualización • Descarga deshabilitada</span>
      </div>
      <div id="viewer-wrapper">
        <iframe
          id="pdf-frame"
          src="/api/diagrams/${diagramId}/file#toolbar=0&navpanes=0"
        ></iframe>
      </div>
    </div>
  </div>
  <div id="tf-loader-overlay" class="tf-loader-overlay">
    <div class="tf-loader-container">
      <div class="tf-loader-ring">
        <div class="tf-loader-core">
          <span class="tf-loader-ray">⚡</span>
        </div>
      </div>
      <div class="tf-loader-text">Cargando diagrama…</div>
      <div class="tf-loader-subtext">Esto puede tardar unos segundos</div>
    </div>
  </div>
  <script>
    (function () {
      function initTecniFluxLoader() {
        var iframe = document.getElementById("pdf-frame");
        var overlay = document.getElementById("tf-loader-overlay");
        var viewerRoot = document.getElementById("tf-viewer-root");
        
        if (viewerRoot) {
          viewerRoot.classList.add("tf-viewer-mounted");
        }
        
        if (!iframe || !overlay) return;
        var hasHidden = false;
        function hideLoader() {
          if (hasHidden) return;
          hasHidden = true;
          overlay.classList.add("tf-loader-hidden");
          if (viewerRoot) {
            viewerRoot.classList.add("tf-viewer-ready");
          }
          setTimeout(function () {
            if (overlay && overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, 600);
        }
        iframe.addEventListener("load", function () {
          hideLoader();
          // Notify parent window that PDF loaded
          if (window.parent && window.parent !== window) {
            try {
              window.parent.postMessage({
                type: "PDF_LOADED",
                diagramId: "${diagramId}",
                timestamp: new Date().toISOString()
              }, "*");
            } catch (e) {
              // Cross-origin or other error, ignore
            }
          }
        });
        setTimeout(hideLoader, 12000);
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initTecniFluxLoader);
      } else {
        initTecniFluxLoader();
      }
    })();
  </script>
</body>
</html>
`;
}
