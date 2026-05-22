# PROJECT BLUEPRINT: IBBS Platform

## 1. Vision & Purpose
IBBS (Incident Back-office & Billing System) is a centralized monitoring and management platform designed for SOC (Security Operations Center) environments. It enables real-time incident registration, tracking, and visualization for both general entities (Schools, Police Stations, Hospitals) and specific network nodes.

## 2. Strategic Objectives
- **Centralization**: Consolidate incident reporting from multiple regions into a single source of truth.
- **Efficiency**: Reduce response times through a streamlined, multi-step registration process.
- **Visualization**: Provide actionable insights through real-time dashboards and region-based analytics.
- **Internationalization**: Support bilingual operations (Spanish/English) to accommodate diverse operational teams.

## 3. Core Modules
- **Entidades (Entities)**: Management of public service points (IE, Comisarías, Hospitales).
- **SOC Nodos (SOC Nodes)**: Technical incident management for critical infrastructure.
- **Biblioteca (Library)**: A centralized repository of links and resources for SOC operators.
- **Dashboard**: Real-time KPI monitoring (Tickets by Region, Entity Distribution).

## 4. Success Criteria
- **Zero Data Loss**: Guaranteed persistence through Supabase backend.
- **High Availability**: Fast load times and responsive design across desktop and mobile.
- **Data Traceability**: Detailed audit trail for every incident created, edited, or resolved.

## 5. Stakeholders
- **SOC Operators**: Primary users responsible for data entry and monitoring.
- **Administrators**: Responsible for data export, incident deletion, and configuration.
- **Managers**: Strategic users focused on Dashboard trends and reports.
