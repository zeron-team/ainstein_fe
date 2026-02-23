// src/pages/Welcome.tsx
import React from "react";
import {
    FaRocket,
    FaBrain,
    FaChartLine,
    FaPalette,
    FaShieldAlt,
    FaLightbulb,
    FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "./welcome.css";

const Welcome: React.FC = () => {
    return (
        <div className="welcome-page">
            {/* Hero Section */}
            <section className="welcome-hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <FaRocket className="badge-icon" />
                        <span>NUEVA VERSIÓN</span>
                    </div>

                    <h1 className="hero-title">
                        Bienvenido a <span className="gradient-text">EPC Builder 2.0</span>
                    </h1>

                    <p className="hero-description">
                        Una actualización mayor que transforma la experiencia clínica con
                        inteligencia artificial avanzada, aprendizaje continuo y un nuevo
                        diseño premium.
                    </p>

                    <div className="hero-actions">
                        <Link to="/dashboard" className="hero-btn hero-btn-primary">
                            <span>Ir al Dashboard</span>
                            <FaArrowRight />
                        </Link>
                        <Link to="/patients" className="hero-btn hero-btn-secondary">
                            Ver Pacientes
                        </Link>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="version-badge">v2.0.0</div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="welcome-features">
                <h2 className="features-title">Novedades de esta versión</h2>

                <div className="features-grid">
                    <article className="feature-card">
                        <div className="feature-icon feature-icon--brain">
                            <FaBrain />
                        </div>
                        <h3>Sistema de Aprendizaje Continuo</h3>
                        <p>
                            La IA ahora aprende de cada feedback médico. Las reglas generadas
                            se almacenan y aplican automáticamente para mejorar futuras Epicrisis,
                            adaptándose al estilo de cada profesional.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon feature-icon--chart">
                            <FaChartLine />
                        </div>
                        <h3>Dashboard de Feedback Avanzado</h3>
                        <p>
                            Visualización de estadísticas en tiempo real, análisis por sección
                            y detección automática de patrones problemáticos con KPIs actualizados
                            directamente desde la base de datos.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon feature-icon--palette">
                            <FaPalette />
                        </div>
                        <h3>Nuevo Look & Feel Premium</h3>
                        <p>
                            Interfaz completamente rediseñada con animaciones fluidas, modales
                            informativos, iconos interactivos y una experiencia más intuitiva
                            y profesional.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon feature-icon--shield">
                            <FaShieldAlt />
                        </div>
                        <h3>Persistencia de Datos Mejorada</h3>
                        <p>
                            Las reglas y problemas detectados ahora se almacenan permanentemente
                            en MongoDB. No se pierden al reiniciar el sistema y están disponibles
                            para análisis histórico.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon feature-icon--lightbulb">
                            <FaLightbulb />
                        </div>
                        <h3>Iconos de Información Interactivos</h3>
                        <p>
                            Nuevos tooltips y modales que explican cada métrica y funcionalidad
                            al hacer clic, facilitando la comprensión del sistema para todos
                            los usuarios.
                        </p>
                    </article>

                    <article className="feature-card feature-card--highlight">
                        <div className="feature-icon feature-icon--rocket">
                            <FaRocket />
                        </div>
                        <h3>Y mucho más...</h3>
                        <p>
                            Correcciones de bugs, mejoras de rendimiento, integración mejorada
                            con HCE y optimizaciones en la generación de Epicrisis con IA.
                        </p>
                    </article>
                </div>
            </section>
        </div>
    );
};

export default Welcome;
