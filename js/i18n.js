/**
 * i18n.js – Sistema de Internacionalización para IBBS
 */

const I18n = (() => {
    const _translations = {
        es: {
            // General
            "APP_TITLE": "IBBS - Gestión de incidencias",
            "LOGIN_WELCOME": "Bienvenido",
            "LOGIN_SUBTITLE": "Inicia sesión con tus credenciales seguras",
            "LOGIN_DESC": "Sistema centralizado de registro, monitoreo y seguimiento de incidencias. Accede de forma segura a todas tus herramientas.",
            "LOGIN_ENTITIES_TITLE": "Entidades",
            "LOGIN_ENTITIES_DESC": "Creación y gestión de registros de Entidades.",
            "LOGIN_SOC_TITLE": "SOC Nodos",
            "LOGIN_SOC_DESC": "Monitoreo y emisión de tickets SOC.",
            "LOGIN_LIB_TITLE": "Biblioteca",
            "LOGIN_LIB_DESC": "Repositorio de enlaces y recursos SOC.",
            "LABEL_EMAIL": "Dirección de Correo",
            "LABEL_PASSWORD": "Contraseña",
            "BTN_LOGIN": "Ingresar a la Plataforma",
            "FOOTER_TEXT": "© 2026 IBBS - Gestión de Incidencias • Uso exclusivo corporativo",
            
            // Sidebar Navigation
            "NAV_DASHBOARD": "Dashboard",
            "NAV_ENTITIES": "ENTIDADES",
            "NAV_CREATE_REG": "Creación de Registro",
            "NAV_REGISTRY": "Registro",
            "NAV_TICKETS": "Registros",
            "NAV_SOC_NODES": "SOC NODOS",
            "NAV_SOC_LINKS": "ENLACES SOC",
            "NAV_LIBRARY": "Biblioteca",
            "NAV_THEME": "Alternar Tema",
            "NAV_LOGOUT": "Cerrar Sesión",
            "USER_OPERATOR": "Operador",
            
            // Dashboard
            "DB_TITLE": "DASHBOARD",
            "DB_SUBTITLE": "MONITOREO EN TIEMPO REAL",
            "DB_START": "F. Inicio:",
            "DB_END": "F. Término:",
            "DB_REGION": "Región:",
            "DB_QUERY": "consulta",
            "DB_TODAY": "hoy",
            "DB_7D": "los últimos 7 días",
            "DB_15D": "los últimos 15 días",
            "DB_30D": "los últimos 30 días",
            "DB_CHART_REGION": "Reportes por Región",
            "DB_CHART_ENTITY": "Distribución por ENTIDAD",
            "DB_LATEST": "Últimos Reportes",
            "DB_LIVE": "EN VIVO",
            
            // Tab 1: Creación de Registro
            "T1_TITLE": "Creación de Registro",
            "T1_SUBTITLE": "Completa los datos del solicitante y la ubicación de la entidad afectada.",
            "T1_CARD_SOLICITANT": "Datos del Solicitante",
            "T1_CARD_CONTACT": "Información de contacto",
            "T1_LABEL_NAME": "Nombre y Apellido",
            "T1_LABEL_DNI": "Número de DNI",
            "T1_LABEL_PHONE": "Número de Celular",
            "T1_LABEL_EMAIL": "Correo Electrónico",
            "T1_LABEL_DATE": "Fecha y Hora del Incidente",
            "T1_LABEL_DESC": "Descripción",
            "T1_BTN_GENERATE": "Generar mi registro",
            "T1_CARD_LOCATION": "Ubicación y Entidad",
            "T1_CARD_CASCADE": "Selectores dependientes en cascada",
            "T1_LABEL_REGION": "Región",
            "T1_LABEL_PROVINCE": "Provincia",
            "T1_LABEL_LOCALITY": "Localidad",
            "T1_LABEL_ENTITY": "Entidad",
            "T1_BTN_FINISH": "Finalizar mi registro",
            "T1_DIVIDER_FINAL": "Paso final",
            "T1_DIVIDER_FINAL": "Paso final",
            "OPTIONAL": "(opcional)",
            "REQUIRED": "*",
            "PH_NAME": "Ej. Juan Pérez García",
            "PH_DNI": "12345678",
            "PH_PHONE": "9XXXXXXXX",
            "PH_EMAIL": "correo@dominio.com",
            "PH_DESC": "Información adicional sobre el incidente...",
            "PH_SELECT_REGION": "-- Seleccione Región --",
            "PH_SELECT_PROVINCE": "-- Seleccione Provincia --",
            "PH_SELECT_LOCALITY": "-- Seleccione Localidad --",
            "PH_SELECT_TYPE": "-- Seleccione Tipo --",
            "PH_SELECT_ENTITY": "-- Seleccione Entidad --",
            "PH_CC": "Ej. 123456",
            "PH_TT": "Ej. 789012",
            
            // Tab 2: Registro
            "T2_TITLE": "Registro — Entidades",
            "T2_SUBTITLE": "Visualiza y gestiona los tickets de incidencias de entidades.",
            "T2_BTN_EXPORT": "Exportar Excel",
            "T2_LABEL_SORT": "Ordenar:",
            "T2_SORT_RECENT": "Más reciente",
            "T2_SORT_OLD": "Más antiguo",
            "T2_LABEL_STATUS": "Estado:",
            "T2_STATUS_ALL": "Todos",
            "T2_STATUS_PENDING": "Pendiente",
            "T2_STATUS_RESOLVED": "Resuelto",
            "T2_LABEL_REGION": "Región:",
            "T2_ALL_REGIONS": "Todas las regiones",
            "T2_LABEL_DATE": "Fecha:",
            "T2_PAG_PREV": "Anterior",
            "T2_PAG_NEXT": "Siguiente",
            "T2_PAG_PAGE": "Página",
            "T2_PAG_OF": "de",
            
            // Tab 6: Tickets
            "T6_TITLE": "Tickets — Entidades",
            "T6_SUBTITLE": "Seguimiento detallado usando números de Complaint Center y Trouble Ticket.",
            "T6_EMPTY_TICKETS": "No hay tickets registrados",
            "T6_EMPTY_SUB": "Los tickets de entidades aparecerán aquí para seguimiento avanzado.",
            "T6_PAGING_SHOWING": "Mostrando del",
            "T6_PAGING_TO": "al",
            "T6_PAGING_OF": "de",
            "T6_PAGING_RESULTS": "resultados",
            "DB_TOTAL_RECORDS": "Total registros",
            "BTN_SEARCH": "🔍 Buscar",
            "T6_KPI_OPEN": "Abiertos",
            "T6_KPI_PROGRESS": "En curso",
            "T6_KPI_CLOSED": "Cerrados",
            "T6_PH_SEARCH": "Buscar entidad, CC, TT...",
            "T6_BTN_SEARCH": "🔍 Buscar",
            "T6_COL_START_TIME": "Tiempo de inicio",
            "T6_COL_LLAMADA_ENTIDAD": "Contacto",
            "T6_COL_VISITA_PREVISTA": "Visita",
            "T6_COL_TEAM_REG": "Registra",
            "T6_COL_TEAM_RES": "Por resolver",
            "T6_COL_CLOSE_TIME": "Tiempo de fin",
            "T6_COL_DURATION": "Duración incidencia",
            "ROLE_ADMIN": "Administrador",
            "USER_DEFAULT": "Usuario",
            "BTN_FINISH_PROCESS": "✔ Finalizar Proceso",
            "BTN_EDIT": "✏ Editar",
            "MSG_ADMIN_EDIT_ONLY": "Solo administrador puede editar los tickets.",
            
            // Tab 3: Creación de Registro SOC
            "T3_TITLE": "Creación de Registro — SOC Nodo",
            "T3_SUBTITLE": "Selecciona el nodo afectado y registra los detalles del incidente.",
            "T3_CARD_NODE": "Datos del Nodo",
            "T3_CARD_CASCADE": "Selectores AX / TX en cascada",
            "T3_LABEL_NODE_TYPE": "Tipo de Nodo",
            "T3_LABEL_CODE": "Código",
            "T3_LABEL_NODE_NAME": "Nombre del Nodo",
            "T3_PH_NODE_NAME": "Se autocompletará al seleccionar el código",
            "T3_CARD_INCIDENT": "Datos del Incidente",
            "T3_CARD_DETAILS": "Detalles y características del evento",
            "T3_LABEL_DATE_INC": "Fecha y Hora del Incidente",
            "T3_LABEL_DATE_REP": "Fecha y Hora del Reporte",
            "T3_LABEL_DETECTED": "Detectado por",
            "T3_BTN_TECH": "Técnico",
            "T3_BTN_SOC": "SOC",
            "T3_LABEL_RECORDING": "¿Hay Grabación?",
            "T3_BTN_YES": "Sí",
            "T3_BTN_NO": "No",
            "T3_LABEL_INCIDENT_TYPE": "Tipo de Incidente",
            "T3_TYPE_DOOR": "Alarma de puerta",
            "T3_TYPE_SHELTER": "Alarma de shelter",
            "T3_TYPE_EQUIPMENT": "Equipo averiado",
            "T3_TYPE_CAMERA": "Cámara sin gestión",
            "T3_TYPE_THEFT": "Robo",
            "T3_BTN_GENERATE": "Generar mi registro",
            
            // Tab 4: Registro SOC
            "T4_TITLE": "Registro — SOC Nodos",
            "T4_SUBTITLE": "Visualiza y gestiona los tickets de incidencias de nodos SOC.",
            "T4_EMPTY": "No hay registros SOC",
            "T4_EMPTY_SUB": "Los registros creados en SOC Nodos → Creación de Registro aparecerán aquí.",
            
            // Tab 5: Biblioteca
            "T5_TITLE": "Biblioteca — Enlaces SOC",
            "T5_SUBTITLE": "Bloque editable de enlaces y recursos del SOC.",
            "T5_BTN_ADD": "+ Agregar información",
            "T5_MODAL_TITLE": "🔗 Agregar información",
            "T5_LABEL_TITLE": "Título",
            "T5_PH_TITLE": "Nombre del enlace o recurso",
            "T5_PH_DESC": "Descripción del recurso. Los enlaces (https://…) se volverán clicables automáticamente.",
            
            // Ticket Details & Status
            "STATUS_PENDING": "Pendiente",
            "STATUS_RESOLVED": "Confirmado",
            "DETAIL_NAME": "Nombre Completo",
            "DETAIL_DNI": "DNI",
            "DETAIL_PHONE": "Celular",
            "DETAIL_EMAIL": "Correo",
            "DETAIL_DATE": "Fecha Incidente",
            "DETAIL_REGION": "Región",
            "DETAIL_PROVINCE": "Provincia",
            "DETAIL_LOCALITY": "Localidad",
            "DETAIL_TYPE": "Tipo",
            "DETAIL_ENTITY": "Entidad",
            "DETAIL_DESC": "Descripción",
            "DETAIL_EMPTY_DESC": "Sin descripción",
            "DETAIL_ADMIN_ONLY": "Solo los administradores pueden editar o eliminar.",
            "BTN_EDIT_DESC": "✏️ Editar Descripción",
            "BTN_DELETE": "🗑 Eliminar",
            "CONFIRM_DELETE": "¿Confirmar eliminación?",
            "BTN_YES_DELETE": "Sí, eliminar",
            "BTN_CANCEL": "Cancelar",
            "BTN_SAVE": "💾 Guardar",
            
            // KPIs
            "KPI_TOTAL": "TOTAL REPORTES",
            "KPI_CONFIRMED": "CONFIRMADOS",
            
            // Entity Types
            "TYPE_IE": "Institución Educativa",
            "TYPE_COMISARIA": "Comisaría",
            "TYPE_HOSPITAL": "Hospital",
            "TYPE_CAD": "CAD Tipo B",
            "TYPE_PLAZA": "Plaza",
            "TYPE_OTHER": "Otros",
            
            // Table Columns
            "COL_DATE": "FECHA",
            "COL_REGION": "REGIÓN",
            "COL_PROVINCE": "PROVINCIA",
            "COL_LOCALITY": "LOCALIDAD",
            "COL_ENTITY": "ENTIDAD",
            "COL_NAME": "NOMBRE",
            "COL_DNI": "DNI",
            "COL_TYPE": "TIPO",
            "COL_STATUS": "ESTADO",
            
            "DATA_READY": "Datos listos",
            "ALL_TYPES": "Todos los tipos",
            
            // Messages
            "MSG_SELECT_FIELDS": "Selecciona Región, Tipo de Nodo y Código.",
            "MSG_NODE_SAVED": "Datos del nodo guardados. Completa los datos de incidencia y finaliza.",
            "MSG_GENERATE_FIRST": "Primero genera tu registro con los datos del nodo.",
            "MSG_SELECT_INCIDENT": "Selecciona al menos un tipo de incidente.",
            "MSG_SOC_SAVED": "Registro SOC finalizado ✔",
            "MSG_EXPORT_EMPTY": "No hay tickets para exportar.",
            "MSG_EXPORT_SUCCESS": "Excel exportado exitosamente. ✔",
            "MSG_DELETE_SUCCESS": "Ticket eliminado.",
            
            // Additional Placeholders
            "PH_SELECT_TYPE": "-- Seleccione Tipo de Nodo --",
            "PH_SELECT_CODE": "-- Seleccione Código --",

            // Admin Panel
            "NAV_ADMIN": "ADMINISTRACIÓN",
            "NAV_ADMIN_REQUESTS": "Usuarios",
            "ADMIN_TITLE": "Solicitudes de Acceso",
            "ADMIN_SUBTITLE": "Gestiona las solicitudes de registro de nuevos usuarios al sistema.",
            "ADMIN_PENDING": "Pendientes",
            "ADMIN_APPROVE": "✅ Aprobar",
            "ADMIN_REJECT": "❌ Rechazar",
            "ADMIN_EMPTY": "Sin solicitudes pendientes",
            "ADMIN_EMPTY_SUB": "Cuando alguien solicite acceso, aparecerá aquí.",
            "ADMIN_STATUS_PENDING": "⏳ Pendiente",
            "ADMIN_STATUS_APPROVED": "✅ Aprobada",
            "ADMIN_STATUS_SUSPENDED": "🚫 Suspendida",
            "ADMIN_STATUS_REJECTED": "❌ Rechazada",
            "ADMIN_REQUESTED_AT": "Registrado el",
            "ADMIN_ROLE_USER": "Usuario (Lectura)",
            "ADMIN_ROLE_EDITOR": "Editor (Estándar)",
            "ADMIN_ROLE_ADMIN": "Administrador",
            "ADMIN_ACTIVE_ADMIN": "Admin Activo",
            "ADMIN_YOU": "Tú",
            "ADMIN_BTN_DISABLE": "🚫 Deshabilitar",
            "ADMIN_BTN_ENABLE": "✅ Habilitar",
            "ADMIN_BTN_DELETE": "🗑️ Eliminar",
            "ADMIN_CONFIRM_DELETE": "¿Confirmar eliminación?",
            "ADMIN_CONFIRM_REJECT": "¿Confirmar rechazo?",
            "ADMIN_CONFIRM_YES_DELETE": "Sí, eliminar",
            "ADMIN_CONFIRM_YES_REJECT": "Sí, rechazar",
            "ADMIN_CONFIRM_CANCEL": "Cancelar",

            // Login - Request Access
            "LOGIN_REQUEST_ACCESS": "¿No tienes cuenta? Solicitar acceso",
            "REQUEST_TITLE": "Solicitar Acceso",
            "REQUEST_SUBTITLE": "El administrador revisará tu solicitud.",
            "REQUEST_NAME": "Nombre y Apellido",
            "REQUEST_EMAIL": "Correo Electrónico",
            "REQUEST_PASSWORD": "Contraseña",
            "REQUEST_BTN": "Enviar Solicitud",
            "REQUEST_BACK": "← Volver al inicio de sesión",
            "REQUEST_SUCCESS": "✅ Solicitud enviada. El administrador revisará tu acceso pronto.",
            "REQUEST_ERROR_DUP": "Ya existe una solicitud con ese correo.",
            "REQUEST_ERROR_GENERIC": "Error al enviar solicitud. Intenta de nuevo.",
            "REQUEST_PH_NAME": "Nombres y apellidos",
            "REQUEST_PH_EMAIL": "usuario@dominio.com",
            "REQUEST_PH_PASSWORD": "••••••••"
        },
        en: {
            // General
            "APP_TITLE": "IBBS - Incident Management",
            "LOGIN_WELCOME": "Welcome",
            "LOGIN_SUBTITLE": "Sign in with your secure credentials",
            "LOGIN_DESC": "Centralized system for recording, monitoring, and tracking incidents. Access all your tools securely.",
            "LOGIN_ENTITIES_TITLE": "Entities",
            "LOGIN_ENTITIES_DESC": "Creation and management of Entity records.",
            "LOGIN_SOC_TITLE": "SOC Nodes",
            "LOGIN_SOC_DESC": "Monitoring and issuance of SOC tickets.",
            "LOGIN_LIB_TITLE": "Library",
            "LOGIN_LIB_DESC": "Repository of SOC links and resources.",
            "LABEL_EMAIL": "Email Address",
            "LABEL_PASSWORD": "Password",
            "BTN_LOGIN": "Enter the Platform",
            "FOOTER_TEXT": "© 2026 IBBS - Incident Management • Corporate Use Only",
            
            // Sidebar Navigation
            "NAV_DASHBOARD": "Dashboard",
            "NAV_ENTITIES": "ENTITIES",
            "NAV_CREATE_REG": "Create Record",
            "NAV_REGISTRY": "Registry",
            "NAV_TICKETS": "Records",
            "NAV_SOC_NODES": "SOC NODES",
            "NAV_SOC_LINKS": "SOC LINKS",
            "NAV_LIBRARY": "Library",
            "NAV_THEME": "Toggle Theme",
            "NAV_LOGOUT": "Sign Out",
            "USER_OPERATOR": "Operator",
            
            // Tab 3: SOC Record Creation
            "T3_TITLE": "Record Creation — SOC Node",
            "T3_SUBTITLE": "Select the affected node and record the incident details.",
            "T3_CARD_NODE": "Node Data",
            "T3_CARD_CASCADE": "AX / TX Cascading Selectors",
            "T3_LABEL_NODE_TYPE": "Node Type",
            "T3_LABEL_CODE": "Code",
            "T3_LABEL_NODE_NAME": "Node Name",
            "T3_PH_NODE_NAME": "Will autocomplete upon selecting code",
            "T3_CARD_INCIDENT": "Incident Data",
            "T3_CARD_DETAILS": "Event details and characteristics",
            "T3_LABEL_DATE_INC": "Incident Date & Time",
            "T3_LABEL_DATE_REP": "Report Date & Time",
            "T3_LABEL_DETECTED": "Detected by",
            "T3_BTN_TECH": "Technician",
            "T3_BTN_SOC": "SOC",
            "T3_LABEL_RECORDING": "Recording available?",
            "T3_BTN_YES": "Yes",
            "T3_BTN_NO": "No",
            "T3_LABEL_INCIDENT_TYPE": "Incident Type",
            "T3_TYPE_DOOR": "Door alarm",
            "T3_TYPE_SHELTER": "Shelter alarm",
            "T3_TYPE_EQUIPMENT": "Faulty equipment",
            "T3_TYPE_CAMERA": "Unmanaged camera",
            "T3_TYPE_THEFT": "Theft",
            "T3_BTN_GENERATE": "Generate my record",
            
            // Tab 4: SOC Registry
            "T4_TITLE": "Registry — SOC Nodes",
            "T4_SUBTITLE": "View and manage SOC node incident tickets.",
            "T4_EMPTY": "No SOC records found",
            "T4_EMPTY_SUB": "Records created in SOC Nodes → Record Creation will appear here.",
            
            // Tab 5: Library
            "T5_TITLE": "Library — SOC Links",
            "T5_SUBTITLE": "Editable block for SOC links and resources.",
            "T5_BTN_ADD": "+ Add information",
            "T5_MODAL_TITLE": "🔗 Add information",
            "T5_LABEL_TITLE": "Title",
            "T5_PH_TITLE": "Name of the link or resource",
            "T5_PH_DESC": "Resource description. Links (https://…) will become clickable automatically.",
            
            // Dashboard
            "DB_TITLE": "DASHBOARD",
            "DB_SUBTITLE": "REAL-TIME MONITORING",
            "DB_START": "Start Date:",
            "DB_END": "End Date:",
            "DB_REGION": "Region:",
            "DB_QUERY": "query",
            "DB_TODAY": "today",
            "DB_7D": "last 7 days",
            "DB_15D": "last 15 days",
            "DB_30D": "last 30 days",
            "DB_CHART_REGION": "Reports by Region",
            "DB_CHART_ENTITY": "Distribution by ENTITY",
            "DB_LATEST": "Latest Reports",
            "DB_LIVE": "LIVE",
            
            // Tab 1: Creación de Registro
            "T1_TITLE": "Create Record",
            "T1_SUBTITLE": "Complete the applicant's data and the location of the affected entity.",
            "T1_CARD_SOLICITANT": "Applicant Data",
            "T1_CARD_CONTACT": "Contact Information",
            "T1_LABEL_NAME": "Full Name",
            "T1_LABEL_DNI": "DNI Number",
            "T1_LABEL_PHONE": "Cell Phone Number",
            "T1_LABEL_EMAIL": "Email Address",
            "T1_LABEL_DATE": "Incident Date & Time",
            "T1_LABEL_DESC": "Description",
            "T1_BTN_GENERATE": "Generate my record",
            "T1_CARD_LOCATION": "Location & Entity",
            "T1_CARD_CASCADE": "Cascading dependent selectors",
            "T1_LABEL_REGION": "Region",
            "T1_LABEL_PROVINCE": "Province",
            "T1_LABEL_LOCALITY": "Locality",
            "T1_LABEL_TYPE": "Type",
            "T1_LABEL_ENTITY": "Entity",
            "T1_BTN_FINISH": "Finish my record",
            "T1_DIVIDER_FINAL": "Final step",
            "OPTIONAL": "(optional)",
            "REQUIRED": "*",
            "PH_NAME": "E.g. John Doe",
            "PH_DNI": "12345678",
            "PH_PHONE": "9XXXXXXXX",
            "PH_EMAIL": "email@domain.com",
            "PH_DESC": "Additional info about the incident...",
            "PH_SELECT_REGION": "-- Select Region --",
            "PH_SELECT_PROVINCE": "-- Select Province --",
            "PH_SELECT_LOCALITY": "-- Select Locality --",
            "PH_SELECT_TYPE": "-- Select Type --",
            "PH_SELECT_ENTITY": "-- Select Entity --",
            "PH_CC": "E.g. 123456",
            "PH_TT": "E.g. 789012",
            
            // Tab 2: Registro
            "T2_TITLE": "Registry — Entities",
            "T2_SUBTITLE": "View and manage entity incident tickets.",
            "T2_BTN_EXPORT": "Export Excel",
            "T2_LABEL_SORT": "Sort by:",
            "T2_SORT_RECENT": "Most recent",
            "T2_SORT_OLD": "Oldest",
            "T2_LABEL_STATUS": "Status:",
            "T2_STATUS_ALL": "All",
            "T2_STATUS_PENDING": "Pending",
            "T2_STATUS_RESOLVED": "Resolved",
            "T2_LABEL_REGION": "Region:",
            "T2_ALL_REGIONS": "All regions",
            "T2_LABEL_DATE": "Date:",
            "T2_PAG_PREV": "Previous",
            "T2_PAG_NEXT": "Next",
            "T2_PAG_PAGE": "Page",
            "T2_PAG_OF": "of",
            
            // Tab 6: Tickets
            "T6_TITLE": "Tickets — Entities",
            "T6_SUBTITLE": "Detailed tracking using Complaint Center and Trouble Ticket numbers.",
            "T6_EMPTY_TICKETS": "No tickets registered",
            "T6_EMPTY_SUB": "Entity tickets will appear here for advanced tracking.",
            "T6_PAGING_SHOWING": "Showing",
            "T6_PAGING_TO": "to",
            "T6_PAGING_OF": "of",
            "T6_PAGING_RESULTS": "results",
            "DB_TOTAL_RECORDS": "Total records",
            "BTN_SEARCH": "🔍 Search",
            "T6_KPI_OPEN": "Open",
            "T6_KPI_PROGRESS": "In progress",
            "T6_KPI_CLOSED": "Closed",
            "T6_PH_SEARCH": "Search entity, CC, TT...",
            "T6_BTN_SEARCH": "🔍 Search",
            "T6_COL_START_TIME": "Start time",
            "T6_COL_LLAMADA_ENTIDAD": "Contact",
            "T6_COL_VISITA_PREVISTA": "Visit",
            "T6_COL_TEAM_REG": "Registers",
            "T6_COL_TEAM_RES": "To resolve",
            "T6_COL_CLOSE_TIME": "End time",
            "T6_COL_DURATION": "Incident duration",
            "ROLE_ADMIN": "Administrator",
            "USER_DEFAULT": "User",
            "BTN_FINISH_PROCESS": "✔ Finish Process",
            "BTN_EDIT": "✏ Edit",
            "MSG_ADMIN_EDIT_ONLY": "Only administrators can edit tickets.",
            
            // Ticket Details & Status
            "STATUS_PENDING": "Pending",
            "STATUS_RESOLVED": "Resolved",
            "DETAIL_NAME": "Full Name",
            "DETAIL_DNI": "DNI",
            "DETAIL_PHONE": "Cell Phone",
            "DETAIL_EMAIL": "Email",
            "DETAIL_DATE": "Incident Date",
            "DETAIL_REGION": "Region",
            "DETAIL_PROVINCE": "Province",
            "DETAIL_LOCALITY": "Locality",
            "DETAIL_TYPE": "Type",
            "DETAIL_ENTITY": "Entity",
            "DETAIL_DESC": "Description",
            "DETAIL_EMPTY_DESC": "No description",
            "DETAIL_ADMIN_ONLY": "Only administrators can edit or delete.",
            "BTN_EDIT_DESC": "✏️ Edit Description",
            "BTN_DELETE": "🗑 Delete",
            "CONFIRM_DELETE": "Confirm deletion?",
            "BTN_YES_DELETE": "Yes, delete",
            "BTN_CANCEL": "Cancel",
            "BTN_SAVE": "💾 Save",
            
            // KPIs
            "KPI_TOTAL": "TOTAL REPORTS",
            "KPI_CONFIRMED": "CONFIRMED",
            
            // Entity Types
            "TYPE_IE": "Educational Institution",
            "TYPE_COMISARIA": "Police Station",
            "TYPE_HOSPITAL": "Hospital",
            "TYPE_CAD": "CAD Type B",
            "TYPE_PLAZA": "Square",
            "TYPE_OTHER": "Others",
            
            // Table Columns
            "COL_DATE": "DATE",
            "COL_REGION": "REGION",
            "COL_TYPE": "TYPE",
            "COL_PROVINCE": "PROVINCE",
            "COL_LOCALITY": "LOCALITY",
            "COL_ENTITY": "ENTITY",
            "COL_NAME": "NAME",
            "COL_DNI": "DNI",
            "COL_STATUS": "STATUS",
            
            "DATA_READY": "Data ready",
            "ALL_TYPES": "All types",
            
            // Messages
            "MSG_SELECT_FIELDS": "Select Region, Node Type, and Code.",
            "MSG_NODE_SAVED": "Node data saved. Complete incident details and finalize.",
            "MSG_GENERATE_FIRST": "First generate your record with node data.",
            "MSG_SELECT_INCIDENT": "Select at least one incident type.",
            "MSG_SOC_SAVED": "SOC registration finalized ✔",
            "MSG_EXPORT_EMPTY": "No tickets to export.",
            "MSG_EXPORT_SUCCESS": "Excel exported successfully. ✔",
            "MSG_DELETE_SUCCESS": "Ticket deleted.",
            
            // Additional Placeholders
            "PH_SELECT_TYPE": "-- Select Node Type --",
            "PH_SELECT_CODE": "-- Select Code --",

            // Admin Panel
            "NAV_ADMIN": "ADMINISTRATION",
            "NAV_ADMIN_REQUESTS": "Users",
            "ADMIN_TITLE": "Access Requests",
            "ADMIN_SUBTITLE": "Manage new user registration requests to the system.",
            "ADMIN_PENDING": "Pending",
            "ADMIN_APPROVE": "✅ Approve",
            "ADMIN_REJECT": "❌ Reject",
            "ADMIN_EMPTY": "No pending requests",
            "ADMIN_EMPTY_SUB": "When someone requests access, it will appear here.",
            "ADMIN_STATUS_PENDING": "⏳ Pending",
            "ADMIN_STATUS_APPROVED": "✅ Approved",
            "ADMIN_STATUS_SUSPENDED": "🚫 Suspended",
            "ADMIN_STATUS_REJECTED": "❌ Rejected",
            "ADMIN_REQUESTED_AT": "Registered on",
            "ADMIN_ROLE_USER": "User (Read)",
            "ADMIN_ROLE_EDITOR": "Editor (Standard)",
            "ADMIN_ROLE_ADMIN": "Administrator",
            "ADMIN_ACTIVE_ADMIN": "Active Admin",
            "ADMIN_YOU": "You",
            "ADMIN_BTN_DISABLE": "🚫 Disable",
            "ADMIN_BTN_ENABLE": "✅ Enable",
            "ADMIN_BTN_DELETE": "🗑️ Delete",
            "ADMIN_CONFIRM_DELETE": "Confirm deletion?",
            "ADMIN_CONFIRM_REJECT": "Confirm rejection?",
            "ADMIN_CONFIRM_YES_DELETE": "Yes, delete",
            "ADMIN_CONFIRM_YES_REJECT": "Yes, reject",
            "ADMIN_CONFIRM_CANCEL": "Cancel",

            // Login - Request Access
            "LOGIN_REQUEST_ACCESS": "No account? Request access",
            "REQUEST_TITLE": "Request Access",
            "REQUEST_SUBTITLE": "The administrator will review your request.",
            "REQUEST_NAME": "Full Name",
            "REQUEST_EMAIL": "Email Address",
            "REQUEST_PASSWORD": "Password",
            "REQUEST_BTN": "Send Request",
            "REQUEST_BACK": "← Back to login",
            "REQUEST_SUCCESS": "✅ Request sent. The administrator will review your access soon.",
            "REQUEST_ERROR_DUP": "A request with that email already exists.",
            "REQUEST_ERROR_GENERIC": "Error sending request. Please try again.",
            "REQUEST_PH_NAME": "First and last name",
            "REQUEST_PH_EMAIL": "user@domain.com",
            "REQUEST_PH_PASSWORD": "••••••••"
        }
    };

    let _currentLang = localStorage.getItem('ibbs_lang') || 'es';

    function init() {
        _applyTranslations();
    }

    function toggleLanguage() {
        _currentLang = (_currentLang === 'es') ? 'en' : 'es';
        localStorage.setItem('ibbs_lang', _currentLang);
        
        // Actualizar el atributo lang del documento para el calendario del navegador
        document.documentElement.lang = _currentLang;
        
        _applyTranslations();
        
        // Dispatch event for other components (like charts) to re-render if needed
        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: _currentLang } }));
    }

    function _applyTranslations() {
        // Asegurar que el atributo lang esté sincronizado en el documento
        document.documentElement.lang = _currentLang;

        // Forzar el idioma en todos los inputs (especialmente los de fecha para el calendario)
        document.querySelectorAll('input').forEach(input => {
            input.setAttribute('lang', _currentLang);
        });

        // Translate text content
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (_translations[_currentLang][key]) {
                if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
                    el.value = _translations[_currentLang][key];
                } else if (el.children.length === 0) {
                    el.textContent = _translations[_currentLang][key];
                } else {
                    const navText = el.querySelector('.nav-text');
                    if (navText) {
                        navText.textContent = _translations[_currentLang][key];
                    } else {
                        const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== "");
                        if (textNode) {
                            textNode.textContent = ` ${_translations[_currentLang][key]}`;
                        }
                    }
                }
            }
        });

        // Translate placeholders
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (_translations[_currentLang][key]) {
                el.placeholder = _translations[_currentLang][key];
            }
        });

        // Update document title
        if (_translations[_currentLang]["APP_TITLE"]) {
            document.title = _translations[_currentLang]["APP_TITLE"];
        }

        // Update UI toggle indicator if exists
        const langIndicator = document.getElementById('lang-indicator');
        if (langIndicator) langIndicator.textContent = _currentLang.toUpperCase();
    }

    function getLang() { return _currentLang; }

    function translate(key) {
        return _translations[_currentLang][key] || key;
    }

    return { init, toggleLanguage, getLang, translate };
})();

// Auto-init when script loads
document.addEventListener('DOMContentLoaded', () => I18n.init());
