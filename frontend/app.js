// Prototipo: sin validación. El formulario envía directo a dashboard.html.
(() => {
  const password = document.getElementById("password");
  const toggleBtn = document.getElementById("toggle-password");

  toggleBtn.addEventListener("click", () => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    toggleBtn.textContent = visible ? "Mostrar" : "Ocultar";
    toggleBtn.setAttribute("aria-pressed", String(!visible));
  });
})();
