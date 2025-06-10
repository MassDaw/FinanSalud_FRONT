const BASE_URL = "https://tfgfinansaludc.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("username-error");
  const passwordError = document.getElementById("password-error");

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let isValid = true;

    // Validar usuario
    if (usernameInput.value.trim() === "") {
      usernameError.textContent = "Por favor, introduce tu nombre de usuario";
      isValid = false;
    } else {
      usernameError.textContent = "";
    }

    // Validar contraseña
    if (passwordInput.value === "") {
      passwordError.textContent = "Por favor, introduce tu contraseña";
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      passwordError.textContent =
          "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    } else {
      passwordError.textContent = "";
    }

    if (!isValid) {
      return;
    }

    // Crear objeto con los datos del formulario
    const formData = {
      username: usernameInput.value,
      password: passwordInput.value,
    };

    // Enviar datos al servidor usando fetch API
    fetch(`${BASE_URL}/api/auth/login`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(formData),
    })
        .then(async (response) => {
          const data = await response.json();
          if (response.ok && data.access_token && data.refresh_token) {
            // Guardar los tokens en localStorage
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);

            // Redireccionar a la página principal si el login es exitoso
            window.location.href = "/dashboard";
          } else {
            // Mostrar mensaje de error si no se reciben los tokens
            passwordError.textContent =
                data.message ||
                "Credenciales incorrectas. Por favor, inténtalo de nuevo.";
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          passwordError.textContent =
              "Ha ocurrido un error al intentar iniciar sesión. Por favor, inténtalo de nuevo más tarde.";
        });
  });
});
