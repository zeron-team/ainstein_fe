// src/components/HelpModal.tsx
import { useState } from "react";
import {
    FaQuestionCircle,
    FaTimes,
    FaUsers,
    FaCloudDownloadAlt,
    FaMagic,
    FaThumbsUp,
    FaThumbsDown,
    FaMeh,
    FaChartBar,
    FaHeartbeat,
    FaTachometerAlt,
} from "react-icons/fa";
import "./HelpModal.css";

type Tab = {
    id: string;
    label: string;
    icon: JSX.Element;
    content: JSX.Element;
};

const tabs: Tab[] = [
    {
        id: "menu",
        label: "Menú",
        icon: <FaTachometerAlt />,
        content: (
            <div className="help-content">
                <h3>Navegación del Sistema</h3>
                <p>El sistema está organizado en las siguientes secciones:</p>
                <ul>
                    <li><strong>Dashboard:</strong> Vista general con estadísticas del sistema</li>
                    <li><strong>Pacientes:</strong> Gestión de pacientes, importación de HCE y creación de EPCs</li>
                    <li><strong>Configuración:</strong> Personalización del branding</li>
                    <li><strong>Administración:</strong> Usuarios, feedback IA y estado del sistema (solo admins)</li>
                </ul>
            </div>
        ),
    },
    {
        id: "patients",
        label: "Pacientes",
        icon: <FaUsers />,
        content: (
            <div className="help-content">
                <h3>Gestión de Pacientes</h3>
                <p><strong>Pacientes:</strong> Lista todos los pacientes con sus EPCs.</p>
                <p><strong>Nuevo:</strong> Crear un paciente manualmente.</p>
                <p><strong>WS HCE:</strong> Importar episodios desde el WebService del hospital.</p>

                <h4>Estados del Paciente</h4>
                <ul>
                    <li>🟡 <strong>Pendiente:</strong> Sin HCE ni EPC</li>
                    <li>🔵 <strong>HCE Ingresada:</strong> Tiene HCE pero no EPC</li>
                    <li>🟢 <strong>EPC Generada:</strong> Tiene EPC generada por IA</li>
                    <li>✅ <strong>Validada:</strong> EPC revisada y aprobada</li>
                </ul>
            </div>
        ),
    },
    {
        id: "ws-hce",
        label: "WS HCE",
        icon: <FaCloudDownloadAlt />,
        content: (
            <div className="help-content">
                <h3>WebService HCE (Historia Clínica Electrónica)</h3>
                <p>Permite buscar e importar episodios clínicos desde el sistema del hospital.</p>

                <h4>Pasos:</h4>
                <ol>
                    <li>Completar los filtros de búsqueda (fecha, servicio, etc.)</li>
                    <li>Click en <strong>"Buscar Episodios"</strong></li>
                    <li>Seleccionar el episodio deseado</li>
                    <li>Click en <strong>"Importar"</strong> para traer la HCE al sistema</li>
                </ol>

                <p>Una vez importada la HCE, se crea el paciente y se puede generar la EPC.</p>
            </div>
        ),
    },
    {
        id: "epc-generation",
        label: "Generar EPC",
        icon: <FaMagic />,
        content: (
            <div className="help-content">
                <h3>Generación de EPC con IA</h3>
                <p>El sistema utiliza <strong>Inteligencia Artificial (Gemini 2.0)</strong> para generar Epicrisis automáticamente.</p>

                <h4>Flujo:</h4>
                <ol>
                    <li>Abrir la EPC del paciente desde el listado</li>
                    <li>Click en el botón <strong>"Generar EPC"</strong></li>
                    <li>La IA analiza la HCE y genera las secciones:</li>
                    <ul>
                        <li>Motivo de Internación</li>
                        <li>Evolución</li>
                        <li>Procedimientos</li>
                        <li>Medicación</li>
                        <li>Indicaciones al Alta</li>
                        <li>Recomendaciones</li>
                    </ul>
                    <li>Revisar y editar si es necesario</li>
                    <li>Guardar la EPC</li>
                </ol>
            </div>
        ),
    },
    {
        id: "feedback",
        label: "Valoración EPC",
        icon: <FaThumbsUp />,
        content: (
            <div className="help-content">
                <h3>Sistema de Valoración de EPCs</h3>
                <p>Cada sección generada por la IA puede ser valorada para mejorar futuras generaciones:</p>

                <div className="feedback-icons">
                    <div className="feedback-item">
                        <FaThumbsUp className="icon-ok" />
                        <strong>OK (👍)</strong>
                        <p>La sección está correcta. Se usa para entrenar la IA (few-shot learning).</p>
                    </div>
                    <div className="feedback-item">
                        <FaMeh className="icon-meh" />
                        <strong>A Medias (🤔)</strong>
                        <p>Parcialmente correcto. Requiere ajustes menores.</p>
                    </div>
                    <div className="feedback-item">
                        <FaThumbsDown className="icon-bad" />
                        <strong>Mal (👎)</strong>
                        <p>Incorrecto. Se abre un modal para describir el problema.</p>
                    </div>
                </div>

                <p><em>Tu feedback mejora la IA con cada valoración.</em></p>
            </div>
        ),
    },
    {
        id: "admin",
        label: "Administración",
        icon: <FaChartBar />,
        content: (
            <div className="help-content">
                <h3>Panel de Administración</h3>
                <p>Solo visible para usuarios con rol <strong>admin</strong>.</p>

                <h4>Secciones:</h4>
                <ul>
                    <li>
                        <FaUsers /> <strong>Usuarios:</strong> Gestionar usuarios del sistema (crear, editar, eliminar)
                    </li>
                    <li>
                        <FaChartBar /> <strong>Feedback IA:</strong> Dashboard con estadísticas de valoraciones y sugerencias
                    </li>
                    <li>
                        <FaHeartbeat /> <strong>Estado Sistema:</strong> Healthcheck de todos los servicios (MySQL, MongoDB, Gemini, Qdrant, etc.)
                    </li>
                </ul>
            </div>
        ),
    },
];

type HelpModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [activeTab, setActiveTab] = useState("menu");

    const activeContent = tabs.find((t) => t.id === activeTab)?.content;

    if (!isOpen) return null;

    return (
        <div className="help-overlay" onClick={onClose}>
            <div className="help-modal" onClick={(e) => e.stopPropagation()}>
                <div className="help-header">
                    <h2><FaQuestionCircle /> Guía del Sistema</h2>
                    <button className="help-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="help-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`help-tab ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="help-body">{activeContent}</div>
            </div>
        </div>
    );
}
