document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("theme-toggle");
    const form = document.getElementById("subscription-form");
    const subscriptionList = document.getElementById("subscription-list");
    const paidList = document.getElementById("paid-list");
    const alerts = document.getElementById("alerts");
    const downloadPdfBtn = document.getElementById("download-pdf");
    const clearSummaryBtn = document.getElementById("clear-summary");
    const undoContainer = document.getElementById("undo-container");
    const undoButton = document.getElementById("undo-button");
    const noPayments = document.getElementById("no-payments");
    const paidTable = document.getElementById("paid-table");
    const noSubscriptions = document.getElementById("no-subscriptions");
    const serviceNameSelect = document.getElementById("service-name");
    const customServiceInput = document.getElementById("custom-service");

    let subscriptions = JSON.parse(localStorage.getItem("subscriptions")) || [];
    let paidSubscriptions = JSON.parse(localStorage.getItem("paidSubscriptions")) || [];
    let deletedSubscriptions = []; // Para almacenar temporalmente los registros eliminados


    // Mostrar u ocultar el campo de servicio personalizado
    serviceNameSelect.addEventListener("change", () => {
        if (serviceNameSelect.value === "Otro") {
            customServiceInput.style.display = "block";
        } else {
            customServiceInput.style.display = "none";
        }
    });

    // Renderizar suscripciones activas
    function renderSubscriptions() {
        subscriptionList.innerHTML = ""; // Limpiar la lista de suscripciones
        const tableHead = document.querySelector("#subscriptions table thead"); // Seleccionar el <thead>
    
        if (subscriptions.length === 0) {
            noSubscriptions.style.display = "block"; // Mostrar mensaje de "No hay suscripciones"
            tableHead.style.display = "none"; // Ocultar el <thead>
        } else {
            noSubscriptions.style.display = "none"; // Ocultar mensaje de "No hay suscripciones"
            tableHead.style.display = "table-header-group"; // Mostrar el <thead>
            subscriptions.forEach((sub, index) => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${sub.service}</td>
                    <td>$${sub.cost}</td>
                    <td>${sub.date}</td>
                    <td>${sub.category}</td>
                    <td>
                        <button class="paid-btn" data-index="${index}">Pagado</button>
                        <button class="delete-btn" data-index="${index}">Eliminar</button>
                    </td>
                `;
                subscriptionList.appendChild(row);
            });
        }
        localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
        checkNotifications();
    }

    // Renderizar resumen de pagos
    function renderPaidSubscriptions() {
        paidList.innerHTML = "";
        if (paidSubscriptions.length === 0) {
            noPayments.style.display = "block";
            paidTable.style.display = "none";
        } else {
            noPayments.style.display = "none";
            paidTable.style.display = "table";
            paidSubscriptions.forEach((sub, index) => {
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${sub.service}</td>
                    <td>$${sub.cost}</td>
                    <td>${sub.date}</td>
                    <td>${sub.category}</td>
                `;
                paidList.appendChild(row);
            });
        }
        localStorage.setItem("paidSubscriptions", JSON.stringify(paidSubscriptions));
    }

    // Eliminar resumen de pagos
    clearSummaryBtn.addEventListener("click", () => {
        if (paidSubscriptions.length > 0) {
            deletedSubscriptions = [...paidSubscriptions]; // Guardar copia para deshacer
            paidSubscriptions = [];
            renderPaidSubscriptions();
            undoContainer.style.display = "block";
            setTimeout(() => {
                undoContainer.style.display = "none";
                deletedSubscriptions = []; // Limpiar la copia después de 5 segundos
            }, 5000);
        }
    });

    // Deshacer eliminación
    undoButton.addEventListener("click", () => {
        if (deletedSubscriptions.length > 0) {
            paidSubscriptions = [...deletedSubscriptions];
            deletedSubscriptions = [];
            renderPaidSubscriptions();
            undoContainer.style.display = "none";
        }
    });

    // Agregar nueva suscripción
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        let service = serviceNameSelect.value;
        let cost = document.getElementById("cost").value;
        let date = document.getElementById("payment-date").value;
        let category = document.getElementById("category").value;

        if (service === "Otro") {
            service = customServiceInput.value;
        }

        if (!service || !cost || !date || !category) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        subscriptions.push({ service, cost, date, category });
        renderSubscriptions();
        form.reset();
        customServiceInput.style.display = "none"; // Ocultar campo personalizado después de agregar
    });

    // Manejar acciones en suscripciones activas (eliminar o marcar como pagado)
    subscriptionList.addEventListener("click", (event) => {
        let index = event.target.getAttribute("data-index");
        if (event.target.classList.contains("delete-btn")) {
            subscriptions.splice(index, 1);
        } else if (event.target.classList.contains("paid-btn")) {
            paidSubscriptions.push(subscriptions[index]);
            subscriptions.splice(index, 1);
            renderPaidSubscriptions();
        }
        renderSubscriptions();
    });

    // Descargar resumen en PDF
    downloadPdfBtn.addEventListener("click", () => {
        const { jsPDF } = window.jspdf;
        let doc = new jsPDF();
        doc.text("Resumen de Pagos", 10, 10);
        paidSubscriptions.forEach((sub, i) => {
            doc.text(`${i + 1}. ${sub.service} - $${sub.cost} - ${sub.date}`, 10, 20 + (i * 10));
        });
        doc.save("Resumen_de_Pagos.pdf");
    });

    // Notificaciones de vencimiento
    function checkNotifications() {
        alerts.innerHTML = "";
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Asegurar comparación solo de fechas

        subscriptions.forEach((sub) => {
            let paymentDate = new Date(sub.date);
            paymentDate.setHours(0, 0, 0, 0);
            let diffDays = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));

            let alert = document.createElement("div");
            alert.classList.add("alert");

            if (diffDays > 0) {
                alert.textContent = `📢 Pago de ${sub.service} vence en ${diffDays} días`;
            } else if (diffDays === 0) {
                alert.textContent = `📢 Pago de ${sub.service} vence hoy`;
            } else {
                alert.textContent = `📢 Pago de ${sub.service} vencido hace ${Math.abs(diffDays)} días`;
                alert.style.backgroundColor = "#ff4d4d"; // Rojo para vencidos
            }

            alerts.appendChild(alert);
        });

        if (subscriptions.length === 0) {
            alerts.innerHTML = `<p class="no-subscriptions">No hay notificaciones pendientes</p>`;
        }
    }

    // Inicializar la aplicación
    renderSubscriptions();
    renderPaidSubscriptions();
});