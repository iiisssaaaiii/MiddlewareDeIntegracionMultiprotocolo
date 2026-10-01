
(() => {
  const form = document.getElementById("login-form");
  const usuario = document.getElementById("usuario");
  const password = document.getElementById("password");
  const toggleBtn = document.getElementById("toggle-password");
  const submitBtn = document.getElementById("submit");
  const status = document.getElementById("form-status");
 
  const MIN_PASSWORD = 8;
 
  // Mostrar / ocultar contraseña
  toggleBtn.addEventListener("click", () => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    toggleBtn.textContent = visible ? "Mostrar" : "Ocultar";
    toggleBtn.setAttribute("aria-pressed", String(!visible));
  });
 
  // Errores por campo
  function setError(input, message) {
    const errorEl = document.getElementById(`${input.id}-error`);
    if (message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      input.setAttribute("aria-invalid", "true");
    } else {
      errorEl.textContent = "";
      errorEl.hidden = true;
      input.removeAttribute("aria-invalid");
    }
  }
 
  function validate() {
    let valid = true;
 
    if (!usuario.value.trim()) {
      setError(usuario, "Ingresa tu usuario o correo.");
      valid = false;
    } else {
      setError(usuario, "");
    }
 
    if (password.value.length < MIN_PASSWORD) {
      setError(password, `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      valid = false;
    } else {
      setError(password, "");
    }
 
    return valid;
  }
 
  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }
 
  // Limpia el error de un campo al escribir
  [usuario, password].forEach((input) =>
    input.addEventListener("input", () => setError(input, ""))
  );
 
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");
 
    if (!validate()) {
      (form.querySelector('[aria-invalid="true"]') || usuario).focus();
      return;
    }
 
    submitBtn.disabled = true;
    submitBtn.textContent = "Verificando...";
 
    try {
      // TODO: reemplaza esta simulación por la llamada real a tu API, por ejemplo:
      // const res = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     usuario: usuario.value.trim(),
      //     password: password.value,
      //     recordar: form.recordar.checked,
      //   }),
      // });
      // if (!res.ok) throw new Error("Credenciales incorrectas.");
      await new Promise((resolve) => setTimeout(resolve, 900));
 
      setStatus("Sesión iniciada. Redirigiendo a la consola...");
      // window.location.href = "/dashboard";
    } catch (error) {
      setStatus(error.message || "No se pudo iniciar sesión. Intenta de nuevo.", true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Iniciar sesión";
    }
  });
})();