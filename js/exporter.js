/**
 * exporter.js
 * Utilidad global para la exportación de tablas a Excel con estilos (xlsx-js-style).
 */

const Exporter = (() => {
  /**
   * Genera un archivo Excel (.xlsx) estilizado a partir de un arreglo de objetos.
   *
   * @param {string} sheetName Nombre de la hoja (p. ej. "Entidades" o "SOC Nodos").
   * @param {Array<Object>} data Arreglo de objetos donde las keys son las cabeceras.
   * @param {string} filename Nombre sugerido del archivo.
   */
  function downloadExcel(sheetName, data, filename) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);

    // 1. Preparar las filas (arreglo de arreglos para SheetJS)
    const rows = [];

    // Fila 1: Título principal
    const mainTitle = ['REPORTE DE IBBS - SOC'];
    rows.push(mainTitle);

    // Fila 2: Subtítulo con fecha y recuento
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const subTitle = [`Generado el: ${dateStr} ${timeStr}  |  Total de registros: ${data.length}`];
    rows.push(subTitle);

    // Fila 3: Espacio en blanco
    rows.push([]);

    // Fila 4: Cabeceras de columnas
    rows.push(headers);

    // Filas de datos
    data.forEach(item => {
      const rowData = headers.map(h => {
        let val = item[h];
        if (val === undefined || val === null || val === '') {
          return '-';
        }
        return val;
      });
      rows.push(rowData);
    });

    // 2. Crear Worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // 3. Fusionar Título (Fila 1, desde Columna A hasta la última columna)
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });
    
    // Fusionar Subtítulo (Fila 2)
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } });

    // 4. Calcular el ancho de las columnas (Auto-fit)
    const colWidths = headers.map(() => 10); // Ancho mínimo

    for (let R = 3; R < rows.length; ++R) { // Empezar desde la cabecera
      for (let C = 0; C < headers.length; ++C) {
        let cellValue = rows[R][C];
        if (cellValue === null || cellValue === undefined) continue;
        
        // Convertir a string para medir longitud
        let valStr = cellValue.toString();
        
        // Limitar ancho máximo a 50 para que descripciones muy largas no rompan la hoja
        let length = valStr.length;
        if (length > 60) length = 60;
        
        if (length > colWidths[C]) {
          colWidths[C] = length;
        }
      }
    }
    
    // Añadir un poco de padding al ancho final
    ws['!cols'] = colWidths.map(w => ({ wch: w + 2 }));

    // 5. Aplicar Estilos Celda por Celda
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Función auxiliar para bordes
    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    };

    // Paleta de colores únicos (tonos pastel) para las 25 Regiones de Perú
    const regionColors = {
      "AMAZONAS": "D9EAD3", 
      "ANCASH": "CFE2F3",   
      "APURIMAC": "FCE5CD", 
      "AREQUIPA": "F4CCCC", 
      "AYACUCHO": "FFF2CC", 
      "CAJAMARCA": "D0E0E3",
      "CALLAO": "EAD1DC",
      "CUSCO": "D9D2E9",
      "HUANCAVELICA": "E6B8AF",
      "HUANUCO": "F9CB9C",
      "ICA": "FFE599",
      "JUNIN": "B6D7A8",
      "LA LIBERTAD": "A2C4C9",
      "LAMBAYEQUE": "9FC5E8",
      "LIMA": "B4A7D6",
      "LORETO": "D5A6BD",
      "MADRE DE DIOS": "FAD0C3",
      "MOQUEGUA": "F3E0B5",
      "PASCO": "C3D9A5",
      "PIURA": "A5D9D2",
      "PUNO": "A5A9D9",
      "SAN MARTIN": "D9A5C3", // Color único para evitar repetir tonos azules
      "TACNA": "D9C3A5",
      "TUMBES": "A5D9A9",
      "UCAYALI": "E5B8B8"
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        
        if (!ws[cellRef]) continue; // Celda vacía sin datos
        
        // Inicializar objeto de estilo si no existe
        if (!ws[cellRef].s) ws[cellRef].s = {};
        
        const cellValue = ws[cellRef].v;

        // Fila 1: Título principal
        if (R === 0) {
          ws[cellRef].s = {
            font: { bold: true, sz: 16, color: { rgb: "0f2147" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        // Fila 2: Subtítulo
        else if (R === 1) {
          ws[cellRef].s = {
            font: { italic: true, sz: 11, color: { rgb: "555555" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
        // Fila 4: Cabeceras de tabla (R=3 en índice 0)
        else if (R === 3) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "E5E7EB" } }, // Gris claro
            alignment: { horizontal: "center", vertical: "center" },
            border: borderStyle
          };
        }
        // Filas de Datos (R >= 4)
        else if (R >= 4) {
          
          let alignObj = { horizontal: "left", vertical: "center", wrapText: true };
          let fillObj = null;
          let fontObj = { sz: 11 };

          // Centrar columnas que suelen ser fechas/números/estados.
          // Basado en el nombre de la cabecera (fila 3)
          const headerName = headers[C];
          if (
            headerName.includes("Fecha") || 
            headerName.includes("Hora") || 
            headerName.includes("DNI") || 
            headerName.includes("Celular") ||
            headerName === "Estado" ||
            headerName === "¿Generó CC?" ||
            headerName === "¿Hay Grabación?"
          ) {
            alignObj.horizontal = "center";
          }

          // Por defecto, aplicar el color de la Región a toda la fila de datos
          const rowDataObj = data[R - 4];
          const rowRegion = rowDataObj ? rowDataObj['Región'] : null;
          
          if (rowRegion && regionColors[rowRegion]) {
            fillObj = { fgColor: { rgb: regionColors[rowRegion] } };
          }

          // Celdas de colores dinámicos (Sobreescribe si es la columna "Estado")
          if (headerName === "Estado") {
            fontObj.bold = true;
            if (cellValue === "Pendiente") {
              fillObj = { fgColor: { rgb: "FFEDD5" } }; // bg-orange-100
              fontObj.color = { rgb: "C2410C" }; // text-orange-700
            } else if (cellValue === "Confirmado") {
              fillObj = { fgColor: { rgb: "DCFCE7" } }; // bg-green-100
              fontObj.color = { rgb: "15803D" }; // text-green-700
            }
          }

          // Asignar los estilos construidos
          ws[cellRef].s = {
            alignment: alignObj,
            border: borderStyle,
            font: fontObj
          };
          if (fillObj) {
            ws[cellRef].s.fill = fillObj;
          }
        }
      }
    }

    // 6. Construir el libro web y forzar descarga
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte de Incidencias");
    
    // Evitar que el título sea sobreescrito por la librería al descargar
    // xlsx-js-style respeta el `s` obj en writeFile.
    XLSX.writeFile(wb, filename);
  }

  return { downloadExcel };
})();
