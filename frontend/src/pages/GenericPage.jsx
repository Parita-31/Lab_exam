import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function GenericPage({ title, role }) {
    const userRole = role || (JSON.parse(localStorage.getItem("user") || "{}").role) || "PROFESSOR";

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar role={userRole} />
                <main className="dashboard-content" style={{ flex: 1 }}>
                    <div className="dashboard-header-flex">
                        <div>
                            <h1 className="dashboard-title">{title}</h1>
                            <p className="dashboard-subtitle">Manage your examination {title.toLowerCase()} details.</p>
                        </div>
                    </div>
                    <div className="dashboard-section">
                        <div className="empty-state">
                            <h3>{title} Section</h3>
                            <p>Information for {title.toLowerCase()} is displayed here.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default GenericPage;
