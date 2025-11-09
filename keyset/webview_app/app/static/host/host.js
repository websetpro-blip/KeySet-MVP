(() => {
  const frame = document.getElementById("module-frame");
  const buttons = Array.from(document.querySelectorAll("[data-module]"));

  if (!frame) {
    console.error("Module frame element not found");
    return;
  }

  const setActive = (name) => {
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.module === name);
    });
  };

  const loadModule = (name) => {
    frame.src = `../${name}/index.html`;
    setActive(name);
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => loadModule(btn.dataset.module));
  });

  // ensure initial state reflects iframe src
  setActive("accounts");
})();
